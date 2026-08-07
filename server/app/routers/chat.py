"""
AgriSense AI — Conversational Router
======================================
FastAPI routes for the Conversational Intelligence Engine (CIE).
"""

import uuid
from typing import Any, Dict, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.chat import ChatSession, ChatMessage, ChatFeedback, ToolRegistry
from app.security import get_current_user
from app.services.ai.conversational import ConversationalIntelligenceService
from app.services.ai.tool_registry import ToolRegistryService
from app.utils.logger import get_logger

logger = get_logger("agrisense.cie.router")

router = APIRouter(prefix="/chat", tags=["CIE Chat"])


# --- Request/Response Schemas ---

class ChatSendRequest(BaseModel):
    message: str
    session_id: Optional[uuid.UUID] = None
    page_context: Optional[str] = None


class ChatSendResponse(BaseModel):
    session_id: str
    message_id: str
    response_text: str
    intent: str
    confidence: float
    tool_used: Optional[str] = None
    action_result: Optional[Dict[str, Any]] = None
    needs_confirmation: bool
    confirmation_data: Optional[Dict[str, Any]] = None
    suggestions: List[str]


class SessionListItem(BaseModel):
    id: str
    title: Optional[str]
    language: str
    message_count: int
    started_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    intent: Optional[str] = None
    tool_name: Optional[str] = None
    action_taken: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackRequest(BaseModel):
    message_id: uuid.UUID
    rating: int
    was_helpful: bool
    correction: Optional[str] = None


# --- Endpoints ---

@router.post("/send")
async def send_chat_message(
    body: ChatSendRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Core chat endpoint. Evaluates prompt context, runs dynamic RAG, selects tools,
    runs intent classifiers, manages confirmations, and registers message logs.
    Supports standard JSON responses and text/event-stream SSE responses.
    """
    user_id = uuid.UUID(current_user["user_id"])
    accept_header = request.headers.get("accept", "")

    if "text/event-stream" in accept_header:
        async def event_generator():
            try:
                # 1. Signal thinking/processing
                yield "event: thinking\ndata: {}\n\n".format(json.dumps({"status": "processing"}))
                await asyncio.sleep(0.1)

                # 2. Run core processing logic
                response_payload = await ConversationalIntelligenceService.process_message(
                    message=body.message,
                    user_id=user_id,
                    db=db,
                    session_id=body.session_id,
                    page_context=body.page_context
                )

                # 3. Stream tool call events if a tool was executed
                tool_used = response_payload.get("tool_used")
                action_result = response_payload.get("action_result")
                if tool_used:
                    yield "event: tool_call\ndata: {}\n\n".format(
                        json.dumps({
                            "tool": tool_used,
                            "action": response_payload.get("intent", "call"),
                            "status": "calling"
                        })
                    )
                    await asyncio.sleep(0.4)

                    if action_result:
                        yield "event: tool_result\ndata: {}\n\n".format(json.dumps(action_result))
                        await asyncio.sleep(0.2)

                # 4. Stream response tokens
                response_text = response_payload.get("response_text", "")
                
                # Stream word-by-word with realistic typing cadence
                words = response_text.split(" ")
                for i, word in enumerate(words):
                    spacer = " " if i < len(words) - 1 else ""
                    yield "event: token\ndata: {}\n\n".format(json.dumps({"text": word + spacer}))
                    await asyncio.sleep(0.04)

                # 5. Signal completion with full payload
                done_payload = {
                    "session_id": response_payload.get("session_id"),
                    "message_id": response_payload.get("message_id"),
                    "intent": response_payload.get("intent"),
                    "confidence": response_payload.get("confidence"),
                    "needs_confirmation": response_payload.get("needs_confirmation"),
                    "confirmation_data": response_payload.get("confirmation_data"),
                    "suggestions": response_payload.get("suggestions", []),
                    "tool_used": tool_used,
                    "action_result": action_result
                }
                yield "event: done\ndata: {}\n\n".format(json.dumps(done_payload))

            except Exception as e:
                logger.exception("SSE stream processing failed")
                yield "event: error\ndata: {}\n\n".format(json.dumps({"detail": "An error occurred during message streaming."}))

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    try:
        response_payload = await ConversationalIntelligenceService.process_message(
            message=body.message,
            user_id=user_id,
            db=db,
            session_id=body.session_id,
            page_context=body.page_context
        )
        return response_payload
    except Exception as e:
        logger.exception("Failed to process CIE message")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the request."
        )


@router.post("/sessions/{session_id}/close", status_code=status.HTTP_200_OK)
async def close_chat_session(
    session_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Explicitly closes an active chat session."""
    user_id = uuid.UUID(current_user["user_id"])
    closed = await ConversationalIntelligenceService.close_session(session_id, user_id, db)
    if not closed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active session not found or already closed."
        )
    return {"status": "success", "message": "Session closed successfully."}


@router.get("/sessions", response_model=List[SessionListItem])
async def list_chat_sessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all chat sessions for the authenticated user."""
    user_id = uuid.UUID(current_user["user_id"])
    query = (
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(desc(ChatSession.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    sessions = result.scalars().all()
    return sessions


@router.get("/sessions/{session_id}", response_model=List[ChatMessageResponse])
async def get_session_history(
    session_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves chronological message history for a specific session."""
    user_id = uuid.UUID(current_user["user_id"])
    # Verify ownership of session
    sq = select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id)
    sr = await db.execute(sq)
    session = sr.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    mq = select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at)
    mr = await db.execute(mq)
    messages = mr.scalars().all()
    return messages


@router.post("/feedback", status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    body: FeedbackRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Logs user feedback (ratings and manual corrections) for an assistant message."""
    user_id = uuid.UUID(current_user["user_id"])

    # Verify message ownership/history references the user session
    mq = select(ChatMessage).join(ChatSession).where(
        ChatMessage.id == body.message_id,
        ChatSession.user_id == user_id
    )
    mr = await db.execute(mq)
    message = mr.scalar_one_or_none()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message record not found."
        )

    # Save feedback
    feedback = ChatFeedback(
        message_id=body.message_id,
        user_id=user_id,
        rating=body.rating,
        was_helpful=body.was_helpful,
        correction=body.correction
    )
    db.add(feedback)
    await db.flush()
    return {"status": "success", "message": "Feedback submitted successfully."}


@router.get("/tools")
async def list_tools(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lists CIE tools from registry (Admin / Coordinate roles only)."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can view the tool registry status."
        )

    q = select(ToolRegistry)
    r = await db.execute(q)
    tools = r.scalars().all()
    return tools

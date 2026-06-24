"""
AgriSense AI — File Security Utilities
==========================================
Validates uploaded files for type, size, and content safety.
"""

import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import get_settings

settings = get_settings()

# Magic bytes for allowed image types
MAGIC_BYTES = {
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/webp": [b"RIFF"],
}


async def validate_upload(file: UploadFile) -> None:
    """
    Validate an uploaded file for security.

    Checks:
    1. File size within limits
    2. MIME type is allowed
    3. File content matches declared MIME type (magic bytes)

    Raises:
        HTTPException 400: If validation fails.
    """
    # --- Check file size ---
    content = await file.read()
    await file.seek(0)  # Reset for downstream use

    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum of {settings.MAX_FILE_SIZE_MB}MB",
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file uploaded",
        )

    # --- Check MIME type ---
    content_type = file.content_type or ""
    if content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{content_type}' not allowed. Accepted: {settings.ALLOWED_IMAGE_TYPES}",
        )

    # --- Magic byte verification ---
    magic_signatures = MAGIC_BYTES.get(content_type, [])
    if magic_signatures:
        is_valid = any(content.startswith(sig) for sig in magic_signatures)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content does not match declared type. Possible tampering detected.",
            )


async def save_upload(
    file: UploadFile,
    subfolder: str = "general",
) -> str:
    """
    Save an uploaded file securely with a UUID filename.

    Args:
        file: The uploaded file.
        subfolder: Subdirectory within uploads (e.g., "crops", "packets").

    Returns:
        The relative path to the saved file.
    """
    # Validate first
    await validate_upload(file)

    # Generate secure filename (UUID prevents path traversal)
    ext = Path(file.filename or "file").suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        ext = ".jpg"  # Default to jpg

    secure_filename = f"{uuid.uuid4()}{ext}"
    upload_dir = Path(settings.UPLOAD_DIR) / subfolder
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / secure_filename

    # Write file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    return str(Path(subfolder) / secure_filename)


def delete_upload(relative_path: str) -> bool:
    """
    Delete an uploaded file.

    Args:
        relative_path: Relative path within the uploads directory.

    Returns:
        True if deleted, False if file didn't exist.
    """
    file_path = Path(settings.UPLOAD_DIR) / relative_path
    if file_path.exists() and file_path.is_file():
        os.remove(file_path)
        return True
    return False

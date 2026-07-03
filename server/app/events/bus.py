"""
AgriSense AI — Event Bus
============================
Simple in-process event bus with typed handler registration.
Handlers are dispatched synchronously in the current context
(which may then dispatch async tasks like Celery).
"""

from collections import defaultdict
from typing import Any, Callable

from app.events.events import DomainEvent
from app.utils.logger import get_logger

logger = get_logger("agrisense.events")


class EventBus:
    """Simple publish/subscribe event bus.

    Handlers are registered by event type. When an event is published,
    all registered handlers for that type are invoked in registration order.

    Usage:
        bus = EventBus()
        bus.subscribe(CropImageUploaded, handle_crop_upload)
        await bus.publish(CropImageUploaded(record_id=..., ...))
    """

    def __init__(self):
        self._handlers: dict[type, list[Callable]] = defaultdict(list)

    def subscribe(
        self, event_type: type[DomainEvent], handler: Callable
    ) -> None:
        """Register a handler for an event type."""
        self._handlers[event_type].append(handler)
        logger.info(
            "Event handler registered",
            event=event_type.__name__,
            handler=handler.__name__,
        )

    async def publish(self, event: DomainEvent) -> None:
        """Dispatch an event to all registered handlers.

        Handlers may be sync or async — both are supported.
        """
        event_type = type(event)
        handlers = self._handlers.get(event_type, [])

        if not handlers:
            logger.debug(
                "No handlers for event",
                event=event_type.__name__,
            )
            return

        for handler in handlers:
            try:
                import asyncio
                if asyncio.iscoroutinefunction(handler):
                    await handler(event)
                else:
                    handler(event)
            except Exception as e:
                logger.error(
                    "Event handler failed",
                    event=event_type.__name__,
                    handler=handler.__name__,
                    error=str(e),
                )


# --- Singleton event bus ---
event_bus = EventBus()


def _register_default_handlers() -> None:
    """Wire default event handlers (called at app startup)."""
    from app.events.handlers import (
        handle_crop_image_uploaded,
        handle_weather_poll_requested,
    )
    from app.events.events import CropImageUploaded, WeatherPollRequested

    event_bus.subscribe(CropImageUploaded, handle_crop_image_uploaded)
    event_bus.subscribe(WeatherPollRequested, handle_weather_poll_requested)


# Auto-register on import
_register_default_handlers()

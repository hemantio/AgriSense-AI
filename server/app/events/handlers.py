"""
AgriSense AI — Event Handlers
=================================
Handlers that react to domain events by dispatching background tasks.
This layer decouples routers from Celery — routers publish events,
handlers dispatch to the task queue.
"""

from app.events.events import CropImageUploaded, WeatherPollRequested
from app.utils.logger import get_logger

logger = get_logger("agrisense.events.handlers")


def handle_crop_image_uploaded(event: CropImageUploaded) -> None:
    """Dispatch crop health analysis to Celery when an image is uploaded."""
    from app.worker import analyze_crop_health_task

    logger.info(
        "Dispatching crop health analysis",
        record_id=str(event.record_id),
        plot_id=str(event.plot_id),
    )
    analyze_crop_health_task.delay(str(event.record_id))


def handle_weather_poll_requested(event: WeatherPollRequested) -> None:
    """Dispatch weather polling to Celery for a specific plot."""
    from app.worker import poll_weather_data_task

    logger.info(
        "Dispatching weather poll",
        plot_id=str(event.plot_id),
    )
    poll_weather_data_task.delay()

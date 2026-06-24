"""
AgriSense AI — Weather Service
==================================
OpenWeatherMap API integration for location-based weather intelligence.
"""

import httpx

from app.config import get_settings
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger("agrisense.weather")


class WeatherService:
    """Service for fetching and processing weather data."""

    def __init__(self):
        self.api_key = settings.OPENWEATHER_API_KEY
        self.base_url = settings.OPENWEATHER_BASE_URL

    async def get_current_weather(
        self, latitude: float, longitude: float
    ) -> dict:
        """
        Fetch current weather for a location.

        Args:
            latitude: Location latitude.
            longitude: Location longitude.

        Returns:
            Processed weather data dictionary.
        """
        if not self.api_key:
            logger.warning("OpenWeatherMap API key not configured")
            return self._mock_weather(latitude, longitude)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/weather",
                    params={
                        "lat": latitude,
                        "lon": longitude,
                        "appid": self.api_key,
                        "units": "metric",
                    },
                )
                response.raise_for_status()
                data = response.json()

            return self._process_current_weather(data)

        except httpx.TimeoutException:
            logger.error("Weather API timeout")
            return self._mock_weather(latitude, longitude, error="API timeout")
        except httpx.HTTPStatusError as e:
            logger.error("Weather API error", status=e.response.status_code)
            return self._mock_weather(latitude, longitude, error=f"API error: {e.response.status_code}")
        except Exception as e:
            logger.error("Weather fetch failed", error=str(e))
            return self._mock_weather(latitude, longitude, error=str(e))

    async def get_forecast(
        self, latitude: float, longitude: float
    ) -> list[dict]:
        """
        Fetch 5-day weather forecast.

        Args:
            latitude: Location latitude.
            longitude: Location longitude.

        Returns:
            List of forecast data dictionaries.
        """
        if not self.api_key:
            return []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/forecast",
                    params={
                        "lat": latitude,
                        "lon": longitude,
                        "appid": self.api_key,
                        "units": "metric",
                    },
                )
                response.raise_for_status()
                data = response.json()

            forecasts = []
            for item in data.get("list", []):
                forecasts.append(self._process_forecast_item(item))

            return forecasts

        except Exception as e:
            logger.error("Forecast fetch failed", error=str(e))
            return []

    def classify_alert(self, weather_data: dict) -> dict:
        """
        Classify weather conditions into alert levels.

        Returns:
            Dictionary with alert_status, alert_type, and alert_message.
        """
        temp = weather_data.get("temperature_celsius", 25)
        humidity = weather_data.get("humidity_percent", 50)
        rain_prob = weather_data.get("rain_probability", 0)
        rainfall = weather_data.get("rainfall_mm", 0)
        wind = weather_data.get("wind_speed_kmh", 0)

        # Severe conditions
        if temp > 45:
            return {
                "alert_status": "severe",
                "alert_type": "heat",
                "alert_message": f"Extreme heat warning! Temperature: {temp}°C. Protect crops and ensure adequate irrigation.",
            }
        if rainfall > 50:
            return {
                "alert_status": "severe",
                "alert_type": "rain",
                "alert_message": f"Heavy rainfall alert! Expected: {rainfall}mm. Delay spraying and ensure drainage.",
            }
        if wind > 60:
            return {
                "alert_status": "severe",
                "alert_type": "storm",
                "alert_message": f"Storm warning! Wind speed: {wind} km/h. Secure crops and equipment.",
            }

        # Warning conditions
        if temp > 40:
            return {
                "alert_status": "warning",
                "alert_type": "heat",
                "alert_message": f"Heat warning. Temperature: {temp}°C. Increase watering frequency.",
            }
        if rain_prob > 70:
            return {
                "alert_status": "warning",
                "alert_type": "rain",
                "alert_message": f"Rain likely ({rain_prob}%). Postpone fertilizer application.",
            }
        if humidity < 20:
            return {
                "alert_status": "warning",
                "alert_type": "drought",
                "alert_message": f"Low humidity ({humidity}%). Monitor soil moisture and irrigate as needed.",
            }
        if temp < 5:
            return {
                "alert_status": "warning",
                "alert_type": "frost",
                "alert_message": f"Frost risk! Temperature: {temp}°C. Cover sensitive crops.",
            }

        # Advisory conditions
        if rain_prob > 40:
            return {
                "alert_status": "advisory",
                "alert_type": "rain",
                "alert_message": f"Rain possible ({rain_prob}%). Consider delaying outdoor activities.",
            }
        if temp > 35:
            return {
                "alert_status": "advisory",
                "alert_type": "heat",
                "alert_message": f"Warm conditions ({temp}°C). Ensure adequate irrigation.",
            }

        return {
            "alert_status": "normal",
            "alert_type": None,
            "alert_message": None,
        }

    def _process_current_weather(self, data: dict) -> dict:
        """Process raw OpenWeatherMap current weather response."""
        main = data.get("main", {})
        wind = data.get("wind", {})
        weather = data.get("weather", [{}])[0]
        rain = data.get("rain", {})

        return {
            "location_name": data.get("name", "Unknown"),
            "temperature_celsius": main.get("temp"),
            "feels_like_celsius": main.get("feels_like"),
            "humidity_percent": main.get("humidity"),
            "rain_probability": 0,  # Not in current weather, only forecast
            "rainfall_mm": rain.get("1h", 0),
            "wind_speed_kmh": (wind.get("speed", 0) or 0) * 3.6,  # m/s to km/h
            "weather_description": weather.get("description", ""),
            "weather_icon": weather.get("icon", ""),
            "source": "openweathermap",
            "raw_response": str(data),
        }

    def _process_forecast_item(self, item: dict) -> dict:
        """Process a single forecast item from the 5-day forecast."""
        main = item.get("main", {})
        wind = item.get("wind", {})
        weather = item.get("weather", [{}])[0]
        rain = item.get("rain", {})
        pop = item.get("pop", 0)

        return {
            "temperature_celsius": main.get("temp"),
            "feels_like_celsius": main.get("feels_like"),
            "humidity_percent": main.get("humidity"),
            "rain_probability": pop * 100,
            "rainfall_mm": rain.get("3h", 0),
            "wind_speed_kmh": (wind.get("speed", 0) or 0) * 3.6,
            "weather_description": weather.get("description", ""),
            "weather_icon": weather.get("icon", ""),
            "forecast_date": item.get("dt_txt"),
            "is_forecast": True,
            "source": "openweathermap",
        }

    def _mock_weather(
        self, lat: float, lon: float, error: str | None = None
    ) -> dict:
        """Return mock weather data for development."""
        return {
            "location_name": f"Location ({lat:.2f}, {lon:.2f})",
            "temperature_celsius": 32.0,
            "feels_like_celsius": 35.0,
            "humidity_percent": 65.0,
            "rain_probability": 30.0,
            "rainfall_mm": 0.0,
            "wind_speed_kmh": 12.0,
            "weather_description": "partly cloudy (mock data)",
            "weather_icon": "02d",
            "source": "mock",
            "raw_response": error or "API key not configured",
        }


# Singleton instance
weather_service = WeatherService()

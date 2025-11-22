'use client';

import { useEffect, useState } from 'react';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
  feelsLike: number;
}

export default function WeatherDisplay() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Get user's location
        const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            (err) => reject(err)
          );
        });

        // Call API route instead of OpenWeather directly
        const response = await fetch(
          `/api/weather?lat=${position.latitude}&lon=${position.longitude}`
        );

        if (!response.ok) throw new Error('Failed to fetch weather');

        const data = await response.json();
        const weather = {
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].main,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          location: data.name,
          feelsLike: Math.round(data.main.feels_like),
        };

        setWeatherData(weather);

        // Send weather data to backend
        await fetch('http://localhost:5000/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            temperature: weather.temperature,
            feels_like: weather.feelsLike,
            humidity: weather.humidity,
            wind_speed: weather.windSpeed,
            condition: weather.condition,
            location: weather.location,
            timestamp: new Date().toISOString(),
          }),
        });

        console.log('Weather data sent to backend:', weather);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unable to fetch weather';
        console.error('Weather fetch error:', errorMessage);
      }
    };

    fetchWeather();
  }, []);

  return null;
}

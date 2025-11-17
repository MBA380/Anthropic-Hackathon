'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Call OpenWeatherMap API
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${position.latitude}&lon=${position.longitude}&appid=${apiKey}&units=metric`
        );

        if (!response.ok) throw new Error('Failed to fetch weather');

        const data = await response.json();
        setWeatherData({
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].main,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          location: data.name,
          feelsLike: Math.round(data.main.feels_like),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to fetch weather');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) return <div className="p-4">Loading weather...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!weatherData) return null;

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-md border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-xl">Current Weather</CardTitle>
        <CardDescription>Environmental context</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Location</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {weatherData.location}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
            <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Temperature
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {weatherData.temperature}°C
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Feels like {weatherData.feelsLike}°C
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
            <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Condition
            </p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {weatherData.condition}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
            <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Humidity
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {weatherData.humidity}%
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
            <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Wind Speed
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {weatherData.windSpeed} m/s
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
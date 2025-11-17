'use client';

import { useState } from 'react';
import BehaviorPredictionForm from '@/components/behavior-prediction-form';
import WeatherDisplay from '@/components/weather-display';
import PredictionResult from '@/components/prediction-result';

export default function Home() {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (formData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to get prediction');
      }

      const result = await response.json();
      setPrediction(result);
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Behavior Insights
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                Autism Behavior Prediction System for Caregivers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <BehaviorPredictionForm 
              onSubmit={handleFormSubmit} 
              isLoading={loading}
            />
          </div>

          {/* Right Column - Weather & Results */}
          <div className="space-y-8">
            <WeatherDisplay />
            {prediction && <PredictionResult data={prediction} />}
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import BehaviorPredictionForm from '@/components/behavior-prediction-form';
import WeatherDisplay from '@/components/weather-display';
import PredictionResult from '@/components/prediction-result';
import { ChatAgentOverlay } from '@/components/chatbot/agent_overlay';

export default function Home() {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

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
      setShowResults(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAssessment = () => {
    setShowResults(false);
    setPrediction(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Behavior Insights
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2 text-lg">
                AI-Powered Autism Behavior Prediction System for Caregivers
              </p>
            </div>
            <div className="hidden md:block">
              <div className="text-4xl">🧠✨</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!showResults ? (
          /* Assessment Form View */
          <div className="max-w-4xl mx-auto">
            <BehaviorPredictionForm
              onSubmit={handleFormSubmit} 
              isLoading={loading}
            />
          </div>
        ) : (
          <div className="mt-8">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl shadow-emerald-500/10">
              {/* Results header */}
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700 px-6 pt-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      Prediction Results
                    </h2>
                  </div>
                  <button
                    onClick={handleNewAssessment}
                    className="text-sm px-3 py-1 rounded-full border border-emerald-500/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    Start New Assessment
                  </button>
                </div>
              </div>

              {/* Result content */}
              <div className="p-6 md:p-8">
                <div className="animate-fade-in">
                  <PredictionResult data={prediction} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weather display renders invisibly to fetch weather data in background */}
      <WeatherDisplay />

      {/* Floating chat bubble in the bottom-right, only after there is a prediction */}
      {prediction && <ChatAgentOverlay />}
    </main>
  );
}

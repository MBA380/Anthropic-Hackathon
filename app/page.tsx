'use client';

import { useState } from 'react';
import BehaviorPredictionForm from '@/components/behavior-prediction-form';
import WeatherDisplay from '@/components/weather-display';
import PredictionResult from '@/components/prediction-result';

export default function Home() {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<'results' | 'chatbot'>('results');

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
      setActiveResultTab('results');
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
    setActiveResultTab('results');
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
          /* Results View with Tabs */
          <div className="space-y-6 animate-fade-in">
            {/* Back Button */}
            <button
              onClick={handleNewAssessment}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              New Assessment
            </button>

            {/* Results Card with Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Tab Navigation */}
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
                <div className="flex">
                  <button
                    onClick={() => setActiveResultTab('results')}
                    className={`flex-1 px-6 py-4 text-base font-semibold transition-all relative
                      ${activeResultTab === 'results'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">📊</span>
                      <span>Prediction Results</span>
                    </div>
                    {activeResultTab === 'results' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-green-600"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveResultTab('chatbot')}
                    className={`flex-1 px-6 py-4 text-base font-semibold transition-all relative
                      ${activeResultTab === 'chatbot'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">💬</span>
                      <span>AI Assistant</span>
                    </div>
                    {activeResultTab === 'chatbot' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-green-600"></div>
                    )}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 md:p-8">
                {activeResultTab === 'results' ? (
                  <div className="animate-fade-in">
                    <PredictionResult data={prediction} />
                  </div>
                ) : (
                  <div className="animate-fade-in min-h-[500px]">
                    {/* Chatbot Placeholder */}
                    <div className="h-full flex flex-col">
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-900/40 p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-900 mb-4">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                          <span>🤖</span> AI Assistant
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          Chat with our AI assistant to discuss the prediction results and get personalized advice.
                        </p>
                      </div>

                      {/* Chat Messages Area */}
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 mb-4 border-2 border-slate-200 dark:border-slate-700 min-h-[300px]">
                        <div className="text-center text-slate-500 dark:text-slate-400 py-12">
                          <div className="text-6xl mb-4">💬</div>
                          <p className="text-lg font-medium mb-2">Chatbot Coming Soon</p>
                          <p className="text-sm">This feature will be implemented using LangGraph and Claude AI</p>
                          <p className="text-sm mt-2">You'll be able to discuss the prediction results and get personalized guidance</p>
                        </div>
                      </div>

                      {/* Chat Input Area */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type your message here..."
                          disabled
                          className="flex-1 px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        />
                        <button
                          disabled
                          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg opacity-50 cursor-not-allowed"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weather display renders invisibly to fetch weather data in background */}
      <WeatherDisplay />
    </main>
  );
}

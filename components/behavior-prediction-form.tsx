'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MealEntry {
  id: string;
  type: 'meal' | 'snack';
  time: string;
}

interface BathroomEntry {
  id: string;
  type: 'no void' | 'urine' | 'bowel movement' | 'urine accident' | 'bowel movement accident';
  time: string;
}

interface FormData {
  sleepQuality: string;
  predictionTime: string;
  meals: MealEntry[];
  bathroomVisits: BathroomEntry[];
  socialInteractionContext: string;
  transitionType: string;
}

interface BehaviorPredictionFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

const getTimeOneHourFromNow = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  return now.toTimeString().slice(0, 5);
};

export default function BehaviorPredictionForm({
  onSubmit,
  isLoading,
}: BehaviorPredictionFormProps) {
  const [activeTab, setActiveTab] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    sleepQuality: '',
    predictionTime: getTimeOneHourFromNow(),
    meals: [],
    bathroomVisits: [],
    socialInteractionContext: '',
    transitionType: 'none',
  });

  const [mealType, setMealType] = useState<'meal' | 'snack'>('meal');
  const [mealTime, setMealTime] = useState('');

  const [bathroomType, setBathroomType] = useState('no void');
  const [bathroomTime, setBathroomTime] = useState('');

  useEffect(() => {
    setMealTime(getCurrentTime());
    setBathroomTime(getCurrentTime());
  }, []);

  const tabs = [
    { id: 0, name: 'Social & Environment', icon: '👥' },
    { id: 1, name: 'Meals & Snacks', icon: '🍽️' },
    { id: 2, name: 'Bathroom', icon: '🚽' },
    { id: 3, name: 'Time Query', icon: '⏰' },
  ];

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddMeal = () => {
    if (!mealType || !mealTime) {
      alert('Please select meal type and time');
      return;
    }

    const newMeal: MealEntry = {
      id: Date.now().toString(),
      type: mealType,
      time: mealTime,
    };

    setFormData((prev) => ({
      ...prev,
      meals: [...prev.meals, newMeal],
    }));

    setMealType('meal');
    setMealTime(getCurrentTime());
  };

  const handleRemoveMeal = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      meals: prev.meals.filter((meal) => meal.id !== id),
    }));
  };

  const handleAddBathroom = () => {
    if (!bathroomType || !bathroomTime) {
      alert('Please select bathroom type and time');
      return;
    }

    const newBathroom: BathroomEntry = {
      id: Date.now().toString(),
      type: bathroomType as BathroomEntry['type'],
      time: bathroomTime,
    };

    setFormData((prev) => ({
      ...prev,
      bathroomVisits: [...prev.bathroomVisits, newBathroom],
    }));

    setBathroomType('no void');
    setBathroomTime(getCurrentTime());
  };

  const handleRemoveBathroom = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      bathroomVisits: prev.bathroomVisits.filter((visit) => visit.id !== id),
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.sleepQuality || !formData.socialInteractionContext) {
      alert('Please fill in all required fields (Sleep Quality and Social Interaction Context)');
      return;
    }

    onSubmit(formData);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Sleep Quality */}
            <div className="space-y-3">
              <label className="block text-base font-semibold text-slate-800 dark:text-slate-200">
                Sleep Quality *
              </label>
              <Select value={formData.sleepQuality} onValueChange={(value) => handleSelectChange('sleepQuality', value)}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 h-12 text-base hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                  <SelectValue placeholder="Select sleep quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poor">😴 Poor (Less than 5 hours or very disrupted)</SelectItem>
                  <SelectItem value="fair">😐 Fair (5-7 hours or interrupted sleep)</SelectItem>
                  <SelectItem value="good">😊 Good (7-9 hours of restful sleep)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Social Interaction Context */}
            <div className="space-y-3">
              <label className="block text-base font-semibold text-slate-800 dark:text-slate-200">
                Social Interaction Context *
              </label>
              <Select value={formData.socialInteractionContext} onValueChange={(value) => handleSelectChange('socialInteractionContext', value)}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 h-12 text-base hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                  <SelectValue placeholder="Select interaction context" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alone">👤 Alone with therapist</SelectItem>
                  <SelectItem value="plus_one">👥 Therapist plus 1 peer</SelectItem>
                  <SelectItem value="small_group">👥👥 Small group (2-3 peers)</SelectItem>
                  <SelectItem value="large_group">👥👥👥 Large group (4+ peers)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transition Type */}
            <div className="space-y-3">
              <label className="block text-base font-semibold text-slate-800 dark:text-slate-200">
                Transition Type
              </label>
              <Select value={formData.transitionType} onValueChange={(value) => handleSelectChange('transitionType', value)}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 h-12 text-base hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                  <SelectValue placeholder="Select transition type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">✅ None</SelectItem>
                  <SelectItem value="minor">🟡 Minor</SelectItem>
                  <SelectItem value="moderate">🟠 Moderate</SelectItem>
                  <SelectItem value="major">🔴 Major</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-4 p-5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border-2 border-orange-200 dark:border-orange-900">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>🍽️</span> Add Meal or Snack
              </h3>

              <div className="space-y-3 p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Type</label>
                    <Select value={mealType} onValueChange={(value: any) => setMealType(value)}>
                      <SelectTrigger className="bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 h-11 hover:border-orange-400 dark:hover:border-orange-500 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meal">🍽️ Meal</SelectItem>
                        <SelectItem value="snack">🍪 Snack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Time</label>
                    <input
                      type="time"
                      value={mealTime}
                      onChange={(e) => setMealTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleAddMeal}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-base py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  + Add Meal/Snack
                </Button>
              </div>

              {/* Display added meals */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Logged Entries ({formData.meals.length})</h4>
                {formData.meals.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">No meals added yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {formData.meals.map((meal) => (
                      <div key={meal.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-base text-slate-800 dark:text-slate-200 font-medium">
                          {meal.type === 'meal' ? '🍽️' : '🍪'} <span className="capitalize">{meal.type}</span> at {meal.time}
                        </span>
                        <Button
                          type="button"
                          onClick={() => handleRemoveMeal(meal.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 h-auto rounded-md shadow-sm hover:shadow transition-all"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-4 p-5 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border-2 border-teal-200 dark:border-teal-900">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>🚽</span> Log Bathroom Visit
              </h3>

              <div className="space-y-3 p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Type</label>
                    <Select value={bathroomType} onValueChange={(value) => setBathroomType(value)}>
                      <SelectTrigger className="bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 h-11 hover:border-teal-400 dark:hover:border-teal-500 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no void">❌ No Void</SelectItem>
                        <SelectItem value="urine">💧 Urine</SelectItem>
                        <SelectItem value="bowel movement">💩 Bowel Movement</SelectItem>
                        <SelectItem value="urine accident">⚠️ Urine Accident</SelectItem>
                        <SelectItem value="bowel movement accident">⚠️ Bowel Movement Accident</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Time</label>
                    <input
                      type="time"
                      value={bathroomTime}
                      onChange={(e) => setBathroomTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleAddBathroom}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold text-base py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  + Add Bathroom Visit
                </Button>
              </div>

              {/* Display added bathroom visits */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Logged Entries ({formData.bathroomVisits.length})</h4>
                {formData.bathroomVisits.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">No bathroom visits logged yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {formData.bathroomVisits.map((visit) => (
                      <div key={visit.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-base text-slate-800 dark:text-slate-200 font-medium">
                          <span className="capitalize">{visit.type}</span> at {visit.time}
                        </span>
                        <Button
                          type="button"
                          onClick={() => handleRemoveBathroom(visit.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 h-auto rounded-md shadow-sm hover:shadow transition-all"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Predict for Specific Time */}
            <div className="space-y-4">
              <label className="block text-base font-semibold text-slate-800 dark:text-slate-200">
                ⏰ Prediction Time
              </label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Select the time you want to predict behavior for. Default is one hour from now.
              </p>
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border-2 border-blue-200 dark:border-blue-900">
                <input
                  type="time"
                  value={formData.predictionTime}
                  onChange={(e) => handleSelectChange('predictionTime', e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pb-8 -mt-6 pt-8">
        <CardTitle className="text-3xl font-bold">Behavior Assessment</CardTitle>
        <CardDescription className="text-blue-100 text-base">
          Complete all sections to receive a behavior prediction
        </CardDescription>
      </CardHeader>

      {/* Tab Navigation */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] px-4 py-4 text-sm font-semibold transition-all relative
                ${activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">{tab.icon}</span>
                <span>{tab.name}</span>
              </div>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <CardContent className="p-6 md:p-8">
        {/* Tab Content */}
        <div className="min-h-[400px] mb-6">
          {renderTabContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
            disabled={activeTab === 0}
            className="bg-slate-500 hover:bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </Button>

          <div className="flex gap-2">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 dark:bg-blue-400 w-8'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              ></div>
            ))}
          </div>

          {activeTab < tabs.length - 1 ? (
            <Button
              type="button"
              onClick={() => setActiveTab(Math.min(tabs.length - 1, activeTab + 1))}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Next →
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                '🎯 Get Prediction'
              )}
            </Button>
          )}
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 text-center pt-2">
          * Required fields
        </p>
      </CardContent>
    </Card>
  );
}
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
  socialInteractionLevel: string;
  recentTransitions: number;
}

interface BehaviorPredictionFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

export default function BehaviorPredictionForm({
  onSubmit,
  isLoading,
}: BehaviorPredictionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    sleepQuality: '',
    predictionTime: '',
    meals: [],
    bathroomVisits: [],
    socialInteractionLevel: '',
    recentTransitions: 0,
  });

  const [mealType, setMealType] = useState<'meal' | 'snack'>('meal');
  const [mealTime, setMealTime] = useState('');

  const [bathroomType, setBathroomType] = useState('no void');
  const [bathroomTime, setBathroomTime] = useState('');

  useEffect(() => {
    setMealTime(getCurrentTime());
    setBathroomTime(getCurrentTime());
  }, []);

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumberChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: parseInt(value) || 0,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.sleepQuality || !formData.socialInteractionLevel) {
      alert('Please fill in all required fields');
      return;
    }

    onSubmit(formData);
  };

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-md border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-2xl">Behavior Prediction Assessment</CardTitle>
        <CardDescription>
          Enter the contextual factors to predict behavior patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sleep Quality */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Sleep Quality *
            </label>
            <Select value={formData.sleepQuality} onValueChange={(value) => handleSelectChange('sleepQuality', value)}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                <SelectValue placeholder="Select sleep quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="poor">Poor (Less than 5 hours or very disrupted)</SelectItem>
                <SelectItem value="fair">Fair (5-7 hours or interrupted sleep)</SelectItem>
                <SelectItem value="good">Good (7-9 hours of restful sleep)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Predict for Specific Time */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="specificTime"
                checked={formData.predictionTime !== ''}
                onChange={(e) => handleSelectChange('predictionTime', e.target.checked ? '12:00' : '')}
                className="w-4 h-4 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="specificTime" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Predict for a specific time
              </label>
            </div>

            {/* Prediction Time Input (shown only when checkbox is checked) */}
            {formData.predictionTime !== '' && (
              <input
                type="time"
                value={formData.predictionTime}
                onChange={(e) => handleSelectChange('predictionTime', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Meal/Snack Tracking */}
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Meal/Snack Tracking
            </label>

            {/* Meal input form */}
            <div className="space-y-2 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
                  <Select value={mealType} onValueChange={(value: any) => setMealType(value)}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meal">Meal</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAddMeal}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-2 rounded"
              >
                Add Meal/Snack
              </Button>
            </div>

            {/* Display added meals */}
            <div className="space-y-2">
              {formData.meals.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">No meals added yet</p>
              ) : (
                formData.meals.map((meal) => (
                  <div key={meal.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium capitalize">{meal.type}</span> at {meal.time}
                    </span>
                    <Button
                      type="button"
                      onClick={() => handleRemoveMeal(meal.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs py-0 px-2 h-auto"
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bathroom Visit Tracking */}
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Bathroom Visit Tracking
            </label>

            {/* Bathroom input form */}
            <div className="space-y-2 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
                  <Select value={bathroomType} onValueChange={(value) => setBathroomType(value)}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no void">No Void</SelectItem>
                      <SelectItem value="urine">Urine</SelectItem>
                      <SelectItem value="bowel movement">Bowel Movement</SelectItem>
                      <SelectItem value="urine accident">Urine Accident</SelectItem>
                      <SelectItem value="bowel movement accident">Bowel Movement Accident</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={bathroomTime}
                    onChange={(e) => setBathroomTime(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAddBathroom}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-2 rounded"
              >
                Add Bathroom Visit
              </Button>
            </div>

            {/* Display added bathroom visits */}
            <div className="space-y-2">
              {formData.bathroomVisits.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">No bathroom visits logged yet</p>
              ) : (
                formData.bathroomVisits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium capitalize">{visit.type}</span> at {visit.time}
                    </span>
                    <Button
                      type="button"
                      onClick={() => handleRemoveBathroom(visit.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs py-0 px-2 h-auto"
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Social Interaction Level */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Recent Social Interaction Level *
            </label>
            <Select value={formData.socialInteractionLevel} onValueChange={(value) => handleSelectChange('socialInteractionLevel', value)}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                <SelectValue placeholder="Select interaction level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Number of Recent Transitions */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Number of Recent Transitions (activity/location changes)
            </label>
            <input
              type="number"
              min="0"
              value={formData.recentTransitions}
              onChange={(e) => handleNumberChange('recentTransitions', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 3"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Analyzing...' : 'Get Behavior Prediction'}
            </Button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
            * Required fields
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
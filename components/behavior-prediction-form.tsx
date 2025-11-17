'use client';
// ToDo: Change "Time since last meal" and "Time since last bathroom" to option box
//  inputs to select when they had their last meal and then another option to input
//  more meals/bathroom visits
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FormData {
  sleepQuality: string;
  predictionTime: string;
  timeSinceLastMeal: number;
  timeSinceLastBathroom: number;
  screenTimeToday: number;
  timeSinceOutdoor: number;
  socialInteractionLevel: string;
  recentTransitions: number;
}

interface BehaviorPredictionFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

export default function BehaviorPredictionForm({
  onSubmit,
  isLoading,
}: BehaviorPredictionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    sleepQuality: '',
    predictionTime: '',
    timeSinceLastMeal: 0,
    timeSinceLastBathroom: 0,
    screenTimeToday: 0,
    timeSinceOutdoor: 0,
    socialInteractionLevel: '',
    recentTransitions: 0,
  });

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

          {/* Time Since Last Meal */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Time Since Last Meal (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={formData.timeSinceLastMeal}
              onChange={(e) => handleNumberChange('timeSinceLastMeal', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 120"
            />
          </div>

          {/* Time Since Last Bathroom Visit */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Time Since Last Bathroom Visit (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={formData.timeSinceLastBathroom}
              onChange={(e) => handleNumberChange('timeSinceLastBathroom', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 90"
            />
          </div>

          {/* Screen Time Today */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Screen Time Today (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={formData.screenTimeToday}
              onChange={(e) => handleNumberChange('screenTimeToday', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 240"
            />
          </div>

          {/* Time Since Last Outdoor Activity */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Time Since Last Outdoor/Fresh Air (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={formData.timeSinceOutdoor}
              onChange={(e) => handleNumberChange('timeSinceOutdoor', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 180"
            />
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

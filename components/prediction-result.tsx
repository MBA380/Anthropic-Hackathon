'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PredictionResultProps {
  data: any;
}

export default function PredictionResult({ data }: PredictionResultProps) {
  return (
    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/40 shadow-md border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="text-xl text-green-900 dark:text-green-300">Prediction Result</CardTitle>
        <CardDescription className="text-green-800 dark:text-green-400">
          Based on current contextual factors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Predicted Behavior
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white mt-2">
            {data.prediction || 'Processing...'}
          </p>
        </div>

        {data.confidence && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Confidence Level
            </p>
            <div className="mt-2">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${data.confidence * 100}%` }}
                ></div>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2">
                {Math.round(data.confidence * 100)}%
              </p>
            </div>
          </div>
        )}

        {data.recommendations && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
              Recommendations
            </p>
            <ul className="space-y-2">
              {data.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                  <span className="text-slate-900 dark:text-white">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

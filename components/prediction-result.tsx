'use client';

interface PredictionResultProps {
  data: any;
}

export default function PredictionResult({ data }: PredictionResultProps) {
  return (
    <div className="space-y-5">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-900/40 p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-900">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
          <span>🎯</span> Prediction Results
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Based on the contextual factors you provided
        </p>
      </div>

      {/* Predicted Behavior */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-900 shadow-md hover:shadow-lg transition-shadow">
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">
          Predicted Behavior
        </p>
        <p className="text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
          {data.prediction || 'Processing...'}
        </p>
      </div>

      {/* Confidence Level */}
      {data.confidence && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-900 shadow-md hover:shadow-lg transition-shadow">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">
            Confidence Level
          </p>
          <div className="mt-3">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-md"
                style={{ width: `${data.confidence * 100}%` }}
              ></div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
              {Math.round(data.confidence * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-900 shadow-md hover:shadow-lg transition-shadow">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-4">
            Recommendations
          </p>
          <ul className="space-y-3">
            {data.recommendations.map((rec: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-slate-900/50 rounded-lg hover:bg-emerald-100 dark:hover:bg-slate-900/70 transition-colors">
                <span className="text-emerald-600 dark:text-emerald-400 text-2xl flex-shrink-0 mt-1">✓</span>
                <span className="text-slate-900 dark:text-white text-base leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

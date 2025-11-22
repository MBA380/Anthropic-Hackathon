'use client';

interface PredictionResultProps {
  data: any;
}

export default function PredictionResult({ data }: PredictionResultProps) {
  // Parse the Claude analysis text into structured sections
  const parseAnalysis = (analysisText: string) => {
    if (!analysisText) return null;

    const sections: {
      behavioralAnalysis?: string;
      riskFactors?: string[];
      protectiveFactors?: string[];
      recommendations?: string[];
      monitoringPriorities?: string[];
    } = {};

    // Extract sections using regex
    const behavioralAnalysisMatch = analysisText.match(/BEHAVIORAL ANALYSIS:\s*([\s\S]*?)(?=KEY RISK FACTORS:|$)/i);
    const riskFactorsMatch = analysisText.match(/KEY RISK FACTORS:\s*([\s\S]*?)(?=PROTECTIVE FACTORS:|$)/i);
    const protectiveFactorsMatch = analysisText.match(/PROTECTIVE FACTORS:\s*([\s\S]*?)(?=ACTIONABLE RECOMMENDATIONS:|$)/i);
    const recommendationsMatch = analysisText.match(/ACTIONABLE RECOMMENDATIONS:\s*([\s\S]*?)(?=MONITORING PRIORITIES:|$)/i);
    const monitoringMatch = analysisText.match(/MONITORING PRIORITIES:\s*([\s\S]*?)$/i);

    if (behavioralAnalysisMatch) {
      sections.behavioralAnalysis = behavioralAnalysisMatch[1].trim();
    }

    if (riskFactorsMatch) {
      sections.riskFactors = riskFactorsMatch[1]
        .trim()
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    if (protectiveFactorsMatch) {
      sections.protectiveFactors = protectiveFactorsMatch[1]
        .trim()
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    if (recommendationsMatch) {
      sections.recommendations = recommendationsMatch[1]
        .trim()
        .split('\n')
        .map(line => line.replace(/^\d+\.?\s*/, '').replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    if (monitoringMatch) {
      sections.monitoringPriorities = monitoringMatch[1]
        .trim()
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    return sections;
  };

  const analysis = data.analysis ? parseAnalysis(data.analysis) : null;

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
          {data.prediction_label || data.prediction || 'Processing...'}
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

      {/* Behavioral Analysis */}
      {analysis?.behavioralAnalysis && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-900 shadow-md hover:shadow-lg transition-shadow">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>🧠</span> Behavioral Analysis
          </p>
          <p className="text-slate-900 dark:text-white text-base leading-relaxed">
            {analysis.behavioralAnalysis}
          </p>
        </div>
      )}

      {/* Risk Factors */}
      {analysis?.riskFactors && analysis.riskFactors.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-red-200 dark:border-red-900 shadow-md hover:shadow-lg transition-shadow">
          <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>⚠️</span> Key Risk Factors
          </p>
          <ul className="space-y-3">
            {analysis.riskFactors.map((factor: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <span className="text-red-600 dark:text-red-400 text-lg flex-shrink-0 mt-0.5">⚠</span>
                <span className="text-slate-900 dark:text-white text-base leading-relaxed">{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Protective Factors */}
      {analysis?.protectiveFactors && analysis.protectiveFactors.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-green-200 dark:border-green-900 shadow-md hover:shadow-lg transition-shadow">
          <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🛡️</span> Protective Factors
          </p>
          <ul className="space-y-3">
            {analysis.protectiveFactors.map((factor: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <span className="text-green-600 dark:text-green-400 text-lg flex-shrink-0 mt-0.5">✓</span>
                <span className="text-slate-900 dark:text-white text-base leading-relaxed">{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {analysis?.recommendations && analysis.recommendations.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-900 shadow-md hover:shadow-lg transition-shadow">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>💡</span> Actionable Recommendations
          </p>
          <ul className="space-y-3">
            {analysis.recommendations.map((rec: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-slate-900/50 rounded-lg hover:bg-emerald-100 dark:hover:bg-slate-900/70 transition-colors">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg flex-shrink-0 min-w-[24px]">{idx + 1}.</span>
                <span className="text-slate-900 dark:text-white text-base leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Monitoring Priorities */}
      {analysis?.monitoringPriorities && analysis.monitoringPriorities.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-900 shadow-md hover:shadow-lg transition-shadow">
          <p className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>👁️</span> Monitoring Priorities
          </p>
          <ul className="space-y-3">
            {analysis.monitoringPriorities.map((priority: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <span className="text-purple-600 dark:text-purple-400 text-lg flex-shrink-0 mt-0.5">👁</span>
                <span className="text-slate-900 dark:text-white text-base leading-relaxed">{priority}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fallback: Show raw analysis if parsing fails */}
      {data.analysis && !analysis && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-900 shadow-md hover:shadow-lg transition-shadow">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-4">
            Analysis
          </p>
          <div className="text-slate-900 dark:text-white text-base leading-relaxed whitespace-pre-wrap">
            {data.analysis}
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useMemo, useState } from 'react';

interface PredictionResultProps {
  data: any;
}

export default function PredictionResult({ data }: PredictionResultProps) {
  const [showSummary, setShowSummary] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parse the Claude analysis text into structured sections with hierarchical support
  const parseAnalysis = (analysisText: string) => {
    if (!analysisText) return null;

    const sections: {
      behavioralAnalysis?: string;
      riskFactors?: Array<{ main: string; subPoints?: string[] }>;
      protectiveFactors?: Array<{ main: string; subPoints?: string[] }>;
      recommendations?: Array<{ main: string; subPoints?: string[] }>;
      monitoringPriorities?: Array<{ main: string; subPoints?: string[] }>;
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

    // Helper to parse hierarchical bullet/numbered lists
    const parseHierarchicalList = (text: string): Array<{ main: string; subPoints?: string[] }> => {
      const lines = text.trim().split('\n').map(line => line.trim()).filter(Boolean);
      const items: Array<{ main: string; subPoints?: string[] }> = [];
      let currentItem: { main: string; subPoints?: string[] } | null = null;

      for (const line of lines) {
        // Check if it's a main point (starts with number or main bullet)
        const mainNumberMatch = line.match(/^(\d+)\.\s*(.+)$/);
        const mainBulletMatch = line.match(/^[-•*]\s*(.+)$/);

        // Check if it's a sub-point (indented or starts with letter/dash)
        const subPointMatch = line.match(/^\s+[-•*]\s*(.+)$/) ||
                             line.match(/^[a-z]\)\s*(.+)$/i) ||
                             line.match(/^\s+\d+\.\s*(.+)$/);

        if (mainNumberMatch) {
          // This is a numbered main point
          if (currentItem) items.push(currentItem);
          currentItem = { main: mainNumberMatch[2].trim(), subPoints: [] };
        } else if (mainBulletMatch && !subPointMatch) {
          // This is a bulleted main point (not indented)
          if (currentItem) items.push(currentItem);
          currentItem = { main: mainBulletMatch[1].trim(), subPoints: [] };
        } else if (subPointMatch && currentItem) {
          // This is a sub-point, add it to current item
          const subText = subPointMatch[1].trim();
          if (subText) {
            if (!currentItem.subPoints) currentItem.subPoints = [];
            currentItem.subPoints.push(subText);
          }
        } else if (currentItem && line && !line.match(/^(BEHAVIORAL|KEY|PROTECTIVE|ACTIONABLE|MONITORING)/i)) {
          // Continuation of current point or sub-point
          if (currentItem.subPoints && currentItem.subPoints.length > 0) {
            // Append to last sub-point
            currentItem.subPoints[currentItem.subPoints.length - 1] += ' ' + line;
          } else {
            // Append to main point
            currentItem.main += ' ' + line;
          }
        }
      }

      if (currentItem) items.push(currentItem);

      // Clean up empty subPoints arrays
      return items.map(item => ({
        main: item.main,
        subPoints: item.subPoints && item.subPoints.length > 0 ? item.subPoints : undefined
      }));
    };

    if (riskFactorsMatch) {
      sections.riskFactors = parseHierarchicalList(riskFactorsMatch[1]);
    }

    if (protectiveFactorsMatch) {
      sections.protectiveFactors = parseHierarchicalList(protectiveFactorsMatch[1]);
    }

    if (recommendationsMatch) {
      sections.recommendations = parseHierarchicalList(recommendationsMatch[1]);
    }

    if (monitoringMatch) {
      sections.monitoringPriorities = parseHierarchicalList(monitoringMatch[1]);
    }

    return sections;
  };

  const analysis = data.analysis ? parseAnalysis(data.analysis) : null;
  const riskLabel = data.prediction_label || (data.prediction === 1 ? 'High Risk' : 'Low Risk');

  type CaregiverSummary = {
    header: string;
    overview?: string;
    watchFors: string[];
    supports: string[];
    nextSteps: string[];
    monitor: string[];
    fullText: string;
  };

  const caregiverSummary: CaregiverSummary | null = useMemo(() => {
    if (!analysis) return null;

    const confidenceText = data.confidence ? `${Math.round(data.confidence * 100)}% confidence` : 'confidence pending';
    const header = `Risk snapshot: ${riskLabel} (${confidenceText}).`;

    const overview = analysis.behavioralAnalysis
      ?.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .join(' ');

    // Extract main points only for summary
    const watchFors = analysis.riskFactors?.slice(0, 3).map(item => item.main) || [];
    const supports = analysis.protectiveFactors?.slice(0, 3).map(item => item.main) || [];
    const nextSteps = analysis.recommendations?.slice(0, 3).map(item => item.main) || [];
    const monitor = analysis.monitoringPriorities?.slice(0, 3).map(item => item.main) || [];

    const sections: string[] = [
      `Summary:\n${header}${overview ? `\n${overview}` : ''}`,
      watchFors.length ? `Watch Fors:\n${watchFors.map(item => `- ${item}`).join('\n')}` : '',
      supports.length ? `Leverage Supports:\n${supports.map(item => `- ${item}`).join('\n')}` : '',
      nextSteps.length ? `How to Help:\n${nextSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}` : '',
      monitor.length ? `Monitor Closely:\n${monitor.map(item => `- ${item}`).join('\n')}` : '',
    ].filter(Boolean);

    return {
      header,
      overview,
      watchFors,
      supports,
      nextSteps,
      monitor,
      fullText: sections.join('\n\n'),
    };
  }, [analysis, data.confidence, riskLabel]);

  const handleCopySummary = async () => {
    if (!caregiverSummary) return;
    try {
      await navigator.clipboard.writeText(caregiverSummary.fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Unable to copy summary', error);
    }
  };

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

      {/* Caregiver Summary */}
      {analysis && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-amber-200 dark:border-amber-900 shadow-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                Caregiver Summary
              </p>
              <p className="text-slate-700 dark:text-slate-300 text-sm">
                Share a concise overview of the current analysis and strategies.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSummary(prev => !prev)}
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
            >
              {showSummary ? 'Hide Summary' : 'Generate Summary'}
            </button>
          </div>

          {showSummary && caregiverSummary && (
            <div className="mt-4 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Caregiver-ready talking points
                </p>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="rounded-xl border border-amber-100 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 p-4 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">Summary</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">{caregiverSummary.header}</p>
                  {caregiverSummary.overview && (
                    <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">{caregiverSummary.overview}</p>
                  )}
                </div>

                {caregiverSummary.watchFors.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">Watch Fors</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-900 dark:text-slate-100">
                      {caregiverSummary.watchFors.map((item, idx) => (
                        <li key={`watch-${idx}`} className="flex items-start gap-2">
                          <span className="text-amber-600 dark:text-amber-300 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {caregiverSummary.supports.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">Leverage Supports</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-900 dark:text-slate-100">
                      {caregiverSummary.supports.map((item, idx) => (
                        <li key={`support-${idx}`} className="flex items-start gap-2">
                          <span className="text-emerald-600 dark:text-emerald-300 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {caregiverSummary.nextSteps.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">How to Help</p>
                    <ol className="mt-2 space-y-1 text-sm text-slate-900 dark:text-slate-100 list-decimal list-inside">
                      {caregiverSummary.nextSteps.map((step, idx) => (
                        <li key={`step-${idx}`}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {caregiverSummary.monitor.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">Monitor Closely</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-900 dark:text-slate-100">
                      {caregiverSummary.monitor.map((item, idx) => (
                        <li key={`monitor-${idx}`} className="flex items-start gap-2">
                          <span className="text-amber-600 dark:text-amber-300 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risk of Escalation */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-900 shadow-md hover:shadow-lg transition-shadow">
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">
          Risk of Escalation
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
            {analysis.riskFactors.map((factor, idx: number) => (
              <li key={idx} className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-red-600 dark:text-red-400 text-lg flex-shrink-0 mt-0.5">⚠</span>
                  <div className="flex-1">
                    <span className="text-slate-900 dark:text-white text-base leading-relaxed">{factor.main}</span>
                    {factor.subPoints && factor.subPoints.length > 0 && (
                      <ul className="mt-2 ml-4 space-y-1">
                        {factor.subPoints.map((subPoint, subIdx) => (
                          <li key={subIdx} className="flex items-start gap-2">
                            <span className="text-red-500 dark:text-red-400 text-sm mt-1">•</span>
                            <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{subPoint}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
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
            {analysis.protectiveFactors.map((factor, idx: number) => (
              <li key={idx} className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400 text-lg flex-shrink-0 mt-0.5">✓</span>
                  <div className="flex-1">
                    <span className="text-slate-900 dark:text-white text-base leading-relaxed">{factor.main}</span>
                    {factor.subPoints && factor.subPoints.length > 0 && (
                      <ul className="mt-2 ml-4 space-y-1">
                        {factor.subPoints.map((subPoint, subIdx) => (
                          <li key={subIdx} className="flex items-start gap-2">
                            <span className="text-green-500 dark:text-green-400 text-sm mt-1">•</span>
                            <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{subPoint}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
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
          <ul className="space-y-4">
            {analysis.recommendations.map((rec, idx: number) => (
              <li key={idx} className="p-4 bg-emerald-50 dark:bg-slate-900/50 rounded-lg hover:bg-emerald-100 dark:hover:bg-slate-900/70 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg flex-shrink-0 min-w-[24px]">{idx + 1}.</span>
                  <div className="flex-1">
                    <span className="text-slate-900 dark:text-white text-base leading-relaxed font-medium">{rec.main}</span>
                    {rec.subPoints && rec.subPoints.length > 0 && (
                      <ul className="mt-2 ml-2 space-y-1.5">
                        {rec.subPoints.map((subPoint, subIdx) => (
                          <li key={subIdx} className="flex items-start gap-2">
                            <span className="text-emerald-500 dark:text-emerald-400 text-sm mt-1">•</span>
                            <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{subPoint}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
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
            {analysis.monitoringPriorities.map((priority, idx: number) => (
              <li key={idx} className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-purple-600 dark:text-purple-400 text-lg flex-shrink-0 mt-0.5">👁</span>
                  <div className="flex-1">
                    <span className="text-slate-900 dark:text-white text-base leading-relaxed">{priority.main}</span>
                    {priority.subPoints && priority.subPoints.length > 0 && (
                      <ul className="mt-2 ml-4 space-y-1">
                        {priority.subPoints.map((subPoint, subIdx) => (
                          <li key={subIdx} className="flex items-start gap-2">
                            <span className="text-purple-500 dark:text-purple-400 text-sm mt-1">•</span>
                            <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{subPoint}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
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
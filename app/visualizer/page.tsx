'use client'

const tutorialSteps = [
  {
    title: '01  Intake focus',
    description:
      'Start on the Assessment page and complete each tab: patient info, social & environment, meals, bathroom, and time query. Every field feeds the readiness engine.',
    detail: 'We only keep data in your browser, so you can revisit or edit without syncing to a server.',
  },
  {
    title: '02  Backend prediction',
    description:
      'When you press “Get Prediction,” the form POSTs to /api/predict. The backend loads the joblib behavior model, evaluates the vector, and returns risk label + confidence.',
    detail: 'In development we default to a mocked payload (see predict route) so the UI experience stays smooth.',
  },
  {
    title: '03  AI summary & storage',
    description:
      'The frontend parses the Claude-style analysis into sections (watch-fors, supports, next steps) and stores both the summary and patient snapshot in localStorage.',
    detail: 'You can find those entries inside aba-forecast-summaries and aba-forecast-patient-profile keys.',
  },
  {
    title: '04  Visualizer role',
    description:
      'Use this space to explain insights to caregivers—what data was collected, how the backend model interpreted it, and where to navigate next (profile, assessment, about).',
    detail: 'Replace this copy with live metrics or embed a walkthrough video once available.',
  },
]

export default function VisualizerPage() {
  return (
    <main className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <header className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-blue-500">Tutorial flow</p>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white">Visualizer & stack overview</h1>
          <p className="text-base text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Walk caregivers and collaborators through how the assessment UI, backend model, and summary store connect. Update these cards as the
            product matures.
          </p>
        </header>

        <section className="space-y-6">
          {tutorialSteps.map((step) => (
            <div
              key={step.title}
              className="rounded-3xl border border-white/70 bg-white/90 p-6 text-left shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">{step.title}</p>
              <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">{step.description}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{step.detail}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Backend primer</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            • API Route: <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">/api/predict</code> → proxies to <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">backend/app.py</code>
            where the joblib model classifies readiness.<br />
            • Model: <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">behavior_predictor.joblib</code> (logistic regression) + <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">behavior_predictor_metrics.json</code> for diagnostics.<br />
            • Storage: localStorage only—no remote DB yet. Keys mirror the new tutorial copy for clarity.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Next up</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            Swap this primer for charts or embed Loom walkthroughs once real telemetry is wired.
          </p>
        </section>
      </div>
    </main>
  )
}

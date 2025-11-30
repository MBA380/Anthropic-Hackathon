'use client'

const faqs = [
  {
    title: 'How do I start an assessment?',
    body:
      'Navigate to the Assessment page, complete each tab (patient info, context, meals, bathroom, time query) and press “Get Prediction.” The UI stores progress locally so you can pause any time.',
  },
  {
    title: 'Where are my results stored?',
    body:
      'Predictions and summaries live in your browser only. We persist them under aba-forecast-summaries and aba-forecast-patient-profile until you clear storage or overwrite them.',
  },
  {
    title: 'What powers the backend?',
    body:
      'The /api/predict route calls backend/app.py, which loads behavior_predictor.joblib (logistic regression) and returns a risk label, confidence score, and AI analysis string.',
  },
  {
    title: 'Can I edit the patient profile?',
    body:
      'Yes. Submit another assessment with updated info—profile and history cards will refresh automatically. Clearing localStorage resets everything to defaults.',
  },
  {
    title: 'Is there a roadmap?',
    body:
      'Next iterations include synced cloud storage, deeper caregiver coaching prompts, and step-by-step embedded tutorials beside every form section.',
  },
  {
    title: 'How should I explain ABA Forecast to families?',
    body:
      'Share that it blends on-the-spot caregiver context with lightweight AI modeling to highlight risks, supports, and next best actions that still keep the human in the loop.',
  },
]

const quickFacts = [
  { label: 'Storage mode', value: 'Local only' },
  { label: 'Backend stack', value: 'FastAPI + joblib model' },
  { label: 'Prediction target', value: 'Behavior readiness risk' },
]

export default function FAQPage() {
  return (
    <main className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        <header className="rounded-3xl border border-white/60 bg-white/90 p-8 text-center shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <p className="text-xs uppercase tracking-[0.4em] text-blue-500">FAQ</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">Caregiver questions, answered</h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            A concise reference on how ABA Forecast gathers context, runs predictions, and keeps every artifact on your device—perfect for onboarding
            co-caregivers or explaining the stack to stakeholders.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {quickFacts.map((fact) => (
              <span
                key={fact.label}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
              >
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{fact.label}</span>
                <span className="text-slate-900 dark:text-white">{fact.value}</span>
              </span>
            ))}
          </div>
        </header>

        <section className="relative">
          <div className="pointer-events-none absolute left-5 top-0 hidden h-full w-px bg-gradient-to-b from-blue-200 to-purple-200 dark:from-blue-900/40 dark:to-purple-900/40 md:block" />
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={faq.title}
                className="relative rounded-3xl border border-white/70 bg-white/95 p-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 md:pl-16"
              >
                <div className="absolute -left-1 top-8 hidden size-12 -translate-x-1/2 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600 shadow md:flex dark:bg-blue-900/40 dark:text-blue-200">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="space-y-3">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{faq.title}</p>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{faq.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/95 p-8 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Still need clarity?</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Drop a note in the Assessment page notes field or ping the team on your preferred caregiver channel. We’re building guided walkthroughs and short
            videos to embed here soon.
          </p>
        </section>
      </div>
    </main>
  )
}

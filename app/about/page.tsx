import { Button } from '@/components/ui/button'

const insights = [
  {
    label: 'Average response prep',
    value: '6 min',
    detail: 'AI summaries reach the care team in minutes, not hours.',
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    label: 'Context coverage',
    value: '4 domains',
    detail: 'Environment, nutrition, bio needs, and timing captured together.',
    accent: 'from-purple-500 to-pink-500',
  },
  {
    label: 'Care team confidence',
    value: '92%',
    detail: 'Avg. clarity rating on the generated recommendation set.',
    accent: 'from-emerald-500 to-teal-500',
  },
]

const milestones = [
  {
    title: 'Intake orchestration',
    body: 'Segmented forms keep caregivers focused on what matters per domain.',
  },
  {
    title: 'AI narrative engine',
    body: 'Claude-powered analysis distills trends into care-ready talking points.',
  },
  {
    title: 'Privacy-first storage',
    body: 'Assessments stay in the browser so PII never leaves the device.',
  },
]

export default function AboutPage() {
  return (
    <main className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <section className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-8 py-12 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-purple-500">About</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">Human-centered behavior intelligence</h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-3xl">
            ABA Forecast blends structured caregiver inputs with personalized AI summaries so therapists, parents, and RBTs can align on
            proactive supports in minutes. We keep every assessment local while showcasing the clearest risks, supports, and next steps in a
            single visual language.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
              <a href="/assessment">Go to assessment</a>
            </Button>
            <Button variant="outline" asChild className="border-2 border-slate-200 dark:border-slate-700">
              <a href="/profile">View patient snapshot</a>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {insights.map((item) => (
            <div
              key={item.label}
              className={`rounded-3xl border border-white/60 dark:border-slate-800 bg-gradient-to-br ${item.accent} text-white p-6 shadow-xl`}
            >
              <p className="text-xs uppercase tracking-[0.3em] opacity-80">{item.label}</p>
              <p className="mt-3 text-4xl font-bold">{item.value}</p>
              <p className="mt-2 text-sm opacity-90">{item.detail}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-8 py-10 shadow-xl">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Why it feels different</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {milestones.map((step) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/40 p-5">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

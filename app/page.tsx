'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4 py-20 text-center dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent_60%)]" />
      <div className="relative mx-auto max-w-4xl space-y-8">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-blue-500">Caregiver Intelligence Hub</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          ABA Forecast
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          AI-powered autism behavior prediction system tuned for in-the-moment caregiver decisions.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button className="min-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 text-lg text-white shadow-xl" asChild>
            <Link href="/assessment">Start Assessment</Link>
          </Button>
          <Button variant="outline" className="min-w-[200px] border-2 border-slate-200 bg-white/70 text-lg dark:border-slate-700 dark:bg-slate-900/60" asChild>
            <Link href="/profile">View Profile</Link>
          </Button>
        </div>

        <div className="grid gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 sm:grid-cols-3">
          {[
            { label: 'Platform Mode', value: 'Assessment + AI Summary' },
            { label: 'Care Focus', value: 'ABA Caregivers & RBTs' },
            { label: 'Visualizer', value: 'Behavior readiness insights' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white/90 p-4 text-left dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { ASSESSMENT_STORAGE_KEY, PROFILE_STORAGE_KEY } from '@/lib/constants'
import type { PatientSnapshot, SavedAssessment } from '@/types/assessment'

const emptySnapshot: PatientSnapshot = {
  patientName: '',
  primaryConcern: '',
  supportFocus: '',
  clinicName: '',
}

export default function ProfilePage() {
  const [snapshot, setSnapshot] = useState<PatientSnapshot>(emptySnapshot)
  const [history, setHistory] = useState<SavedAssessment[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY)
      if (storedProfile) {
        setSnapshot(JSON.parse(storedProfile))
      }
    } catch (error) {
      console.warn('Unable to load patient snapshot', error)
    }

    try {
      const storedHistory = localStorage.getItem(ASSESSMENT_STORAGE_KEY)
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory))
      }
    } catch (error) {
      console.warn('Unable to load assessment history', error)
    }
  }, [])

  const formatTimestamp = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  const hasSnapshot = Object.values(snapshot).some(Boolean)

  return (
    <main className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <section className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-6 py-8 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-500">Profile</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Patient snapshot</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Populate the “Patient Info” tab in Assessment to refresh these details.
          </p>

          {hasSnapshot ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Patient</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">{snapshot.patientName || '—'}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{snapshot.primaryConcern || 'Primary concern pending'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Support focus</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{snapshot.supportFocus || 'Document supports to see them here'}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{snapshot.clinicName || 'Clinic/program optional'}</p>
              </div>
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-slate-600 dark:text-slate-300">
              No patient info saved yet. Head to the Assessment page and complete the “Patient Info” tab.
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-white/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-6 py-8 shadow-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">Saved AI summaries</p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Recent assessment memory</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">The latest six analyses stay on-device for privacy.</p>
            </div>
          </div>

          {history.length ? (
            <div className="mt-6 space-y-4">
              {history.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/assessment?assessmentId=${entry.id}`}
                  className="block rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-900/20 p-4 transition-all hover:shadow-lg hover:scale-[1.02] hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30 cursor-pointer"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{entry.label}</p>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">→ View</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatTimestamp(entry.createdAt)}</p>
                    </div>
                    {entry.confidenceLabel && (
                      <span className="inline-flex items-center rounded-full bg-white/80 dark:bg-slate-900/60 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-100 border border-emerald-200/60 dark:border-emerald-800/60">
                        Confidence {entry.confidenceLabel}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{entry.summary}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-slate-600 dark:text-slate-300">
              Run your first assessment to see summaries appear here.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

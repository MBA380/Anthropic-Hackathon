'use client'

import { useEffect, useRef, useState } from 'react'

import BehaviorPredictionForm from '@/components/behavior-prediction-form'
import WeatherDisplay from '@/components/weather-display'
import PredictionResult from '@/components/prediction-result'
import { ChatAgentOverlay } from '@/components/chatbot/agent_overlay'
import { Button } from '@/components/ui/button'
import { ASSESSMENT_STORAGE_KEY, PROFILE_STORAGE_KEY } from '@/lib/constants'
import type { BehaviorAssessmentFormData, PatientSnapshot, SavedAssessment } from '@/types/assessment'

export default function AssessmentPage() {
  const [prediction, setPrediction] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const formSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // pre-warm persisted store so profile page has latest data if user reloads
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(ASSESSMENT_STORAGE_KEY)) {
      localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify([]))
    }
  }, [])

  const summarizeAssessment = (result: any) => {
    if (!result) return 'Assessment details pending.'
    const riskLabel = result.prediction_label || (result.prediction === 1 ? 'High Risk' : 'Low Risk')
    const confidenceText = result.confidence ? `${Math.round(result.confidence * 100)}% confidence` : null
    const rawAnalysis = typeof result.analysis === 'string' ? result.analysis : ''
    const analysisSentence = rawAnalysis
      ?.split('\n')
      .map((line: string) => line.trim())
      .filter(Boolean)[0]

    return [
      `${riskLabel}${confidenceText ? ` (${confidenceText})` : ''}`,
      analysisSentence ? `Key insight: ${analysisSentence}` : null,
    ]
      .filter(Boolean)
      .join(' — ')
  }

  const persistAssessment = (result: any) => {
    const entry: SavedAssessment = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
      createdAt: new Date().toISOString(),
      label: result?.prediction_label || (result?.prediction === 1 ? 'High Risk' : 'Low Risk'),
      confidenceLabel: result?.confidence ? `${Math.round(result.confidence * 100)}%` : undefined,
      summary: summarizeAssessment(result),
    }

    try {
      const existingRaw = localStorage.getItem(ASSESSMENT_STORAGE_KEY)
      const existing = existingRaw ? (JSON.parse(existingRaw) as SavedAssessment[]) : []
      const updated = [entry, ...existing].slice(0, 6)
      localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.warn('Unable to persist assessments', error)
    }
  }

  const persistProfile = (data: BehaviorAssessmentFormData) => {
    const snapshot: PatientSnapshot = {
      patientName: data.patientName,
      primaryConcern: data.primaryConcern,
      supportFocus: data.supportFocus,
      careTeamEmail: data.careTeamEmail,
      clinicName: data.clinicName,
    }

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(snapshot))
    } catch (error) {
      console.warn('Unable to persist patient snapshot', error)
    }
  }

  const handleFormSubmit = async (formData: BehaviorAssessmentFormData) => {
    setLoading(true)
    persistProfile(formData)
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Backend error:', errorData)
        throw new Error(`Failed to get prediction: ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      setPrediction(result)
      setShowResults(true)
      persistAssessment(result)
    } catch (error) {
      console.error('Error:', error)
      alert('Error submitting form. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewAssessment = () => {
    setShowResults(false)
    setPrediction(null)
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        {!showResults ? (
          <div ref={formSectionRef} className="max-w-4xl mx-auto">
            <BehaviorPredictionForm onSubmit={handleFormSubmit} isLoading={loading} />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl shadow-emerald-500/10">
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700 px-6 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Prediction Results</h2>
                </div>
                <button
                  onClick={handleNewAssessment}
                  className="text-sm px-3 py-1 rounded-full border border-emerald-500/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  New assessment
                </button>
              </div>
            </div>
            <div className="p-6 md:p-8">
              <div className="animate-fade-in">
                <PredictionResult data={prediction} />
              </div>
            </div>
          </div>
        )}
      </div>

      <WeatherDisplay />
      {prediction && <ChatAgentOverlay predictionContext={prediction} />}
    </main>
  )
}

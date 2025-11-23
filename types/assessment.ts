export interface BehaviorAssessmentFormData {
  sleepQuality: string
  predictionTime: string
  meals: MealEntry[]
  bathroomVisits: BathroomEntry[]
  socialInteractionContext: string
  transitionType: string
  patientName: string
  primaryConcern: string
  supportFocus: string
  clinicName: string
}

export interface MealEntry {
  id: string
  type: 'meal' | 'snack'
  time: string
}

export interface BathroomEntry {
  id: string
  type: 'no void' | 'urine' | 'bowel movement' | 'urine accident' | 'bowel movement accident'
  time: string
}

export interface SavedAssessment {
  id: string
  createdAt: string
  label: string
  confidenceLabel?: string
  summary: string
  predictionData?: any // Full prediction result from API
}

export type PatientSnapshot = Pick<
  BehaviorAssessmentFormData,
  'patientName' | 'primaryConcern' | 'supportFocus' | 'clinicName'
>

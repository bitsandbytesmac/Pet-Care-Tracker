export type PetColor = 'peach' | 'mint'
export type Species = 'Cat' | 'Dog'
export type Sex = 'Female' | 'Male'

export interface WeightRecord {
  /** ISO date, e.g. 2026-11-05 */
  date: string
  kg: number
}

export interface Pet {
  id: string
  name: string
  species: Species
  breed: string
  sex: Sex
  age: string
  weight: string
  neutered: boolean
  color: PetColor
  clinic: string
  lastVaccine: string
  food: string
  allergies: string
  weightHistory: WeightRecord[]
}

export type Frequency = 'Once daily' | 'Twice daily' | 'Three times daily' | 'As needed'

export type MedicationTracking =
  | { kind: 'course'; day: number; totalDays: number }
  | { kind: 'supply'; remaining: number; total: number }
  | { kind: 'ongoing' }

export interface Medication {
  id: string
  name: string
  petId: string
  dose: string
  frequency: Frequency
  /** 24-hour "HH:mm" times */
  reminderTimes: string[]
  status: 'active' | 'completed'
  tracking: MedicationTracking
  /** ISO date, set when status is "completed" */
  completedOn?: string
}

/** One scheduled dose on today's schedule. */
export interface Dose {
  id: string
  medicationId: string
  /** 24-hour "HH:mm" */
  time: string
  given: boolean
  /** The scheduled time has passed without the dose being given. */
  overdue: boolean
}

export type DoseStatus = 'given' | 'due' | 'overdue'

export interface Attachment {
  id: string
  kind: 'photo' | 'receipt' | 'file'
  name: string
}

export interface Visit {
  id: string
  petId: string
  /** ISO date */
  date: string
  /** 24-hour "HH:mm" */
  time: string
  title: string
  clinic: string
  /** Short summary shown on list cards */
  summary: string
  /** Full vet's notes shown in the details panel */
  notes: string
  prescriptionIds: string[]
  attachments: Attachment[]
  weightLogged: boolean
  upcoming: boolean
}

export const SYMPTOM_KINDS = [
  'Vomiting',
  'Diarrhea',
  'Not eating',
  'Lethargy',
  'Scratching',
  'Coughing',
  'Limping',
  'Other',
] as const
export type SymptomKind = (typeof SYMPTOM_KINDS)[number]

export const SEVERITIES = ['Mild', 'Moderate', 'Severe'] as const
export type Severity = (typeof SEVERITIES)[number]

export interface SymptomEntry {
  id: string
  petId: string
  /** ISO date */
  date: string
  /** 24-hour "HH:mm" */
  time: string
  symptoms: SymptomKind[]
  title: string
  notes: string
  severity: Severity
  photoName?: string
}

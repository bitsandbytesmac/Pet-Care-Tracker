/**
 * Domain types shared by the React app (src/) and the API (server/).
 * Dates are ISO "YYYY-MM-DD" strings in the owner's local calendar; times are 24-hour "HH:mm".
 */

export type PetColor = 'peach' | 'mint'
export const PET_COLORS: readonly PetColor[] = ['peach', 'mint']
export const SPECIES = ['Cat', 'Dog', 'Other'] as const
export type Species = (typeof SPECIES)[number]
export const SEXES = ['Female', 'Male'] as const
export type Sex = (typeof SEXES)[number]

export interface WeightRecord {
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

export const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'As needed'] as const
export type Frequency = (typeof FREQUENCIES)[number]

export type MedicationTracking =
  /** A fixed-length course. The current day is derived from `startDate`. */
  | { kind: 'course'; totalDays: number }
  /** Counted supply (chews, tablets). Goes down by one per dose given. */
  | { kind: 'supply'; remaining: number; total: number }
  | { kind: 'ongoing' }

export interface Medication {
  id: string
  name: string
  petId: string
  dose: string
  frequency: Frequency
  reminderTimes: string[]
  status: 'active' | 'completed'
  /** First day of the medicine. */
  startDate: string
  tracking: MedicationTracking
  completedOn: string | null
}

/** One scheduled dose on a given day. */
export interface Dose {
  id: string
  medicationId: string
  date: string
  time: string
  /** ISO timestamp when the dose was marked given, or null. */
  givenAt: string | null
}

export type DoseStatus = 'given' | 'due' | 'overdue'

export interface Attachment {
  id: string
  kind: 'photo' | 'receipt' | 'file'
  name: string
  /** Authenticated download URL, or null for a placeholder with no stored file. */
  url: string | null
}

export const VISIT_TYPES = [
  'Vaccination',
  'Deworming',
  'General checkup',
  'Consultation',
  'Medication',
  'Surgery',
  'Dental care',
  'Other',
] as const
export type VisitType = (typeof VISIT_TYPES)[number]

/** "scheduled" = an appointment that hasn't happened yet (or is overdue); "completed" = a past visit on record. */
export const VISIT_STATUSES = ['scheduled', 'completed'] as const
export type VisitStatus = (typeof VISIT_STATUSES)[number]

/** Reminder lead times in days before an appointment (0 = on the day). */
export const REMINDER_DAYS = [0, 1, 3, 7] as const

export interface Visit {
  id: string
  petId: string
  type: VisitType
  status: VisitStatus
  date: string
  /** "HH:mm", or null when the time isn't known. */
  time: string | null
  /** Reason for the visit. */
  title: string
  /** Vet or clinic name. */
  clinic: string
  /** Diagnosis or findings. */
  diagnosis: string
  /** Treatment or medication prescribed (free text). */
  treatment: string
  notes: string
  cost: number | null
  /** Show a reminder this many days before a scheduled visit; null = no reminder. */
  reminderDays: number | null
  /** Medicines in the app linked to this visit. */
  prescriptionIds: string[]
  attachments: Attachment[]
  weightLogged: boolean
}

/** Fields a user can set when logging or editing a visit. */
export type VisitInput = Pick<
  Visit,
  'petId' | 'type' | 'status' | 'date' | 'time' | 'title' | 'clinic' | 'diagnosis' | 'treatment' | 'notes' | 'cost' | 'reminderDays'
>

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
  date: string
  time: string
  symptoms: SymptomKind[]
  title: string
  notes: string
  severity: Severity
  photo: Attachment | null
}

/** Response of GET /api/state */
export interface AppData {
  pets: Pet[]
  medications: Medication[]
  /** Doses scheduled on the requested date. */
  doses: Dose[]
  visits: Visit[]
  symptoms: SymptomEntry[]
}

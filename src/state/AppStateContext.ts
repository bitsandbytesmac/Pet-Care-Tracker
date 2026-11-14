import { createContext, useContext } from 'react'
import type {
  Attachment,
  Frequency,
  Medication,
  Pet,
  Severity,
  SymptomEntry,
  SymptomKind,
  Visit,
  Dose,
} from '../types'

export interface NewMedication {
  name: string
  petId: string
  dose: string
  frequency: Frequency
  reminderTimes: string[]
  /** Course length in days; omit for an ongoing medicine. */
  totalDays?: number
}

export interface NewSymptomEntry {
  petId: string
  date: string
  time: string
  symptoms: SymptomKind[]
  severity: Severity
  notes: string
  photoName?: string
}

export type PetDetailsPatch = Partial<
  Pick<Pet, 'age' | 'weight' | 'neutered' | 'clinic' | 'lastVaccine' | 'food' | 'allergies'>
>

export interface AppState {
  pets: Pet[]
  medications: Medication[]
  doses: Dose[]
  visits: Visit[]
  symptoms: SymptomEntry[]
  /** Mark a dose given, or undo it. Supply-tracked medicines go down/up by one. */
  toggleDose: (doseId: string) => void
  addMedication: (input: NewMedication) => Medication
  markRefilled: (medicationId: string) => void
  addSymptom: (input: NewSymptomEntry) => SymptomEntry
  updatePet: (petId: string, patch: PetDetailsPatch) => void
  addAttachment: (visitId: string, attachment: Omit<Attachment, 'id'>) => void
}

export const AppStateContext = createContext<AppState | null>(null)

export function useAppState(): AppState {
  const state = useContext(AppStateContext)
  if (!state) throw new Error('useAppState must be used inside <AppStateProvider>')
  return state
}

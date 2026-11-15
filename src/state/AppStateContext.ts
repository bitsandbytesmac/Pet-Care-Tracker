import { createContext, useContext } from 'react'
import type {
  AppData,
  Frequency,
  Medication,
  Pet,
  PetColor,
  Severity,
  Sex,
  Species,
  SymptomEntry,
  SymptomKind,
  Visit,
  VisitInput,
} from '../types'

export interface NewPet {
  name: string
  species: Species
  breed: string
  sex: Sex
  color: PetColor
}

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
}

export type PetDetailsPatch = Partial<
  Pick<Pet, 'age' | 'weight' | 'neutered' | 'clinic' | 'lastVaccine' | 'food' | 'allergies'>
>

export interface AppState extends AppData {
  /** The local calendar date ("YYYY-MM-DD") the data was loaded for. */
  today: string
  /** Current time, refreshed every 30 seconds. */
  now: Date
  /** Mark a dose given, or undo it. Updates the screen at once and rolls back if saving fails. */
  toggleDose: (doseId: string) => void
  markRefilled: (medicationId: string) => void
  /** The functions below throw on failure so forms can show the error. */
  addPet: (input: NewPet) => Promise<Pet>
  updatePet: (petId: string, patch: PetDetailsPatch) => Promise<Pet>
  addMedication: (input: NewMedication) => Promise<Medication>
  addSymptom: (input: NewSymptomEntry, photo?: File) => Promise<SymptomEntry>
  addAttachment: (visitId: string, file: File) => Promise<void>
  /** Permanently delete a pet and all of its records. */
  deletePet: (petId: string) => Promise<void>
  addVisit: (input: VisitInput) => Promise<Visit>
  updateVisit: (visitId: string, input: VisitInput) => Promise<Visit>
  deleteVisit: (visitId: string) => Promise<void>
  /** Show a short confirmation at the top of the screen (e.g. after a delete that navigates away). */
  announce: (message: string) => void
}

export const AppStateContext = createContext<AppState | null>(null)

export function useAppState(): AppState {
  const state = useContext(AppStateContext)
  if (!state) throw new Error('useAppState must be used inside <AppStateProvider>')
  return state
}

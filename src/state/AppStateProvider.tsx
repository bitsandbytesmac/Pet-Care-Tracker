import { useCallback, useMemo, useState, type ReactNode } from 'react'
import * as sample from '../data/sample'
import type { Dose, Medication, Pet, SymptomEntry, Visit } from '../types'
import {
  AppStateContext,
  type AppState,
  type NewMedication,
  type NewSymptomEntry,
  type PetDetailsPatch,
} from './AppStateContext'

let nextId = 1
const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${nextId++}`

/** In-memory app state seeded from sample data. Swap for API calls when a backend exists. */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [pets, setPets] = useState<Pet[]>(sample.pets)
  const [medications, setMedications] = useState<Medication[]>(sample.medications)
  const [doses, setDoses] = useState<Dose[]>(sample.doses)
  const [visits, setVisits] = useState<Visit[]>(sample.visits)
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>(sample.symptoms)

  const toggleDose = useCallback(
    (doseId: string) => {
      const dose = doses.find((d) => d.id === doseId)
      if (!dose) return
      const nowGiven = !dose.given
      setDoses((current) => current.map((d) => (d.id === doseId ? { ...d, given: nowGiven } : d)))
      setMedications((current) =>
        current.map((m) => {
          if (m.id !== dose.medicationId || m.tracking.kind !== 'supply') return m
          const remaining = Math.min(
            m.tracking.total,
            Math.max(0, m.tracking.remaining + (nowGiven ? -1 : 1)),
          )
          return { ...m, tracking: { ...m.tracking, remaining } }
        }),
      )
    },
    [doses],
  )

  const addMedication = useCallback((input: NewMedication) => {
    const med: Medication = {
      id: makeId('med'),
      name: input.name,
      petId: input.petId,
      dose: input.dose,
      frequency: input.frequency,
      reminderTimes: input.reminderTimes,
      status: 'active',
      tracking: input.totalDays
        ? { kind: 'course', day: 1, totalDays: input.totalDays }
        : { kind: 'ongoing' },
    }
    setMedications((current) => [...current, med])
    setDoses((current) => [
      ...current,
      ...input.reminderTimes.map((time) => ({
        id: makeId('dose'),
        medicationId: med.id,
        time,
        given: false,
        overdue: false,
      })),
    ])
    return med
  }, [])

  const markRefilled = useCallback((medicationId: string) => {
    setMedications((current) =>
      current.map((m) =>
        m.id === medicationId && m.tracking.kind === 'supply'
          ? { ...m, tracking: { ...m.tracking, remaining: m.tracking.total } }
          : m,
      ),
    )
  }, [])

  const addSymptom = useCallback((input: NewSymptomEntry) => {
    const entry: SymptomEntry = {
      id: makeId('sym'),
      ...input,
      title: input.symptoms.join(', '),
    }
    setSymptoms((current) => [entry, ...current])
    return entry
  }, [])

  const updatePet = useCallback((petId: string, patch: PetDetailsPatch) => {
    setPets((current) => current.map((p) => (p.id === petId ? { ...p, ...patch } : p)))
  }, [])

  const addAttachment = useCallback<AppState['addAttachment']>((visitId, attachment) => {
    setVisits((current) =>
      current.map((v) =>
        v.id === visitId
          ? { ...v, attachments: [...v.attachments, { id: makeId('att'), ...attachment }] }
          : v,
      ),
    )
  }, [])

  const value = useMemo<AppState>(
    () => ({
      pets,
      medications,
      doses,
      visits,
      symptoms,
      toggleDose,
      addMedication,
      markRefilled,
      addSymptom,
      updatePet,
      addAttachment,
    }),
    [pets, medications, doses, visits, symptoms, toggleDose, addMedication, markRefilled, addSymptom, updatePet, addAttachment],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

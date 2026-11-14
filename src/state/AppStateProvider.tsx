import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '../components/Button'
import { api, errorMessage } from '../lib/api'
import { localIsoDate } from '../lib/format'
import { useNow } from '../lib/useNow'
import type { AppData, Attachment, Dose, Medication, Pet, SymptomEntry } from '../types'
import { AppStateContext, type AppState, type NewMedication, type NewPet, type NewSymptomEntry, type PetDetailsPatch } from './AppStateContext'

function uploadForm(ownerType: 'visit' | 'symptom', ownerId: string, file: File): FormData {
  const form = new FormData()
  form.set('file', file)
  form.set('ownerType', ownerType)
  form.set('ownerId', ownerId)
  return form
}

/** Flip a dose locally (optimistic update), including the supply count of supply-tracked medicines. */
function applyDoseToggle(data: AppData, doseId: string, given: boolean): AppData {
  const dose = data.doses.find((d) => d.id === doseId)
  if (!dose || Boolean(dose.givenAt) === given) return data
  return {
    ...data,
    doses: data.doses.map((d) => (d.id === doseId ? { ...d, givenAt: given ? new Date().toISOString() : null } : d)),
    medications: data.medications.map((m) =>
      m.id === dose.medicationId && m.tracking.kind === 'supply'
        ? {
            ...m,
            tracking: {
              ...m.tracking,
              remaining: Math.min(m.tracking.total, Math.max(0, m.tracking.remaining + (given ? -1 : 1))),
            },
          }
        : m,
    ),
  }
}

const replaceById = <T extends { id: string }>(items: T[], next: T) => items.map((i) => (i.id === next.id ? next : i))

/** Loads the signed-in user's data from the API and saves every change back to it. */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const now = useNow()
  const today = localIsoDate(now)
  const [data, setData] = useState<AppData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoadError(null)
    api<AppData>(`/state?date=${today}`)
      .then((loaded) => !cancelled && setData(loaded))
      .catch((error: unknown) => !cancelled && setLoadError(errorMessage(error)))
    return () => {
      cancelled = true
    }
  }, [today, reloadKey])

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => (d ? fn(d) : d)), [])

  const toggleDose = useCallback(
    (doseId: string) => {
      const dose = data?.doses.find((d) => d.id === doseId)
      if (!dose) return
      const given = !dose.givenAt
      update((d) => applyDoseToggle(d, doseId, given))
      api<{ dose: Dose; medication: Medication }>(`/doses/${doseId}`, { method: 'PATCH', body: { given } })
        .then((saved) =>
          update((d) => ({
            ...d,
            doses: replaceById(d.doses, saved.dose),
            medications: replaceById(d.medications, saved.medication),
          })),
        )
        .catch((error: unknown) => {
          update((d) => applyDoseToggle(d, doseId, !given))
          setNotice(`Couldn’t save that dose. ${errorMessage(error)}`)
        })
    },
    [data, update],
  )

  const markRefilled = useCallback(
    (medicationId: string) => {
      api<Medication>(`/medications/${medicationId}/refill`, { method: 'POST' })
        .then((med) => update((d) => ({ ...d, medications: replaceById(d.medications, med) })))
        .catch((error: unknown) => setNotice(`Couldn’t mark it as refilled. ${errorMessage(error)}`))
    },
    [update],
  )

  const addPet = useCallback(
    async (input: NewPet) => {
      const pet = await api<Pet>('/pets', { method: 'POST', body: input })
      update((d) => ({ ...d, pets: [...d.pets, pet] }))
      return pet
    },
    [update],
  )

  const updatePet = useCallback(
    async (petId: string, patch: PetDetailsPatch) => {
      const pet = await api<Pet>(`/pets/${petId}`, { method: 'PATCH', body: patch })
      update((d) => ({ ...d, pets: replaceById(d.pets, pet) }))
      return pet
    },
    [update],
  )

  const addMedication = useCallback(
    async (input: NewMedication) => {
      const saved = await api<{ medication: Medication; doses: Dose[] }>('/medications', {
        method: 'POST',
        body: { ...input, date: today },
      })
      update((d) => ({
        ...d,
        medications: [...d.medications, saved.medication],
        doses: [...d.doses, ...saved.doses],
      }))
      return saved.medication
    },
    [today, update],
  )

  const addSymptom = useCallback(
    async (input: NewSymptomEntry, photo?: File) => {
      let entry = await api<SymptomEntry>('/symptoms', { method: 'POST', body: input })
      if (photo) {
        try {
          const attachment = await api<Attachment>('/files', { method: 'POST', form: uploadForm('symptom', entry.id, photo) })
          entry = { ...entry, photo: attachment }
        } catch (error) {
          setNotice(`Entry saved, but the photo couldn’t be uploaded. ${errorMessage(error)}`)
        }
      }
      update((d) => ({ ...d, symptoms: [entry, ...d.symptoms] }))
      return entry
    },
    [update],
  )

  const addAttachment = useCallback(
    async (visitId: string, file: File) => {
      const attachment = await api<Attachment>('/files', { method: 'POST', form: uploadForm('visit', visitId, file) })
      update((d) => ({
        ...d,
        visits: d.visits.map((v) => (v.id === visitId ? { ...v, attachments: [...v.attachments, attachment] } : v)),
      }))
    },
    [update],
  )

  const value = useMemo<AppState | null>(
    () =>
      data && {
        ...data,
        today,
        now,
        toggleDose,
        markRefilled,
        addPet,
        updatePet,
        addMedication,
        addSymptom,
        addAttachment,
      },
    [data, today, now, toggleDose, markRefilled, addPet, updatePet, addMedication, addSymptom, addAttachment],
  )

  if (!value) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-5">
        {loadError ? (
          <div role="alert" className="max-w-sm rounded-3xl border border-line bg-surface p-6 text-center">
            <p className="font-semibold text-ink">Couldn’t load your pets</p>
            <p className="mt-1 text-sm text-ink-muted">{loadError}</p>
            <Button className="mt-4" onClick={() => setReloadKey((k) => k + 1)}>
              Try again
            </Button>
          </div>
        ) : (
          <p role="status" className="text-sm text-ink-muted">
            Loading your pets…
          </p>
        )}
      </div>
    )
  }

  return (
    <AppStateContext.Provider value={value}>
      {children}
      {notice && (
        <div
          role="alert"
          className="fixed inset-x-5 top-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-warn-line bg-warn-tint p-4 text-sm text-warn-dark shadow-lg shadow-ink/10"
        >
          <p className="flex-1">{notice}</p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setNotice(null)}
            className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-white/60"
          >
            <X className="size-4" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      )}
    </AppStateContext.Provider>
  )
}

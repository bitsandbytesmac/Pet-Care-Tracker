import { Pill, Plus, TriangleAlert, X } from 'lucide-react'
import { useState } from 'react'
import { AddMedicationForm } from '../components/AddMedicationForm'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PetPill } from '../components/PetAvatar'
import { ProgressBar } from '../components/ProgressBar'
import { SegmentedControl } from '../components/SegmentedControl'
import { cx } from '../lib/cx'
import { daysOfSupplyLeft, frequencyShort, needsRefill, nextDoseLabel, progressInfo } from '../lib/meds'
import { useIsDesktop } from '../lib/useMediaQuery'
import { useAppState } from '../state/AppStateContext'
import type { Dose, Medication, Pet } from '../types'

type Tab = 'active' | 'completed'

export default function MedicationsPage() {
  const { medications, pets, doses, markRefilled } = useAppState()
  const isDesktop = useIsDesktop()
  const [tab, setTab] = useState<Tab>('active')
  const [formOpen, setFormOpen] = useState(false)

  const active = medications.filter((m) => m.status === 'active')
  const completed = medications.filter((m) => m.status === 'completed')
  const list = tab === 'active' ? active : completed
  const refills = active.filter(needsRefill)
  const petFor = (med: Medication) => pets.find((p) => p.id === med.petId)

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="hidden text-base text-ink-muted md:block">All pets</p>
          <h1 className="text-4xl font-extrabold tracking-tight">Medications</h1>
        </div>
        <button
          type="button"
          aria-label={formOpen ? 'Close add medication form' : 'Add medication'}
          aria-expanded={formOpen}
          onClick={() => setFormOpen((open) => !open)}
          className="flex size-14 items-center justify-center rounded-full bg-primary text-white md:hidden"
        >
          {formOpen ? (
            <X className="size-6" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Plus className="size-6" strokeWidth={2} aria-hidden="true" />
          )}
        </button>
        <SegmentedControl
          label="Show medications"
          className="w-full md:w-auto"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'active', label: `Active (${active.length})` },
            { value: 'completed', label: `Completed (${completed.length})` },
          ]}
        />
      </header>

      {!isDesktop && formOpen && <AddMedicationForm className="mt-5" />}

      {refills.map((med) => (
        <div
          key={med.id}
          className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-warn-line bg-warn-tint p-4 text-warn-dark"
        >
          <TriangleAlert className="size-6 shrink-0 text-warn" strokeWidth={2} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">Refill soon: {med.name}</p>
            <p className="text-sm">
              About {daysOfSupplyLeft(med)} days left for {petFor(med)?.name}
            </p>
          </div>
          <Button variant="warn-outline" onClick={() => markRefilled(med.id)} className="max-md:w-full">
            Mark as refilled
          </Button>
        </div>
      ))}

      {isDesktop ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <MedicationTable meds={list} pets={pets} doses={doses} tab={tab} />
          <AddMedicationForm />
        </div>
      ) : (
        <ul aria-label={tab === 'active' ? 'Active medications' : 'Completed medications'} className="mt-5 space-y-4">
          {list.map((med) => {
            const pet = petFor(med)
            return pet ? <MedicationCard key={med.id} med={med} pet={pet} doses={doses} /> : null
          })}
        </ul>
      )}

      {list.length === 0 && (
        <p className="mt-6 text-center text-sm text-ink-muted">
          {tab === 'active' ? 'No active medications.' : 'No completed medications yet.'}
        </p>
      )}
    </>
  )
}

function MedIcon({ warn }: { warn: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'flex size-12 shrink-0 items-center justify-center rounded-2xl',
        warn ? 'bg-warn-tint text-warn' : 'bg-primary-tint text-primary',
      )}
    >
      <Pill className="size-6" strokeWidth={2} />
    </span>
  )
}

function MedicationCard({ med, pet, doses }: { med: Medication; pet: Pet; doses: Dose[] }) {
  const progress = progressInfo(med)
  return (
    <Card as="li" className="p-5">
      <div className="flex items-start gap-4">
        <MedIcon warn={progress.low} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{med.name}</h2>
          <p className="text-sm text-ink-muted">
            {pet.name} · {med.dose}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-divider px-3 py-1 text-xs font-semibold text-ink-soft">
          {frequencyShort(med.frequency)}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="text-ink-muted">
          {progress.kind} · {progress.label.charAt(0).toLowerCase() + progress.label.slice(1)}
        </span>
        <span className="font-bold">{nextDoseLabel(med, doses).replace(/^Today, /, 'Next ')}</span>
      </div>
      <ProgressBar
        className="mt-3"
        value={progress.value}
        max={progress.max}
        tone={progress.low ? 'warn' : 'primary'}
        label={`${med.name} ${progress.kind.toLowerCase()} progress`}
      />
    </Card>
  )
}

interface MedicationTableProps {
  meds: Medication[]
  pets: Pet[]
  doses: Dose[]
  tab: Tab
}

function MedicationTable({ meds, pets, doses, tab }: MedicationTableProps) {
  const th = 'px-5 py-3 text-left text-xs font-semibold tracking-wider text-ink-muted uppercase'
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] text-sm">
          <caption className="sr-only">{tab === 'active' ? 'Active medications' : 'Completed medications'}</caption>
          <thead className="border-b border-divider">
            <tr>
              <th scope="col" className={th}>
                Medicine
              </th>
              <th scope="col" className={th}>
                Pet
              </th>
              <th scope="col" className={th}>
                Schedule
              </th>
              <th scope="col" className={th}>
                Progress
              </th>
              <th scope="col" className={th}>
                {tab === 'active' ? 'Next' : 'Finished'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {meds.map((med) => {
              const pet = pets.find((p) => p.id === med.petId)
              const progress = progressInfo(med)
              return (
                <tr key={med.id}>
                  <th scope="row" className="px-5 py-4 text-left font-normal">
                    <span className="block font-bold text-ink">{med.name}</span>
                    <span className="block text-xs text-ink-muted">{med.dose}</span>
                  </th>
                  <td className="px-5 py-4">{pet && <PetPill pet={pet} />}</td>
                  <td className="px-5 py-4 text-ink-soft">{med.frequency}</td>
                  <td className="w-44 px-5 py-4">
                    <span className="block text-xs text-ink-muted">{progress.label}</span>
                    <ProgressBar
                      className="mt-1.5"
                      value={progress.value}
                      max={progress.max}
                      tone={progress.low ? 'warn' : 'primary'}
                      label={`${med.name} ${progress.kind.toLowerCase()} progress`}
                    />
                  </td>
                  <td className="px-5 py-4 font-semibold whitespace-nowrap">
                    {nextDoseLabel(med, doses).replace(/^Finished /, '')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

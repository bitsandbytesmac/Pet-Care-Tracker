import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Field, Legend, inputClass } from '../components/Field'
import { PetAvatar } from '../components/PetAvatar'
import { SegmentedControl } from '../components/SegmentedControl'
import { errorMessage } from '../lib/api'
import { cx } from '../lib/cx'
import { useAppState } from '../state/AppStateContext'
import { PET_COLORS, SEXES, SPECIES, type PetColor, type Sex, type Species } from '../types'

const colorLabels: Record<PetColor, string> = { peach: 'Peach', mint: 'Mint' }

export default function AddPetPage() {
  const { pets, addPet } = useAppState()
  const navigate = useNavigate()
  const id = useId()
  const [name, setName] = useState('')
  const [species, setSpecies] = useState<Species>('Cat')
  const [breed, setBreed] = useState('')
  const [sex, setSex] = useState<Sex>('Female')
  // Alternate colors so two pets are easy to tell apart.
  const [color, setColor] = useState<PetColor>(pets.length % 2 === 0 ? 'peach' : 'mint')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Give your pet a name.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const pet = await addPet({ name: name.trim(), species, breed: breed.trim(), sex, color })
      navigate(`/pets/${pet.id}`)
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <>
      <header>
        <p className="hidden text-base text-ink-muted md:block">{pets.length === 0 ? 'Let’s get started' : 'Your pets'}</p>
        <h1 className="text-4xl font-extrabold tracking-tight">Add a pet</h1>
      </header>

      <Card as="section" aria-label="New pet" className="mt-6 max-w-xl p-5 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Field label="Name" htmlFor={`${id}-name`}>
            <input id={`${id}-name`} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Species" htmlFor={`${id}-species`}>
              <select
                id={`${id}-species`}
                className={inputClass}
                value={species}
                onChange={(e) => setSpecies(e.target.value as Species)}
              >
                {SPECIES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Breed" htmlFor={`${id}-breed`}>
              <input
                id={`${id}-breed`}
                className={inputClass}
                placeholder="e.g. Aspin"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
              />
            </Field>
          </div>

          <fieldset>
            <Legend>Sex</Legend>
            <SegmentedControl label="Sex" value={sex} onChange={setSex} options={SEXES.map((s) => ({ value: s, label: s }))} />
          </fieldset>

          <fieldset>
            <Legend>Color</Legend>
            <div className="flex gap-3">
              {PET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className={cx(
                    'flex h-14 items-center gap-3 rounded-2xl border-2 bg-surface pr-5 pl-2 text-sm font-semibold',
                    color === c ? 'border-primary' : 'border-line hover:border-ink-muted',
                  )}
                >
                  <PetAvatar pet={{ name: name.trim() || '?', color: c }} size="md" />
                  {colorLabels[c]}
                </button>
              ))}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="rounded-xl bg-severe-tint px-3 py-2 text-sm text-severe">
              {error}
            </p>
          )}

          <Button type="submit" block disabled={busy}>
            {busy ? 'Saving…' : 'Save pet'}
          </Button>
        </form>
      </Card>
    </>
  )
}

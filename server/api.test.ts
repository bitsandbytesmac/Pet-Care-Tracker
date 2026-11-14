import { describe, expect, it } from 'vitest'
import type { AppData, Attachment, Dose, Medication, Pet, SymptomEntry } from '../src/types'
import { app } from './app'
import { ORIGIN, TODAY, createTestUser } from './test/client'

const byName = (data: AppData, name: string) => {
  const med = data.medications.find((m) => m.name === name)
  if (!med) throw new Error(`No medication named ${name}`)
  return med
}
const dosesOf = (data: AppData, med: Medication) => data.doses.filter((d) => d.medicationId === med.id)

describe('public endpoints', () => {
  it('reports health without a session', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('exposes whether sign-up is allowed', async () => {
    const res = await app.request('/api/config')
    expect(await res.json()).toEqual({ allowSignup: true })
  })

  it('sets security headers', async () => {
    const res = await app.request('/api/health')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
  })
})

describe('authentication', () => {
  it.each([
    ['GET', '/api/state?date=2026-11-13'],
    ['POST', '/api/pets'],
    ['PATCH', '/api/doses/00000000-0000-4000-8000-000000000000'],
    ['GET', '/api/files/00000000-0000-4000-8000-000000000000'],
  ])('%s %s returns 401 without a session', async (method, path) => {
    const res = await app.request(path, { method, headers: { Origin: ORIGIN } })
    expect(res.status).toBe(401)
  })

  it('rejects a forged session cookie', async () => {
    const res = await app.request('/api/state?date=2026-11-13', {
      headers: { Cookie: 'better-auth.session_token=forged.value' },
    })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/state', () => {
  it('returns the seeded account with today’s schedule', async () => {
    const user = await createTestUser()
    const data = await user.state()

    expect(data.pets.map((p) => p.name)).toEqual(['Mochi', 'Bantay'])
    expect(data.medications.filter((m) => m.status === 'active')).toHaveLength(3)
    expect(data.medications.filter((m) => m.status === 'completed')).toHaveLength(2)
    expect(data.doses.map((d) => [d.time, Boolean(d.givenAt)])).toEqual([
      ['08:00', true],
      ['08:30', true],
      ['18:00', false],
      ['21:00', false],
    ])
    expect(data.visits.filter((v) => v.upcoming).map((v) => [v.title, v.date])).toEqual([
      ['Annual check-up & vaccines', '2026-11-17'],
    ])
    expect(data.symptoms[0]?.title).toBe('Scratching left ear')
    expect(byName(data, 'Antibiotic').startDate).toBe('2026-11-08')
  })

  it('does not duplicate doses when called repeatedly or concurrently', async () => {
    const user = await createTestUser()
    await Promise.all([user.state('2026-11-14'), user.state('2026-11-14'), user.state('2026-11-14')])
    const data = await user.state('2026-11-14')
    const keys = data.doses.map((d) => `${d.medicationId}@${d.time}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('generates a new day from reminder times', async () => {
    const user = await createTestUser()
    const data = await user.state('2026-11-14')
    expect(data.doses.every((d) => d.date === '2026-11-14' && d.givenAt === null)).toBe(true)
    expect(dosesOf(data, byName(data, 'Antibiotic')).map((d) => d.time)).toEqual(['08:00', '18:00'])
    expect(dosesOf(data, byName(data, 'Ear drops')).map((d) => d.time)).toEqual(['08:30', '21:00'])
    expect(dosesOf(data, byName(data, 'Joint supplement')).map((d) => d.time)).toEqual(['08:00'])
    expect(data.doses).toHaveLength(5)
  })

  it('stops scheduling a course after its last day', async () => {
    const user = await createTestUser()
    // Antibiotic: 14 days from Nov 8 → last day Nov 21.
    const lastDay = await user.state('2026-11-21')
    const afterCourse = await user.state('2026-11-22')
    expect(dosesOf(lastDay, byName(lastDay, 'Antibiotic'))).toHaveLength(2)
    expect(dosesOf(afterCourse, byName(afterCourse, 'Antibiotic'))).toHaveLength(0)
  })

  it.each(['', 'today', '2026-13-01', '2026-02-30'])('rejects date "%s" with 400', async (date) => {
    const user = await createTestUser({ seed: false })
    const { status, body } = await user.json<{ error: string }>(`/api/state?date=${date}`)
    expect(status).toBe(400)
    expect(body.error).toMatch(/date/i)
  })
})

describe('PATCH /api/doses/:id', () => {
  it('marks a dose given and back, adjusting supply exactly once per change', async () => {
    const user = await createTestUser()
    const data = await user.state()
    const joint = byName(data, 'Joint supplement')
    const dose = dosesOf(data, joint)[0]!
    expect(joint.tracking).toEqual({ kind: 'supply', remaining: 5, total: 60 })

    const undo = await user.json<{ dose: Dose; medication: Medication }>(`/api/doses/${dose.id}`, {
      method: 'PATCH',
      body: { given: false },
    })
    expect(undo.status).toBe(200)
    expect(undo.body.dose.givenAt).toBeNull()
    expect(undo.body.medication.tracking).toMatchObject({ remaining: 6 })

    const again = await user.json<{ medication: Medication }>(`/api/doses/${dose.id}`, {
      method: 'PATCH',
      body: { given: false },
    })
    expect(again.body.medication.tracking).toMatchObject({ remaining: 6 })

    const give = await user.json<{ dose: Dose; medication: Medication }>(`/api/doses/${dose.id}`, {
      method: 'PATCH',
      body: { given: true },
    })
    expect(give.body.dose.givenAt).not.toBeNull()
    expect(give.body.medication.tracking).toMatchObject({ remaining: 5 })
  })

  it('validates the body', async () => {
    const user = await createTestUser()
    const dose = (await user.state()).doses[0]!
    const res = await user.json(`/api/doses/${dose.id}`, { method: 'PATCH', body: { given: 'yes' } })
    expect(res.status).toBe(400)
    const bad = await user.request(`/api/doses/${dose.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    })
    expect(bad.status).toBe(400)
  })

  it('returns 404 for ids that are not UUIDs', async () => {
    const user = await createTestUser({ seed: false })
    const res = await user.json('/api/doses/not-a-uuid', { method: 'PATCH', body: { given: true } })
    expect(res.status).toBe(404)
  })
})

describe('data isolation between users', () => {
  it('never exposes or changes another user’s records', async () => {
    const alice = await createTestUser()
    const bob = await createTestUser()
    const aliceData = await alice.state()
    const pet = aliceData.pets[0]!
    const dose = aliceData.doses[2]!
    const med = byName(aliceData, 'Joint supplement')
    const visit = aliceData.visits.find((v) => !v.upcoming)!

    const bobData = await bob.state()
    expect(bobData.pets.map((p) => p.id)).not.toContain(pet.id)

    const attempts = await Promise.all([
      bob.json(`/api/doses/${dose.id}`, { method: 'PATCH', body: { given: true } }),
      bob.json(`/api/pets/${pet.id}`, { method: 'PATCH', body: { age: 'hacked' } }),
      bob.json(`/api/medications/${med.id}/refill`, { method: 'POST' }),
      bob.json('/api/medications', {
        method: 'POST',
        body: { name: 'X', petId: pet.id, dose: '1', frequency: 'Once daily', reminderTimes: ['08:00'], date: TODAY },
      }),
      bob.json('/api/symptoms', {
        method: 'POST',
        body: { petId: pet.id, date: TODAY, time: '10:00', symptoms: ['Vomiting'], severity: 'Mild' },
      }),
      bob.request('/api/files', { method: 'POST', body: uploadForm('visit', visit.id, pngFile()) }),
    ])
    expect(attempts.map((r) => r.status)).toEqual([404, 404, 404, 404, 404, 404])

    // Alice's data is unchanged.
    const after = await alice.state()
    expect(after.doses.find((d) => d.id === dose.id)?.givenAt).toBeNull()
    expect(after.pets[0]?.age).toBe(pet.age)
    expect(byName(after, 'Joint supplement').tracking).toEqual(med.tracking)
  })
})

describe('writes', () => {
  it('updates pet details', async () => {
    const user = await createTestUser()
    const pet = (await user.state()).pets[0]!
    const res = await user.json<Pet>(`/api/pets/${pet.id}`, {
      method: 'PATCH',
      body: { age: '3 years', weight: '4.2 kg', neutered: false },
    })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ age: '3 years', weight: '4.2 kg', neutered: false, name: 'Mochi' })
  })

  it('adds a pet with validation', async () => {
    const user = await createTestUser({ seed: false })
    const ok = await user.json<Pet>('/api/pets', {
      method: 'POST',
      body: { name: '  Kuting ', species: 'Cat', sex: 'Female', color: 'peach' },
    })
    expect(ok.status).toBe(201)
    expect(ok.body).toMatchObject({ name: 'Kuting', breed: '', weightHistory: [] })

    const bad = await user.json<{ error: string }>('/api/pets', {
      method: 'POST',
      body: { name: '', species: 'Dragon', sex: 'Female', color: 'peach' },
    })
    expect(bad.status).toBe(400)
  })

  it('adds a medication and schedules today’s doses', async () => {
    const user = await createTestUser()
    const pet = (await user.state()).pets[0]!
    const res = await user.json<{ medication: Medication; doses: Dose[] }>('/api/medications', {
      method: 'POST',
      body: {
        name: 'Probiotic',
        petId: pet.id,
        dose: '1 sachet',
        frequency: 'Twice daily',
        reminderTimes: ['20:00', '08:00', '08:00'],
        totalDays: 5,
        date: TODAY,
      },
    })
    expect(res.status).toBe(201)
    expect(res.body.medication).toMatchObject({
      startDate: TODAY,
      reminderTimes: ['08:00', '20:00'],
      tracking: { kind: 'course', totalDays: 5 },
    })
    expect(res.body.doses.map((d) => d.time)).toEqual(['08:00', '20:00'])
    expect((await user.state()).doses).toHaveLength(6)
  })

  it('refills a supply-tracked medicine', async () => {
    const user = await createTestUser()
    const joint = byName(await user.state(), 'Joint supplement')
    const res = await user.json<Medication>(`/api/medications/${joint.id}/refill`, { method: 'POST' })
    expect(res.body.tracking).toEqual({ kind: 'supply', remaining: 60, total: 60 })

    const antibiotic = byName(await user.state(), 'Antibiotic')
    const notSupply = await user.json(`/api/medications/${antibiotic.id}/refill`, { method: 'POST' })
    expect(notSupply.status).toBe(404)
  })

  it('logs a symptom with a title built from the symptoms in a fixed order', async () => {
    const user = await createTestUser()
    const pet = (await user.state()).pets[1]!
    const res = await user.json<SymptomEntry>('/api/symptoms', {
      method: 'POST',
      body: { petId: pet.id, date: TODAY, time: '19:30', symptoms: ['Lethargy', 'Vomiting'], severity: 'Moderate', notes: ' Sleepy ' },
    })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ title: 'Vomiting, Lethargy', notes: 'Sleepy', severity: 'Moderate', photo: null })

    const empty = await user.json<{ error: string }>('/api/symptoms', {
      method: 'POST',
      body: { petId: pet.id, date: TODAY, time: '19:30', symptoms: [], severity: 'Mild' },
    })
    expect(empty.status).toBe(400)
    expect(empty.body.error).toContain('Pick at least one symptom')
  })
})

function pngFile(size = 68, type = 'image/png', name = 'leg.png'): File {
  return new File([new Uint8Array(size).fill(7)], name, { type })
}

function uploadForm(ownerType: string, ownerId: string, file: File, kind?: string): FormData {
  const form = new FormData()
  form.set('file', file)
  form.set('ownerType', ownerType)
  form.set('ownerId', ownerId)
  if (kind) form.set('kind', kind)
  return form
}

describe('files', () => {
  it('uploads a photo to a visit and downloads it back', async () => {
    const user = await createTestUser()
    const visit = (await user.state()).visits.find((v) => !v.upcoming)!

    const res = await user.request('/api/files', { method: 'POST', body: uploadForm('visit', visit.id, pngFile()) })
    expect(res.status).toBe(201)
    const attachment = (await res.json()) as Attachment
    expect(attachment).toMatchObject({ kind: 'photo', name: 'leg.png' })

    const download = await user.request(attachment.url!)
    expect(download.status).toBe(200)
    expect(download.headers.get('Content-Type')).toBe('image/png')
    expect(new Uint8Array(await download.arrayBuffer())).toHaveLength(68)

    const listed = (await user.state()).visits.find((v) => v.id === visit.id)!
    expect(listed.attachments.map((a) => a.id)).toContain(attachment.id)

    const other = await createTestUser({ seed: false })
    expect((await other.request(attachment.url!)).status).toBe(404)
  })

  it('attaches a photo to a symptom entry', async () => {
    const user = await createTestUser()
    const entry = (await user.state()).symptoms[0]!
    const res = await user.request('/api/files', { method: 'POST', body: uploadForm('symptom', entry.id, pngFile(10, 'image/jpeg', 'ear.jpg')) })
    expect(res.status).toBe(201)
    expect((await user.state()).symptoms[0]?.photo?.name).toBe('ear.jpg')
  })

  it('rejects unsupported types, oversized files and cross-site posts', async () => {
    const user = await createTestUser()
    const visit = (await user.state()).visits[1]!

    const html = await user.request('/api/files', {
      method: 'POST',
      body: uploadForm('visit', visit.id, pngFile(10, 'text/html', 'x.html')),
    })
    expect(html.status).toBe(415)

    const big = await user.request('/api/files', {
      method: 'POST',
      body: uploadForm('visit', visit.id, pngFile(5 * 1024 * 1024)),
    })
    expect(big.status).toBe(413)

    const crossSite = await user.request('/api/files', {
      method: 'POST',
      headers: { Origin: 'https://evil.example' },
      body: uploadForm('visit', visit.id, pngFile()),
    })
    expect(crossSite.status).toBe(403)
  })

  it('gives placeholder attachments (no stored file) no URL, and their id 404s', async () => {
    const user = await createTestUser()
    const placeholder = (await user.state()).visits.flatMap((v) => v.attachments)[0]!
    expect(placeholder.url).toBeNull()
    expect((await user.request(`/api/files/${placeholder.id}`)).status).toBe(404)
  })
})

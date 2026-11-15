import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import {
  FREQUENCIES,
  PET_COLORS,
  REMINDER_DAYS,
  SEVERITIES,
  SEXES,
  SPECIES,
  SYMPTOM_KINDS,
  VISIT_STATUSES,
  VISIT_TYPES,
  type AppData,
  type Attachment,
} from '../../src/types'
import { getDb, type Db } from '../db/client'
import { doses, files, medications, pets, symptoms, visitPrescriptions, visits, weightRecords } from '../db/schema'
import { toAttachment, toDose, toMedication, toPet, toSymptom, toVisit } from '../mappers'
import { ensureDosesForDate } from '../schedule'
import { getStorage } from '../storage'
import { isoDateSchema, notFound, parse, pathId, readJson, timeSchema, type AppEnv } from '../http'

const text = (max: number) => z.string().trim().max(max)
const requiredText = (max: number) => text(max).min(1, 'Required')

async function assertOwnsPet(db: Pick<Db, 'select'>, userId: string, petId: string): Promise<void> {
  const [row] = await db
    .select({ id: pets.id })
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.userId, userId)))
  if (!row) throw notFound('Pet not found')
}

/**
 * Remove stored uploads after their rows are deleted. Best effort: a leftover file is
 * unreachable (its row is gone), so a storage hiccup shouldn't fail the user's delete.
 */
async function removeStoredFiles(keys: (string | null)[]): Promise<void> {
  const storage = getStorage()
  await Promise.all(
    keys
      .filter((k): k is string => k !== null)
      .map((key) => storage.delete(key).catch((error: unknown) => console.error(`Could not delete stored file ${key}`, error))),
  )
}

export const dataRoutes = new Hono<AppEnv>()

/** Everything the app shows, with the doses for `?date=` (the client's local today). */
dataRoutes.get('/state', async (c) => {
  const userId = c.get('userId')
  const date = parse(isoDateSchema, c.req.query('date'))
  const db = getDb()

  await ensureDosesForDate(db, userId, date)

  const [petRows, weightRows, medRows, doseRows, visitRows, rxRows, fileRows, symptomRows] = await Promise.all([
    db.select().from(pets).where(eq(pets.userId, userId)).orderBy(asc(pets.createdAt)),
    db
      .select({ petId: weightRecords.petId, date: weightRecords.date, kg: weightRecords.kg })
      .from(weightRecords)
      .innerJoin(pets, eq(pets.id, weightRecords.petId))
      .where(eq(pets.userId, userId))
      .orderBy(asc(weightRecords.date)),
    db.select().from(medications).where(eq(medications.userId, userId)).orderBy(asc(medications.createdAt)),
    db
      .select()
      .from(doses)
      .where(and(eq(doses.userId, userId), eq(doses.date, date)))
      .orderBy(asc(doses.time)),
    db.select().from(visits).where(eq(visits.userId, userId)).orderBy(desc(visits.date), desc(visits.time)),
    db
      .select({ visitId: visitPrescriptions.visitId, medicationId: visitPrescriptions.medicationId })
      .from(visitPrescriptions)
      .innerJoin(visits, eq(visits.id, visitPrescriptions.visitId))
      .where(eq(visits.userId, userId)),
    db.select().from(files).where(eq(files.userId, userId)).orderBy(asc(files.createdAt)),
    db
      .select()
      .from(symptoms)
      .where(eq(symptoms.userId, userId))
      .orderBy(desc(symptoms.date), desc(symptoms.time), desc(symptoms.createdAt)),
  ])

  const filesByOwner = new Map<string, Attachment[]>()
  for (const f of fileRows) {
    const key = `${f.ownerType}:${f.ownerId}`
    filesByOwner.set(key, [...(filesByOwner.get(key) ?? []), toAttachment(f)])
  }

  const data: AppData = {
    pets: petRows.map((p) =>
      toPet(
        p,
        weightRows.filter((w) => w.petId === p.id).map((w) => ({ date: w.date, kg: w.kg })),
      ),
    ),
    medications: medRows.map(toMedication),
    doses: doseRows.map(toDose),
    visits: visitRows.map((v) =>
      toVisit(
        v,
        rxRows.filter((r) => r.visitId === v.id).map((r) => r.medicationId),
        filesByOwner.get(`visit:${v.id}`) ?? [],
      ),
    ),
    symptoms: symptomRows.map((s) => toSymptom(s, filesByOwner.get(`symptom:${s.id}`)?.[0] ?? null)),
  }
  return c.json(data)
})

// --- Pets -----------------------------------------------------------------

const newPetSchema = z.object({
  name: requiredText(60),
  species: z.enum(SPECIES),
  breed: text(80).default(''),
  sex: z.enum(SEXES),
  color: z.enum(PET_COLORS),
})

dataRoutes.post('/pets', async (c) => {
  const input = parse(newPetSchema, await readJson(c))
  const [row] = await getDb()
    .insert(pets)
    .values({ ...input, userId: c.get('userId') })
    .returning()
  return c.json(toPet(row!, []), 201)
})

const petPatchSchema = z
  .object({
    age: text(40),
    weight: text(40),
    neutered: z.boolean(),
    clinic: text(120),
    lastVaccine: text(60),
    food: text(120),
    allergies: text(200),
  })
  .partial()

dataRoutes.patch('/pets/:id', async (c) => {
  const id = pathId(c)
  const patch = parse(petPatchSchema, await readJson(c))
  const db = getDb()
  const [row] = await db
    .update(pets)
    .set(patch)
    .where(and(eq(pets.id, id), eq(pets.userId, c.get('userId'))))
    .returning()
  if (!row) throw notFound('Pet not found')
  const weights = await db.select().from(weightRecords).where(eq(weightRecords.petId, id)).orderBy(asc(weightRecords.date))
  return c.json(toPet(row, weights.map((w) => ({ date: w.date, kg: w.kg }))))
})

/**
 * Delete a pet and everything recorded for it. Medicines, doses, visits, symptoms and weights
 * go by foreign-key cascade; uploaded files have no foreign key, so they are removed here.
 */
dataRoutes.delete('/pets/:id', async (c) => {
  const id = pathId(c)
  const userId = c.get('userId')
  const removedKeys = await getDb().transaction(async (tx) => {
    await assertOwnsPet(tx, userId, id)
    const [visitRows, symptomRows] = await Promise.all([
      tx.select({ id: visits.id }).from(visits).where(and(eq(visits.petId, id), eq(visits.userId, userId))),
      tx.select({ id: symptoms.id }).from(symptoms).where(and(eq(symptoms.petId, id), eq(symptoms.userId, userId))),
    ])
    const owners = [
      ...(visitRows.length ? [and(eq(files.ownerType, 'visit'), inArray(files.ownerId, visitRows.map((v) => v.id)))] : []),
      ...(symptomRows.length
        ? [and(eq(files.ownerType, 'symptom'), inArray(files.ownerId, symptomRows.map((s) => s.id)))]
        : []),
    ]
    const removed = owners.length
      ? await tx
          .delete(files)
          .where(and(eq(files.userId, userId), or(...owners)))
          .returning({ storageKey: files.storageKey })
      : []
    await tx.delete(pets).where(and(eq(pets.id, id), eq(pets.userId, userId)))
    return removed.map((f) => f.storageKey)
  })
  await removeStoredFiles(removedKeys)
  return c.body(null, 204)
})

// --- Visits -----------------------------------------------------------------

const visitSchema = z.object({
  petId: z.uuid(),
  type: z.enum(VISIT_TYPES),
  status: z.enum(VISIT_STATUSES),
  date: isoDateSchema,
  time: timeSchema.nullable().default(null),
  title: requiredText(120),
  clinic: text(120).default(''),
  diagnosis: text(2000).default(''),
  treatment: text(2000).default(''),
  notes: text(2000).default(''),
  cost: z.number().nonnegative().max(99_999_999).nullable().default(null),
  reminderDays: z
    .int()
    .refine((d) => (REMINDER_DAYS as readonly number[]).includes(d), `Reminder must be one of ${REMINDER_DAYS.join(', ')} days`)
    .nullable()
    .default(null),
})

/** Normalize a validated visit for storage: cents precision; reminders only for scheduled visits. */
function visitValues(input: z.infer<typeof visitSchema>) {
  return {
    ...input,
    cost: input.cost === null ? null : Math.round(input.cost * 100) / 100,
    reminderDays: input.status === 'scheduled' ? input.reminderDays : null,
  }
}

dataRoutes.post('/visits', async (c) => {
  const userId = c.get('userId')
  const input = parse(visitSchema, await readJson(c))
  const db = getDb()
  await assertOwnsPet(db, userId, input.petId)
  const [row] = await db
    .insert(visits)
    .values({ ...visitValues(input), userId })
    .returning()
  return c.json(toVisit(row!, [], []), 201)
})

/** Replace a visit's details (the edit form sends every field). Also used to mark an appointment done. */
dataRoutes.patch('/visits/:id', async (c) => {
  const id = pathId(c)
  const userId = c.get('userId')
  const input = parse(visitSchema, await readJson(c))
  const db = getDb()
  await assertOwnsPet(db, userId, input.petId)
  const [row] = await db
    .update(visits)
    .set(visitValues(input))
    .where(and(eq(visits.id, id), eq(visits.userId, userId)))
    .returning()
  if (!row) throw notFound('Visit not found')

  const [rxRows, fileRows] = await Promise.all([
    db.select({ medicationId: visitPrescriptions.medicationId }).from(visitPrescriptions).where(eq(visitPrescriptions.visitId, id)),
    db
      .select()
      .from(files)
      .where(and(eq(files.userId, userId), eq(files.ownerType, 'visit'), eq(files.ownerId, id)))
      .orderBy(asc(files.createdAt)),
  ])
  return c.json(toVisit(row, rxRows.map((r) => r.medicationId), fileRows.map(toAttachment)))
})

/** Delete a visit and its attachments. Linked medicines stay; only the link is removed. */
dataRoutes.delete('/visits/:id', async (c) => {
  const id = pathId(c)
  const userId = c.get('userId')
  const removedKeys = await getDb().transaction(async (tx) => {
    const [row] = await tx
      .delete(visits)
      .where(and(eq(visits.id, id), eq(visits.userId, userId)))
      .returning({ id: visits.id })
    if (!row) throw notFound('Visit not found')
    const removed = await tx
      .delete(files)
      .where(and(eq(files.userId, userId), eq(files.ownerType, 'visit'), eq(files.ownerId, id)))
      .returning({ storageKey: files.storageKey })
    return removed.map((f) => f.storageKey)
  })
  await removeStoredFiles(removedKeys)
  return c.body(null, 204)
})

// --- Medications ------------------------------------------------------------

const newMedicationSchema = z.object({
  name: requiredText(80),
  petId: z.uuid(),
  dose: requiredText(120),
  frequency: z.enum(FREQUENCIES),
  reminderTimes: z.array(timeSchema).max(6),
  totalDays: z.int().min(1).max(365).optional(),
  /** The client's local today: the medicine starts then and today's doses are created. */
  date: isoDateSchema,
})

dataRoutes.post('/medications', async (c) => {
  const userId = c.get('userId')
  const input = parse(newMedicationSchema, await readJson(c))
  const db = getDb()
  await assertOwnsPet(db, userId, input.petId)

  const [row] = await db
    .insert(medications)
    .values({
      userId,
      petId: input.petId,
      name: input.name,
      dose: input.dose,
      frequency: input.frequency,
      reminderTimes: [...new Set(input.reminderTimes)].sort(),
      startDate: input.date,
      trackingKind: input.totalDays ? 'course' : 'ongoing',
      totalDays: input.totalDays ?? null,
    })
    .returning()

  await ensureDosesForDate(db, userId, input.date)
  const todays = await db
    .select()
    .from(doses)
    .where(and(eq(doses.medicationId, row!.id), eq(doses.date, input.date)))
    .orderBy(asc(doses.time))
  return c.json({ medication: toMedication(row!), doses: todays.map(toDose) }, 201)
})

dataRoutes.post('/medications/:id/refill', async (c) => {
  const id = pathId(c)
  const [row] = await getDb()
    .update(medications)
    .set({ supplyRemaining: sql`${medications.supplyTotal}` })
    .where(and(eq(medications.id, id), eq(medications.userId, c.get('userId')), eq(medications.trackingKind, 'supply')))
    .returning()
  if (!row) throw notFound('Medication not found')
  return c.json(toMedication(row))
})

// --- Doses -----------------------------------------------------------------

/** Mark a dose given or not given. Idempotent; supply-tracked medicines go down/up by one on change. */
dataRoutes.patch('/doses/:id', async (c) => {
  const id = pathId(c)
  const userId = c.get('userId')
  const { given } = parse(z.object({ given: z.boolean() }), await readJson(c))

  const result = await getDb().transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(doses)
      .where(and(eq(doses.id, id), eq(doses.userId, userId)))
      .for('update')
    if (!current) throw notFound('Dose not found')

    let dose = current
    if ((current.givenAt !== null) !== given) {
      const [updated] = await tx
        .update(doses)
        .set({ givenAt: given ? new Date() : null })
        .where(eq(doses.id, id))
        .returning()
      dose = updated ?? current
      await tx
        .update(medications)
        .set({
          supplyRemaining: sql`greatest(0, least(${medications.supplyTotal}, ${medications.supplyRemaining} + ${given ? -1 : 1}))`,
        })
        .where(and(eq(medications.id, current.medicationId), eq(medications.trackingKind, 'supply')))
    }
    const [med] = await tx.select().from(medications).where(eq(medications.id, current.medicationId))
    return { dose: toDose(dose), medication: toMedication(med!) }
  })
  return c.json(result)
})

// --- Symptoms ----------------------------------------------------------------

const newSymptomSchema = z.object({
  petId: z.uuid(),
  date: isoDateSchema,
  time: timeSchema,
  symptoms: z.array(z.enum(SYMPTOM_KINDS)).min(1, 'Pick at least one symptom').max(SYMPTOM_KINDS.length),
  severity: z.enum(SEVERITIES),
  notes: text(2000).default(''),
})

dataRoutes.post('/symptoms', async (c) => {
  const userId = c.get('userId')
  const input = parse(newSymptomSchema, await readJson(c))
  const db = getDb()
  await assertOwnsPet(db, userId, input.petId)

  const ordered = SYMPTOM_KINDS.filter((k) => input.symptoms.includes(k))
  const [row] = await db
    .insert(symptoms)
    .values({ ...input, userId, symptoms: ordered, title: ordered.join(', ') })
    .returning()
  return c.json(toSymptom(row!, null), 201)
})

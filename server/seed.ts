import { buildSampleData, PLACEHOLDERS } from '../src/data/sample'
import { localDateTime } from '../src/lib/format'
import type { Db } from './db/client'
import { doses, files, medications, pets, symptoms, visitPrescriptions, visits } from './db/schema'

/** Fill a (new, empty) account with the sample pets, medicines, visits and symptoms, relative to `today`. */
export async function seedSampleData(db: Db, userId: string, today: string): Promise<void> {
  const sample = buildSampleData(today)

  await db.transaction(async (tx) => {
    const petIds = new Map<string, string>()
    for (const p of sample.pets) {
      const [row] = await tx
        .insert(pets)
        .values({
          userId,
          name: p.name,
          species: p.species,
          breed: p.breed,
          sex: p.sex,
          color: p.color,
          neutered: p.neutered,
          ...PLACEHOLDERS,
        })
        .returning({ id: pets.id })
      petIds.set(p.key, row!.id)
    }

    const medIds = new Map<string, string>()
    for (const m of sample.medications) {
      const t = m.tracking
      const [row] = await tx
        .insert(medications)
        .values({
          userId,
          petId: petIds.get(m.petKey)!,
          name: m.name,
          dose: m.dose,
          frequency: m.frequency,
          reminderTimes: m.reminderTimes,
          status: m.status,
          startDate: m.startDate,
          trackingKind: t.kind,
          totalDays: t.kind === 'course' ? t.totalDays : null,
          supplyRemaining: t.kind === 'supply' ? t.remaining : null,
          supplyTotal: t.kind === 'supply' ? t.total : null,
          completedOn: m.completedOn,
        })
        .returning({ id: medications.id })
      medIds.set(m.key, row!.id)
    }

    await tx.insert(doses).values(
      sample.todaysDoses.map((d) => ({
        userId,
        medicationId: medIds.get(d.medicationKey)!,
        date: today,
        time: d.time,
        givenAt: d.given ? localDateTime(today, d.time) : null,
      })),
    )

    for (const v of sample.visits) {
      const [row] = await tx
        .insert(visits)
        .values({
          userId,
          petId: petIds.get(v.petKey)!,
          type: v.type,
          status: v.status,
          date: v.date,
          time: v.time,
          title: v.title,
          clinic: PLACEHOLDERS.clinic,
          diagnosis: v.diagnosis,
          treatment: v.treatment,
          notes: v.notes,
          cost: v.cost,
          reminderDays: v.reminderDays,
          weightLogged: v.weightLogged,
        })
        .returning({ id: visits.id })
      const visitId = row!.id
      if (v.prescriptionKeys.length) {
        await tx
          .insert(visitPrescriptions)
          .values(v.prescriptionKeys.map((key) => ({ visitId, medicationId: medIds.get(key)! })))
      }
      if (v.attachments.length) {
        // Placeholder tiles only: no stored file behind them.
        await tx
          .insert(files)
          .values(v.attachments.map((a) => ({ userId, ownerType: 'visit', ownerId: visitId, kind: a.kind, name: a.name })))
      }
    }

    await tx.insert(symptoms).values(
      sample.symptoms.map((s) => ({
        userId,
        petId: petIds.get(s.petKey)!,
        date: s.date,
        time: s.time,
        symptoms: s.symptoms,
        title: s.title,
        notes: s.notes,
        severity: s.severity,
      })),
    )
  })
}

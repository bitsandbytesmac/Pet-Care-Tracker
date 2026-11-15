import type {
  Attachment,
  Dose,
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
  VisitStatus,
  VisitType,
  WeightRecord,
} from '../src/types'
import type { doses, files, medications, pets, symptoms, visits } from './db/schema'

// Text columns hold values that were validated on write, so narrowing casts here are safe.

export function toPet(row: typeof pets.$inferSelect, weightHistory: WeightRecord[]): Pet {
  return {
    id: row.id,
    name: row.name,
    species: row.species as Species,
    breed: row.breed,
    sex: row.sex as Sex,
    color: row.color as PetColor,
    age: row.age,
    weight: row.weight,
    neutered: row.neutered,
    clinic: row.clinic,
    lastVaccine: row.lastVaccine,
    food: row.food,
    allergies: row.allergies,
    weightHistory,
  }
}

export function toMedication(row: typeof medications.$inferSelect): Medication {
  const tracking: Medication['tracking'] =
    row.trackingKind === 'course'
      ? { kind: 'course', totalDays: row.totalDays ?? 1 }
      : row.trackingKind === 'supply'
        ? { kind: 'supply', remaining: row.supplyRemaining ?? 0, total: row.supplyTotal ?? 0 }
        : { kind: 'ongoing' }
  return {
    id: row.id,
    name: row.name,
    petId: row.petId,
    dose: row.dose,
    frequency: row.frequency as Frequency,
    reminderTimes: row.reminderTimes,
    status: row.status as Medication['status'],
    startDate: row.startDate,
    tracking,
    completedOn: row.completedOn,
  }
}

export function toDose(row: typeof doses.$inferSelect): Dose {
  return {
    id: row.id,
    medicationId: row.medicationId,
    date: row.date,
    time: row.time,
    givenAt: row.givenAt?.toISOString() ?? null,
  }
}

export function toAttachment(row: typeof files.$inferSelect): Attachment {
  return { id: row.id, kind: row.kind as Attachment['kind'], name: row.name, url: row.storageKey ? `/api/files/${row.id}` : null }
}

export function toVisit(row: typeof visits.$inferSelect, prescriptionIds: string[], attachments: Attachment[]): Visit {
  return {
    id: row.id,
    petId: row.petId,
    type: row.type as VisitType,
    status: row.status as VisitStatus,
    date: row.date,
    time: row.time,
    title: row.title,
    clinic: row.clinic,
    diagnosis: row.diagnosis,
    treatment: row.treatment,
    notes: row.notes,
    cost: row.cost,
    reminderDays: row.reminderDays,
    prescriptionIds,
    attachments,
    weightLogged: row.weightLogged,
  }
}

export function toSymptom(row: typeof symptoms.$inferSelect, photo: Attachment | null): SymptomEntry {
  return {
    id: row.id,
    petId: row.petId,
    date: row.date,
    time: row.time,
    symptoms: row.symptoms as SymptomKind[],
    title: row.title,
    notes: row.notes,
    severity: row.severity as Severity,
    photo,
  }
}

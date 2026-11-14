import type { Frequency, Medication, PetColor, Severity, Sex, Species, SymptomKind } from '../types'
import { addDays } from '../lib/format'

/**
 * Sample data used to seed a demo account (npm run db:seed) and every Playwright test user.
 * All dates are relative to `today`, so the demo always looks current.
 * Keys (`key`) are stable names used to link records before the database assigns ids.
 */

export interface SamplePet {
  key: string
  name: string
  species: Species
  breed: string
  sex: Sex
  color: PetColor
  neutered: boolean
}

export interface SampleMedication {
  key: string
  petKey: string
  name: string
  dose: string
  frequency: Frequency
  reminderTimes: string[]
  status: Medication['status']
  startDate: string
  tracking: Medication['tracking']
  completedOn: string | null
}

export interface SampleDose {
  medicationKey: string
  time: string
  given: boolean
}

export interface SampleVisit {
  petKey: string
  date: string
  time: string
  title: string
  summary: string
  notes: string
  prescriptionKeys: string[]
  attachments: { kind: 'photo' | 'receipt'; name: string }[]
  weightLogged: boolean
}

export interface SampleSymptom {
  petKey: string
  date: string
  time: string
  symptoms: SymptomKind[]
  title: string
  notes: string
  severity: Severity
}

export interface SampleData {
  pets: SamplePet[]
  medications: SampleMedication[]
  /** Doses for `today` only; other days are generated from reminder times. */
  todaysDoses: SampleDose[]
  visits: SampleVisit[]
  symptoms: SampleSymptom[]
}

export const PLACEHOLDERS = {
  age: '[AGE]',
  weight: '[KG]',
  clinic: '[CLINIC NAME]',
  lastVaccine: '[DATE]',
  food: '[BRAND / AMOUNT]',
  allergies: 'None noted',
} as const

export function buildSampleData(today: string): SampleData {
  const d = (offset: number) => addDays(today, offset)

  return {
    pets: [
      { key: 'mochi', name: 'Mochi', species: 'Cat', breed: 'Domestic shorthair', sex: 'Female', color: 'peach', neutered: true },
      { key: 'bantay', name: 'Bantay', species: 'Dog', breed: 'Aspin', sex: 'Male', color: 'mint', neutered: true },
    ],
    medications: [
      {
        key: 'antibiotic',
        petKey: 'bantay',
        name: 'Antibiotic',
        dose: '1 tablet with food',
        frequency: 'Twice daily',
        reminderTimes: ['08:00', '18:00'],
        status: 'active',
        startDate: d(-5), // day 6 of 14
        tracking: { kind: 'course', totalDays: 14 },
        completedOn: null,
      },
      {
        key: 'ear-drops',
        petKey: 'mochi',
        name: 'Ear drops',
        dose: '2 drops, left ear',
        frequency: 'Twice daily',
        reminderTimes: ['08:30', '21:00'],
        status: 'active',
        startDate: d(-3), // day 4 of 10
        tracking: { kind: 'course', totalDays: 10 },
        completedOn: null,
      },
      {
        key: 'joint-supplement',
        petKey: 'bantay',
        name: 'Joint supplement',
        dose: '1 chew',
        frequency: 'Once daily',
        reminderTimes: ['08:00'],
        status: 'active',
        startDate: d(-55),
        tracking: { kind: 'supply', remaining: 5, total: 60 },
        completedOn: null,
      },
      {
        key: 'dewormer',
        petKey: 'mochi',
        name: 'Dewormer',
        dose: '1 tablet',
        frequency: 'Once daily',
        reminderTimes: ['09:00'],
        status: 'completed',
        startDate: d(-42),
        tracking: { kind: 'course', totalDays: 1 },
        completedOn: d(-42),
      },
      {
        key: 'anti-itch-spray',
        petKey: 'bantay',
        name: 'Anti-itch spray',
        dose: '2 sprays on affected skin',
        frequency: 'Twice daily',
        reminderTimes: ['08:00', '20:00'],
        status: 'completed',
        startDate: d(-62),
        tracking: { kind: 'course', totalDays: 7 },
        completedOn: d(-56),
      },
    ],
    // Today's schedule as designed: the antibiotic's morning dose isn't on it (4 doses, 2 given).
    todaysDoses: [
      { medicationKey: 'joint-supplement', time: '08:00', given: true },
      { medicationKey: 'ear-drops', time: '08:30', given: true },
      { medicationKey: 'antibiotic', time: '18:00', given: false },
      { medicationKey: 'ear-drops', time: '21:00', given: false },
    ],
    visits: [
      {
        petKey: 'bantay',
        date: d(4),
        time: '10:00',
        title: 'Annual check-up & vaccines',
        summary: 'Yearly exam and booster shots.',
        notes: '',
        prescriptionKeys: [],
        attachments: [],
        weightLogged: false,
      },
      {
        petKey: 'bantay',
        date: d(-7),
        time: '15:30',
        title: 'Skin infection on hind leg',
        summary: 'Prescribed a 14-day antibiotic course. Recheck if redness spreads.',
        notes:
          'Red, irritated patch on the left hind leg. Prescribed a 14-day antibiotic course. Recheck if the redness spreads or he stops eating.',
        prescriptionKeys: ['antibiotic'],
        attachments: [
          { kind: 'photo', name: 'Photo' },
          { kind: 'photo', name: 'Photo' },
          { kind: 'receipt', name: 'Receipt' },
        ],
        weightLogged: false,
      },
      {
        petKey: 'mochi',
        date: d(-8),
        time: '11:00',
        title: 'Ear irritation',
        summary: 'Mild inflammation, left ear. Ear drops twice daily for 10 days.',
        notes:
          'Mild inflammation in the left ear, no sign of mites. Ear drops twice daily for 10 days. Come back if head shaking gets worse.',
        prescriptionKeys: ['ear-drops'],
        attachments: [],
        weightLogged: false,
      },
      {
        petKey: 'mochi',
        date: d(-42),
        time: '09:30',
        title: 'Routine deworming',
        summary: 'Weight recorded. Next deworming in about 3 months.',
        notes: 'Routine deworming given at the clinic. Weight recorded. Next deworming in about 3 months.',
        prescriptionKeys: [],
        attachments: [],
        weightLogged: true,
      },
    ],
    symptoms: [
      { petKey: 'mochi', date: d(-4), time: '19:15', symptoms: ['Scratching'], title: 'Scratching left ear', notes: 'Less redness than yesterday', severity: 'Mild' },
      { petKey: 'bantay', date: d(-5), time: '08:40', symptoms: ['Other'], title: 'Redness on hind leg', notes: 'Improving since antibiotics', severity: 'Mild' },
      { petKey: 'mochi', date: d(-9), time: '20:05', symptoms: ['Other'], title: 'Head shaking', notes: 'Started in the evening', severity: 'Mild' },
      { petKey: 'bantay', date: d(-10), time: '17:30', symptoms: ['Limping'], title: 'Limping, licking hind leg', notes: 'Booked a vet visit', severity: 'Moderate' },
    ],
  }
}

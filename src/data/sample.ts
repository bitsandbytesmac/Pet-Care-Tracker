import type { Dose, Medication, Pet, SymptomEntry, Visit } from '../types'

/**
 * The app's "today". Sample data is written relative to this date so the
 * screens (and the Playwright tests) always show the same state.
 */
export const SAMPLE_TODAY = '2026-11-13'

export const pets: Pet[] = [
  {
    id: 'mochi',
    name: 'Mochi',
    species: 'Cat',
    breed: 'Domestic shorthair',
    sex: 'Female',
    age: '[AGE]',
    weight: '[KG]',
    neutered: true,
    color: 'peach',
    clinic: '[CLINIC NAME]',
    lastVaccine: '[DATE]',
    food: '[BRAND / AMOUNT]',
    allergies: 'None noted',
    weightHistory: [],
  },
  {
    id: 'bantay',
    name: 'Bantay',
    species: 'Dog',
    breed: 'Aspin',
    sex: 'Male',
    age: '[AGE]',
    weight: '[KG]',
    neutered: true,
    color: 'mint',
    clinic: '[CLINIC NAME]',
    lastVaccine: '[DATE]',
    food: '[BRAND / AMOUNT]',
    allergies: 'None noted',
    weightHistory: [],
  },
]

export const medications: Medication[] = [
  {
    id: 'antibiotic',
    name: 'Antibiotic',
    petId: 'bantay',
    dose: '1 tablet with food',
    frequency: 'Twice daily',
    reminderTimes: ['08:00', '18:00'],
    status: 'active',
    tracking: { kind: 'course', day: 6, totalDays: 14 },
  },
  {
    id: 'ear-drops',
    name: 'Ear drops',
    petId: 'mochi',
    dose: '2 drops, left ear',
    frequency: 'Twice daily',
    reminderTimes: ['08:30', '21:00'],
    status: 'active',
    tracking: { kind: 'course', day: 4, totalDays: 10 },
  },
  {
    id: 'joint-supplement',
    name: 'Joint supplement',
    petId: 'bantay',
    dose: '1 chew',
    frequency: 'Once daily',
    reminderTimes: ['08:00'],
    status: 'active',
    tracking: { kind: 'supply', remaining: 5, total: 60 },
  },
  {
    id: 'dewormer',
    name: 'Dewormer',
    petId: 'mochi',
    dose: '1 tablet',
    frequency: 'Once daily',
    reminderTimes: ['09:00'],
    status: 'completed',
    tracking: { kind: 'course', day: 1, totalDays: 1 },
    completedOn: '2026-10-02',
  },
  {
    id: 'anti-itch-spray',
    name: 'Anti-itch spray',
    petId: 'bantay',
    dose: '2 sprays on affected skin',
    frequency: 'Twice daily',
    reminderTimes: ['08:00', '20:00'],
    status: 'completed',
    tracking: { kind: 'course', day: 7, totalDays: 7 },
    completedOn: '2026-09-18',
  },
]

/** Today's schedule. */
export const doses: Dose[] = [
  { id: 'dose-1', medicationId: 'joint-supplement', time: '08:00', given: true, overdue: false },
  { id: 'dose-2', medicationId: 'ear-drops', time: '08:30', given: true, overdue: false },
  { id: 'dose-3', medicationId: 'antibiotic', time: '18:00', given: false, overdue: true },
  { id: 'dose-4', medicationId: 'ear-drops', time: '21:00', given: false, overdue: false },
]

export const visits: Visit[] = [
  {
    id: 'visit-checkup',
    petId: 'bantay',
    date: '2026-11-17',
    time: '10:00',
    title: 'Annual check-up & vaccines',
    clinic: '[CLINIC NAME]',
    summary: 'Yearly exam and booster shots.',
    notes: '',
    prescriptionIds: [],
    attachments: [],
    weightLogged: false,
    upcoming: true,
  },
  {
    id: 'visit-skin',
    petId: 'bantay',
    date: '2026-11-06',
    time: '15:30',
    title: 'Skin infection on hind leg',
    clinic: '[CLINIC NAME]',
    summary: 'Prescribed a 14-day antibiotic course. Recheck if redness spreads.',
    notes:
      'Red, irritated patch on the left hind leg. Prescribed a 14-day antibiotic course. Recheck if the redness spreads or he stops eating.',
    prescriptionIds: ['antibiotic'],
    attachments: [
      { id: 'att-1', kind: 'photo', name: 'Photo' },
      { id: 'att-2', kind: 'photo', name: 'Photo' },
      { id: 'att-3', kind: 'receipt', name: 'Receipt' },
    ],
    weightLogged: false,
    upcoming: false,
  },
  {
    id: 'visit-ear',
    petId: 'mochi',
    date: '2026-11-05',
    time: '11:00',
    title: 'Ear irritation',
    clinic: '[CLINIC NAME]',
    summary: 'Mild inflammation, left ear. Ear drops twice daily for 10 days.',
    notes:
      'Mild inflammation in the left ear, no sign of mites. Ear drops twice daily for 10 days. Come back if head shaking gets worse.',
    prescriptionIds: ['ear-drops'],
    attachments: [],
    weightLogged: false,
    upcoming: false,
  },
  {
    id: 'visit-deworm',
    petId: 'mochi',
    date: '2026-10-02',
    time: '09:30',
    title: 'Routine deworming',
    clinic: '[CLINIC NAME]',
    summary: 'Weight recorded. Next deworming in about 3 months.',
    notes: 'Routine deworming given at the clinic. Weight recorded. Next deworming in about 3 months.',
    prescriptionIds: [],
    attachments: [],
    weightLogged: true,
    upcoming: false,
  },
]

/** Newest first. */
export const symptoms: SymptomEntry[] = [
  {
    id: 'sym-1',
    petId: 'mochi',
    date: '2026-11-09',
    time: '19:15',
    symptoms: ['Scratching'],
    title: 'Scratching left ear',
    notes: 'Less redness than yesterday',
    severity: 'Mild',
  },
  {
    id: 'sym-2',
    petId: 'bantay',
    date: '2026-11-08',
    time: '08:40',
    symptoms: ['Other'],
    title: 'Redness on hind leg',
    notes: 'Improving since antibiotics',
    severity: 'Mild',
  },
  {
    id: 'sym-3',
    petId: 'mochi',
    date: '2026-11-04',
    time: '20:05',
    symptoms: ['Other'],
    title: 'Head shaking',
    notes: 'Started in the evening',
    severity: 'Mild',
  },
  {
    id: 'sym-4',
    petId: 'bantay',
    date: '2026-11-03',
    time: '17:30',
    symptoms: ['Limping'],
    title: 'Limping, licking hind leg',
    notes: 'Booked a vet visit',
    severity: 'Moderate',
  },
]

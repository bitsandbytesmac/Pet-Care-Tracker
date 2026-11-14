import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// Better Auth tables (field names must match Better Auth's core schema).
// ---------------------------------------------------------------------------

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('session_user_id_idx').on(t.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('account_user_id_idx').on(t.userId)],
)

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Login rate limiting. Kept in the database so it works across serverless instances. */
export const rateLimit = pgTable('rate_limit', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
})

// ---------------------------------------------------------------------------
// App tables. Every row belongs to a user (user_id) and all queries filter on it.
// ---------------------------------------------------------------------------

const ownerId = () =>
  text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
const isoDate = (name: string) => date(name, { mode: 'string' })

export const pets = pgTable(
  'pets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: ownerId(),
    name: text('name').notNull(),
    species: text('species').notNull(),
    breed: text('breed').notNull().default(''),
    sex: text('sex').notNull(),
    color: text('color').notNull(),
    age: text('age').notNull().default(''),
    weight: text('weight').notNull().default(''),
    neutered: boolean('neutered').notNull().default(false),
    clinic: text('clinic').notNull().default(''),
    lastVaccine: text('last_vaccine').notNull().default(''),
    food: text('food').notNull().default(''),
    allergies: text('allergies').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [index('pets_user_id_idx').on(t.userId)],
)

export const weightRecords = pgTable(
  'weight_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    petId: uuid('pet_id')
      .notNull()
      .references(() => pets.id, { onDelete: 'cascade' }),
    date: isoDate('date').notNull(),
    kg: numeric('kg', { precision: 6, scale: 2, mode: 'number' }).notNull(),
  },
  (t) => [index('weight_records_pet_id_idx').on(t.petId)],
)

export const medications = pgTable(
  'medications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: ownerId(),
    petId: uuid('pet_id')
      .notNull()
      .references(() => pets.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    dose: text('dose').notNull(),
    frequency: text('frequency').notNull(),
    reminderTimes: text('reminder_times').array().notNull().default(sql`'{}'::text[]`),
    status: text('status').notNull().default('active'),
    startDate: isoDate('start_date').notNull(),
    /** "course" | "supply" | "ongoing" */
    trackingKind: text('tracking_kind').notNull(),
    totalDays: integer('total_days'),
    supplyRemaining: integer('supply_remaining'),
    supplyTotal: integer('supply_total'),
    completedOn: isoDate('completed_on'),
    createdAt: createdAt(),
  },
  (t) => [index('medications_user_id_idx').on(t.userId)],
)

export const doses = pgTable(
  'doses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: ownerId(),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medications.id, { onDelete: 'cascade' }),
    date: isoDate('date').notNull(),
    time: text('time').notNull(),
    givenAt: timestamp('given_at', { withTimezone: true }),
  },
  (t) => [
    // Makes daily schedule generation idempotent under concurrent requests.
    uniqueIndex('doses_medication_date_time_uq').on(t.medicationId, t.date, t.time),
    index('doses_user_date_idx').on(t.userId, t.date),
  ],
)

export const visits = pgTable(
  'visits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: ownerId(),
    petId: uuid('pet_id')
      .notNull()
      .references(() => pets.id, { onDelete: 'cascade' }),
    date: isoDate('date').notNull(),
    time: text('time').notNull(),
    title: text('title').notNull(),
    clinic: text('clinic').notNull().default(''),
    summary: text('summary').notNull().default(''),
    notes: text('notes').notNull().default(''),
    weightLogged: boolean('weight_logged').notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index('visits_user_id_idx').on(t.userId)],
)

export const visitPrescriptions = pgTable(
  'visit_prescriptions',
  {
    visitId: uuid('visit_id')
      .notNull()
      .references(() => visits.id, { onDelete: 'cascade' }),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medications.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.visitId, t.medicationId] })],
)

export const symptoms = pgTable(
  'symptoms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: ownerId(),
    petId: uuid('pet_id')
      .notNull()
      .references(() => pets.id, { onDelete: 'cascade' }),
    date: isoDate('date').notNull(),
    time: text('time').notNull(),
    symptoms: text('symptoms').array().notNull(),
    title: text('title').notNull(),
    notes: text('notes').notNull().default(''),
    severity: text('severity').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('symptoms_user_id_idx').on(t.userId)],
)

/** Uploaded photos/receipts attached to a visit or a symptom entry. */
export const files = pgTable(
  'files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: ownerId(),
    /** "visit" | "symptom" */
    ownerType: text('owner_type').notNull(),
    ownerId: uuid('owner_id').notNull(),
    /** "photo" | "receipt" | "file" */
    kind: text('kind').notNull(),
    name: text('name').notNull(),
    contentType: text('content_type'),
    size: integer('size'),
    /** Key in the storage driver. Null for sample placeholders with no real file. */
    storageKey: text('storage_key'),
    createdAt: createdAt(),
  },
  (t) => [index('files_owner_idx').on(t.ownerType, t.ownerId)],
)

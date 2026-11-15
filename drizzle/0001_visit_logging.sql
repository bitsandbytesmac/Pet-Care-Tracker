ALTER TABLE "visits" ALTER COLUMN "time" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "type" text DEFAULT 'Other' NOT NULL;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "status" text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "treatment" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "reminder_days" integer;--> statement-breakpoint
CREATE INDEX "visits_pet_id_idx" ON "visits" USING btree ("pet_id");--> statement-breakpoint
-- Existing visits dated today or later were shown as upcoming; keep them that way.
UPDATE "visits" SET "status" = 'scheduled' WHERE "date" >= CURRENT_DATE;

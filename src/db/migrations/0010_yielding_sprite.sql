ALTER TABLE "user" ADD COLUMN "email_verification_link_last_sent_at" timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_verification_link_sent_count" integer;
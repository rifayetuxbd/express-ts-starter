ALTER TABLE "user" DROP CONSTRAINT "password_reset_code_unique";--> statement-breakpoint
ALTER TABLE "authorization" DROP CONSTRAINT "authorization_device_id_unique";--> statement-breakpoint
ALTER TABLE "authorization" DROP COLUMN IF EXISTS "device_id";--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_password_reset_code_unique" UNIQUE("password_reset_code");
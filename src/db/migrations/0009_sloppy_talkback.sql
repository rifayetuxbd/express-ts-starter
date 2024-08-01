ALTER TABLE "authorization" DROP CONSTRAINT "authorization_verification_code_unique";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "verification_code" varchar(6);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_verification_token" varchar(256);--> statement-breakpoint
ALTER TABLE "authorization" DROP COLUMN IF EXISTS "verification_code";--> statement-breakpoint
ALTER TABLE "authorization" DROP COLUMN IF EXISTS "email_verification_token";--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_verification_code_unique" UNIQUE("verification_code");
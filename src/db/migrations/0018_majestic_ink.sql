ALTER TABLE "user" ALTER COLUMN "email_verification_token" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "password_reset_token" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "authorization" ALTER COLUMN "refresh_token" SET DATA TYPE varchar(500);
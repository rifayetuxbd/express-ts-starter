ALTER TABLE "authorization" RENAME COLUMN "expires_in" TO "refresh_token_expires_in";--> statement-breakpoint
ALTER TABLE "authorization" RENAME COLUMN "verification_token" TO "email_verification_token";
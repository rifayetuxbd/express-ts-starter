ALTER TABLE "authorization" ADD COLUMN "verification_code" varchar(6);--> statement-breakpoint
ALTER TABLE "authorization" ADD COLUMN "verification_token" varchar(256);
ALTER TABLE "user" ADD COLUMN "password_reset_token" varchar(256);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "password_reset_code" varchar(20);
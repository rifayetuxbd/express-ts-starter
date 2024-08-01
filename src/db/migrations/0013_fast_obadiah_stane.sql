DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('user', 'clerk', 'manager', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "user_role" "role" DEFAULT 'user' NOT NULL;
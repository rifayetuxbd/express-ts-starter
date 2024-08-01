CREATE TABLE IF NOT EXISTS "category" (
	"category_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_name" varchar(50),
	"category_details" varchar(256),
	"created_by" uuid,
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"updated_at" timestamp (6) with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_address_id_address_address_id_fk";
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_authorization_id_authorization_authorization_id_fk";
--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "authorization" ADD COLUMN "user_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category" ADD CONSTRAINT "category_created_by_user_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("user_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "address" ADD CONSTRAINT "address_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "authorization" ADD CONSTRAINT "authorization_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "address_id";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "authorization_id";
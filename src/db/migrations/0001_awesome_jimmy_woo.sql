CREATE TABLE IF NOT EXISTS "users" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(50),
	"last_name" varchar(256) NOT NULL,
	"display_name" varchar(50),
	"phone" varchar(15),
	"password" varchar(256) NOT NULL,
	"profile_photo_url" varchar(256),
	"address_id" uuid NOT NULL,
	"authorization_id" uuid,
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"updated_at" timestamp (6) with time zone DEFAULT now(),
	CONSTRAINT "users_last_name_unique" UNIQUE("last_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "address" (
	"address_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city" varchar(50) NOT NULL,
	"zip_code" varchar(20) NOT NULL,
	"country" varchar(50) NOT NULL,
	"address_line1" varchar(256) NOT NULL,
	"address_line2" varchar(256),
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authorization" (
	"authorization_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar(256) NOT NULL,
	"refresh_token" varchar(256) NOT NULL,
	"expires_in" timestamp (6) with time zone NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authorization_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
DROP TABLE "posts_table";--> statement-breakpoint
DROP TABLE "users_table";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_address_id_address_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."address"("address_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_authorization_id_authorization_authorization_id_fk" FOREIGN KEY ("authorization_id") REFERENCES "public"."authorization"("authorization_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

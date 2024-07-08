ALTER TABLE "users" DROP CONSTRAINT "users_last_name_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
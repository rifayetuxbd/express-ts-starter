ALTER TABLE "category" DROP CONSTRAINT "category_created_by_user_user_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category" ADD CONSTRAINT "category_created_by_user_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

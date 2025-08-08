import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('ADMIN', 'WORKER');
  ALTER TABLE "users" ADD COLUMN "full_name" varchar NOT NULL;
  ALTER TABLE "users" ADD COLUMN "phone" varchar NOT NULL;
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'WORKER' NOT NULL;
  ALTER TABLE "users" ADD COLUMN "profile_picture_id" integer;
  ALTER TABLE "users" ADD CONSTRAINT "users_profile_picture_id_media_id_fk" FOREIGN KEY ("profile_picture_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_profile_picture_idx" ON "users" USING btree ("profile_picture_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP CONSTRAINT "users_profile_picture_id_media_id_fk";
  
  DROP INDEX "users_profile_picture_idx";
  ALTER TABLE "users" DROP COLUMN "full_name";
  ALTER TABLE "users" DROP COLUMN "phone";
  ALTER TABLE "users" DROP COLUMN "role";
  ALTER TABLE "users" DROP COLUMN "profile_picture_id";
  DROP TYPE "public"."enum_users_role";`)
}

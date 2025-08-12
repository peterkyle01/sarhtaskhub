import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_activity_logs_type" AS ENUM('task_created', 'task_updated', 'task_assigned', 'task_completed', 'client_onboarded', 'worker_added', 'worker_edited');
  CREATE TABLE "activity_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_activity_logs_type" NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"actor_id" integer,
  	"task_id" integer,
  	"client_id" integer,
  	"worker_id" integer,
  	"metadata" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "activity_logs_id" integer;
  ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "activity_logs_actor_idx" ON "activity_logs" USING btree ("actor_id");
  CREATE INDEX "activity_logs_task_idx" ON "activity_logs" USING btree ("task_id");
  CREATE INDEX "activity_logs_client_idx" ON "activity_logs" USING btree ("client_id");
  CREATE INDEX "activity_logs_worker_idx" ON "activity_logs" USING btree ("worker_id");
  CREATE INDEX "activity_logs_updated_at_idx" ON "activity_logs" USING btree ("updated_at");
  CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_activity_logs_fk" FOREIGN KEY ("activity_logs_id") REFERENCES "public"."activity_logs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_activity_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("activity_logs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "activity_logs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "activity_logs" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_activity_logs_fk";
  
  DROP INDEX "payload_locked_documents_rels_activity_logs_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "activity_logs_id";
  DROP TYPE "public"."enum_activity_logs_type";`)
}

import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_clients_platform" AS ENUM('Cengage', 'ALEKS');
  CREATE TYPE "public"."enum_clients_progress" AS ENUM('Not Started', 'In Progress', 'Completed', 'Overdue');
  CREATE TYPE "public"."enum_tasks_platform" AS ENUM('Cengage', 'ALEKS', 'MATLAB');
  CREATE TYPE "public"."enum_tasks_task_type" AS ENUM('Assignment', 'Quiz', 'Course');
  CREATE TYPE "public"."enum_tasks_status" AS ENUM('Pending', 'In Progress', 'Completed');
  ALTER TYPE "public"."enum_users_role" ADD VALUE 'CLIENT';
  CREATE TABLE "clients" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"client_id" varchar,
  	"name" varchar NOT NULL,
  	"platform" "enum_clients_platform" NOT NULL,
  	"course_name" varchar NOT NULL,
  	"deadline" timestamp(3) with time zone NOT NULL,
  	"progress" "enum_clients_progress" DEFAULT 'Not Started' NOT NULL,
  	"assigned_worker_id" integer,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "workers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"worker_id" varchar,
  	"performance_overall_score" numeric DEFAULT 0,
  	"performance_tasks_completed" numeric DEFAULT 0,
  	"performance_average_completion_time" numeric DEFAULT 0,
  	"performance_last_evaluation" timestamp(3) with time zone,
  	"performance_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "workers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"clients_id" integer
  );
  
  CREATE TABLE "tasks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"task_id" varchar,
  	"client_id" integer NOT NULL,
  	"platform" "enum_tasks_platform" NOT NULL,
  	"task_type" "enum_tasks_task_type" NOT NULL,
  	"due_date" timestamp(3) with time zone NOT NULL,
  	"status" "enum_tasks_status" DEFAULT 'Pending' NOT NULL,
  	"worker_id" integer,
  	"score" numeric,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "worker_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "clients_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "workers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tasks_id" integer;
  ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clients" ADD CONSTRAINT "clients_assigned_worker_id_users_id_fk" FOREIGN KEY ("assigned_worker_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workers" ADD CONSTRAINT "workers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workers_rels" ADD CONSTRAINT "workers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workers_rels" ADD CONSTRAINT "workers_rels_clients_fk" FOREIGN KEY ("clients_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "clients_user_idx" ON "clients" USING btree ("user_id");
  CREATE UNIQUE INDEX "clients_client_id_idx" ON "clients" USING btree ("client_id");
  CREATE INDEX "clients_assigned_worker_idx" ON "clients" USING btree ("assigned_worker_id");
  CREATE INDEX "clients_updated_at_idx" ON "clients" USING btree ("updated_at");
  CREATE INDEX "clients_created_at_idx" ON "clients" USING btree ("created_at");
  CREATE UNIQUE INDEX "workers_user_idx" ON "workers" USING btree ("user_id");
  CREATE UNIQUE INDEX "workers_worker_id_idx" ON "workers" USING btree ("worker_id");
  CREATE INDEX "workers_updated_at_idx" ON "workers" USING btree ("updated_at");
  CREATE INDEX "workers_created_at_idx" ON "workers" USING btree ("created_at");
  CREATE INDEX "workers_rels_order_idx" ON "workers_rels" USING btree ("order");
  CREATE INDEX "workers_rels_parent_idx" ON "workers_rels" USING btree ("parent_id");
  CREATE INDEX "workers_rels_path_idx" ON "workers_rels" USING btree ("path");
  CREATE INDEX "workers_rels_clients_id_idx" ON "workers_rels" USING btree ("clients_id");
  CREATE UNIQUE INDEX "tasks_task_id_idx" ON "tasks" USING btree ("task_id");
  CREATE INDEX "tasks_client_idx" ON "tasks" USING btree ("client_id");
  CREATE INDEX "tasks_worker_idx" ON "tasks" USING btree ("worker_id");
  CREATE INDEX "tasks_updated_at_idx" ON "tasks" USING btree ("updated_at");
  CREATE INDEX "tasks_created_at_idx" ON "tasks" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clients_fk" FOREIGN KEY ("clients_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workers_fk" FOREIGN KEY ("workers_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tasks_fk" FOREIGN KEY ("tasks_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "users_worker_id_idx" ON "users" USING btree ("worker_id");
  CREATE INDEX "payload_locked_documents_rels_clients_id_idx" ON "payload_locked_documents_rels" USING btree ("clients_id");
  CREATE INDEX "payload_locked_documents_rels_workers_id_idx" ON "payload_locked_documents_rels" USING btree ("workers_id");
  CREATE INDEX "payload_locked_documents_rels_tasks_id_idx" ON "payload_locked_documents_rels" USING btree ("tasks_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "clients" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "workers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "workers_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tasks" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "clients" CASCADE;
  DROP TABLE "workers" CASCADE;
  DROP TABLE "workers_rels" CASCADE;
  DROP TABLE "tasks" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_clients_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_workers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tasks_fk";
  
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'WORKER'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('ADMIN', 'WORKER');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'WORKER'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  DROP INDEX "users_worker_id_idx";
  DROP INDEX "payload_locked_documents_rels_clients_id_idx";
  DROP INDEX "payload_locked_documents_rels_workers_id_idx";
  DROP INDEX "payload_locked_documents_rels_tasks_id_idx";
  ALTER TABLE "users" DROP COLUMN "worker_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "clients_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "workers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tasks_id";
  DROP TYPE "public"."enum_clients_platform";
  DROP TYPE "public"."enum_clients_progress";
  DROP TYPE "public"."enum_tasks_platform";
  DROP TYPE "public"."enum_tasks_task_type";
  DROP TYPE "public"."enum_tasks_status";`)
}

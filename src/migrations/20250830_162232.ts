import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "tasks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topics_id" integer
  );
  
  ALTER TABLE "tasks" DROP CONSTRAINT "tasks_topic_id_topics_id_fk";
  
  DROP INDEX "tasks_topic_idx";
  ALTER TABLE "tasks_rels" ADD CONSTRAINT "tasks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tasks_rels" ADD CONSTRAINT "tasks_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tasks_rels_order_idx" ON "tasks_rels" USING btree ("order");
  CREATE INDEX "tasks_rels_parent_idx" ON "tasks_rels" USING btree ("parent_id");
  CREATE INDEX "tasks_rels_path_idx" ON "tasks_rels" USING btree ("path");
  CREATE INDEX "tasks_rels_topics_id_idx" ON "tasks_rels" USING btree ("topics_id");
  ALTER TABLE "tasks" DROP COLUMN "topic_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tasks_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tasks_rels" CASCADE;
  ALTER TABLE "tasks" ADD COLUMN "topic_id" integer NOT NULL;
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "tasks_topic_idx" ON "tasks" USING btree ("topic_id");`)
}

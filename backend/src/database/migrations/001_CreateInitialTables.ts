import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1234567890 implements MigrationInterface {
  name = 'CreateInitialTables1234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "name" character varying NOT NULL,
        "avatar_url" character varying,
        "status" character varying DEFAULT 'offline',
        "last_seen" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    // Create conversations table
    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" SERIAL NOT NULL,
        "name" character varying,
        "type" character varying NOT NULL DEFAULT 'direct',
        "created_by_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "is_archived" boolean DEFAULT false,
        "is_muted" boolean DEFAULT false,
        "is_pinned" boolean DEFAULT false,
        "last_message_at" TIMESTAMP,
        CONSTRAINT "PK_conversations_id" PRIMARY KEY ("id")
      )
    `);

    // Create messages table
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" SERIAL NOT NULL,
        "content" text NOT NULL,
        "sender_id" integer NOT NULL,
        "conversation_id" integer NOT NULL,
        "parent_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "is_edited" boolean DEFAULT false,
        "is_deleted" boolean DEFAULT false,
        "channel_type" character varying NOT NULL DEFAULT 'internal',
        "metadata" jsonb,
        CONSTRAINT "PK_messages_id" PRIMARY KEY ("id")
      )
    `);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "conversations" 
      ADD CONSTRAINT "FK_conversations_created_by_id" 
      FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      ADD CONSTRAINT "FK_messages_sender_id" 
      FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      ADD CONSTRAINT "FK_messages_conversation_id" 
      FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      ADD CONSTRAINT "FK_messages_parent_id" 
      FOREIGN KEY ("parent_id") REFERENCES "messages"("id") ON DELETE CASCADE
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_messages_conversation_id" ON "messages" ("conversation_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_sender_id" ON "messages" ("sender_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_created_at" ON "messages" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema0001 implements MigrationInterface {
  name = "InitialSchema0001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enums
    await queryRunner.query(`CREATE TYPE "user_gender_enum" AS ENUM ('male', 'female', 'other')`);
    await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM ('buyer', 'seller', 'moderator', 'admin')`);
    await queryRunner.query(`CREATE TYPE "user_status_enum" AS ENUM ('active', 'inactive', 'banned', 'suspended')`);
    await queryRunner.query(`CREATE TYPE "item_status_enum" AS ENUM ('active', 'suspended', 'hidden', 'pending', 'banned')`);
    await queryRunner.query(`CREATE TYPE "item_type_enum" AS ENUM ('product', 'service')`);
    await queryRunner.query(`CREATE TYPE "report_type_enum" AS ENUM ('spam', 'inappropriate', 'illegal', 'other')`);

    // users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "user_id" SERIAL PRIMARY KEY,
        "national_id" VARCHAR(20) UNIQUE NOT NULL,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "email" VARCHAR(150) UNIQUE NOT NULL,
        "phone" VARCHAR(20),
        "address" TEXT,
        "gender" "user_gender_enum",
        "role" "user_role_enum" NOT NULL DEFAULT 'buyer',
        "status" "user_status_enum" NOT NULL DEFAULT 'active',
        "suspended_until" TIMESTAMP,
        "deleted" BOOLEAN NOT NULL DEFAULT false,
        "password_hash" TEXT NOT NULL,
        "verified" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // items
    await queryRunner.query(`
      CREATE TABLE "items" (
        "item_id" SERIAL PRIMARY KEY,
        "code" VARCHAR(50) UNIQUE NOT NULL,
        "seller_id" INT NOT NULL,
        "type" "item_type_enum" NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "category" VARCHAR(100),
        "price" NUMERIC(12,2),
        "location" VARCHAR(150),
        "availability" BOOLEAN NOT NULL DEFAULT true,
        "status" "item_status_enum" NOT NULL DEFAULT 'active',
        "published_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_items_seller" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id") ON DELETE CASCADE
      );
    `);

    // item_photos
    await queryRunner.query(`
      CREATE TABLE "item_photos" (
        "photo_id" SERIAL PRIMARY KEY,
        "item_id" INT NOT NULL,
        "url" TEXT NOT NULL,
        CONSTRAINT "fk_photos_item" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE CASCADE
      );
    `);

    // services
    await queryRunner.query(`
      CREATE TABLE "services" (
        "service_id" SERIAL PRIMARY KEY,
        "item_id" INT UNIQUE NOT NULL,
        "working_hours" TEXT NOT NULL,
        CONSTRAINT "fk_services_item" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE CASCADE
      );
    `);

    // favorites (composite PK)
    await queryRunner.query(`
      CREATE TABLE "favorites" (
        "user_id" INT NOT NULL,
        "item_id" INT NOT NULL,
        "saved_at" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("user_id", "item_id"),
        CONSTRAINT "fk_favorites_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE,
        CONSTRAINT "fk_favorites_item" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE CASCADE
      );
    `);

    // reports
    await queryRunner.query(`
      CREATE TABLE "reports" (
        "report_id" SERIAL PRIMARY KEY,
        "item_id" INT NOT NULL,
        "buyer_id" INT NOT NULL,
        "type" "report_type_enum" NOT NULL,
        "comment" TEXT,
        "reported_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_reports_item" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE CASCADE,
        CONSTRAINT "fk_reports_buyer" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE CASCADE
      );
    `);

    // incidents
    await queryRunner.query(`
      CREATE TABLE "incidents" (
        "incident_id" SERIAL PRIMARY KEY,
        "item_id" INT NOT NULL,
        "reported_at" TIMESTAMP NOT NULL DEFAULT now(),
        "status" "item_status_enum" NOT NULL,
        "description" TEXT,
        "moderator_id" INT,
        "seller_id" INT,
        CONSTRAINT "fk_incidents_item" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE CASCADE,
        CONSTRAINT "fk_incidents_moderator" FOREIGN KEY ("moderator_id") REFERENCES "users"("user_id"),
        CONSTRAINT "fk_incidents_seller" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id")
      );
    `);

    // appeals
    await queryRunner.query(`
      CREATE TABLE "appeals" (
        "appeal_id" SERIAL PRIMARY KEY,
        "incident_id" INT NOT NULL,
        "seller_id" INT NOT NULL,
        "reason" TEXT NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "reviewed" BOOLEAN NOT NULL DEFAULT false,
        CONSTRAINT "fk_appeals_incident" FOREIGN KEY ("incident_id") REFERENCES "incidents"("incident_id") ON DELETE CASCADE,
        CONSTRAINT "fk_appeals_seller" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id") ON DELETE CASCADE
      );
    `);

    // chats
    await queryRunner.query(`
      CREATE TABLE "chats" (
        "chat_id" SERIAL PRIMARY KEY,
        "buyer_id" INT NOT NULL,
        "seller_id" INT NOT NULL,
        "started_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_chats_buyer" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE CASCADE,
        CONSTRAINT "fk_chats_seller" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id") ON DELETE CASCADE
      );
    `);

    // messages
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "message_id" SERIAL PRIMARY KEY,
        "chat_id" INT NOT NULL,
        "sender_id" INT NOT NULL,
        "content" TEXT NOT NULL,
        "sent_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_messages_chat" FOREIGN KEY ("chat_id") REFERENCES "chats"("chat_id") ON DELETE CASCADE,
        CONSTRAINT "fk_messages_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE CASCADE
      );
    `);

    // ratings
    await queryRunner.query(`
      CREATE TABLE "ratings" (
        "rating_id" SERIAL PRIMARY KEY,
        "seller_id" INT NOT NULL,
        "buyer_id" INT NOT NULL,
        "score" INT NOT NULL,
        "comment" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_ratings_seller" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id") ON DELETE CASCADE,
        CONSTRAINT "fk_ratings_buyer" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE CASCADE
      );
    `);

    // Helpful indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_items_seller" ON "items"("seller_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_incidents_item" ON "incidents"("item_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_favorites_user" ON "favorites"("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_messages_chat" ON "messages"("chat_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_messages_chat"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_favorites_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_incidents_item"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_items_seller"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "ratings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chats"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appeals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "incidents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "favorites"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "item_photos"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "report_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "item_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "item_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_gender_enum"`);
  }
}

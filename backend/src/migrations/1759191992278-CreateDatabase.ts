import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDatabase1759191992278 implements MigrationInterface {
  name = "CreateDatabase1759191992278";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "item_photos" ("photo_id" SERIAL NOT NULL, "item_id" integer NOT NULL, "url" text NOT NULL, CONSTRAINT "PK_c0d06bea847a8cfde5130df9189" PRIMARY KEY ("photo_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "services" ("service_id" SERIAL NOT NULL, "item_id" integer NOT NULL, "working_hours" text NOT NULL, CONSTRAINT "UQ_192cb6d659136046ced7f54ac8b" UNIQUE ("item_id"), CONSTRAINT "REL_192cb6d659136046ced7f54ac8" UNIQUE ("item_id"), CONSTRAINT "PK_ef0531b9789b488593690ab8d5d" PRIMARY KEY ("service_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "favorites" ("user_id" integer NOT NULL, "item_id" integer NOT NULL, "saved_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c1d5564ca16032bdf87efbeffcc" PRIMARY KEY ("user_id", "item_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reports_type_enum" AS ENUM('spam', 'inappropriate', 'illegal', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "reports" ("report_id" SERIAL NOT NULL, "item_id" integer NOT NULL, "buyer_id" integer NOT NULL, "type" "public"."reports_type_enum" NOT NULL, "comment" text, "reported_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e5cb9f2cacc967a3de2f6635323" PRIMARY KEY ("report_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "appeals" ("appeal_id" SERIAL NOT NULL, "incident_id" integer NOT NULL, "seller_id" integer NOT NULL, "reason" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "reviewed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_321a5ce4877cceb21240231ddf7" PRIMARY KEY ("appeal_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."incidents_status_enum" AS ENUM('active', 'suspended', 'hidden', 'pending', 'banned')`,
    );
    await queryRunner.query(
      `CREATE TABLE "incidents" ("incident_id" SERIAL NOT NULL, "item_id" integer NOT NULL, "reported_at" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."incidents_status_enum" NOT NULL, "description" text, "moderator_id" integer, "seller_id" integer, CONSTRAINT "PK_ff3b5892a4fc0c8fcc55ae936c2" PRIMARY KEY ("incident_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."items_type_enum" AS ENUM('product', 'service')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."items_status_enum" AS ENUM('active', 'suspended', 'hidden', 'pending', 'banned')`,
    );
    await queryRunner.query(
      `CREATE TABLE "items" ("item_id" SERIAL NOT NULL, "code" character varying(50) NOT NULL, "seller_id" integer NOT NULL, "type" "public"."items_type_enum" NOT NULL, "name" character varying(200) NOT NULL, "description" text, "price" numeric(12,2), "location" character varying(150), "availability" boolean NOT NULL DEFAULT true, "status" "public"."items_status_enum" NOT NULL DEFAULT 'active', "published_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1b0a705ce0dc5430c020a0ec31f" UNIQUE ("code"), CONSTRAINT "PK_d0249fbc104e3bd71b5a0ecf3b1" PRIMARY KEY ("item_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("message_id" SERIAL NOT NULL, "chat_id" integer NOT NULL, "sender_id" integer NOT NULL, "content" text NOT NULL, "sent_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6187089f850b8deeca0232cfeba" PRIMARY KEY ("message_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chats" ("chat_id" SERIAL NOT NULL, "buyer_id" integer NOT NULL, "seller_id" integer NOT NULL, "started_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cb573d310bde330521e7715db2a" PRIMARY KEY ("chat_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ratings" ("rating_id" SERIAL NOT NULL, "seller_id" integer NOT NULL, "buyer_id" integer NOT NULL, "score" integer NOT NULL, "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dc4f636dd0dd5a75e84115a606f" PRIMARY KEY ("rating_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_gender_enum" AS ENUM('male', 'female', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('buyer', 'seller', 'moderator', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("user_id" SERIAL NOT NULL, "national_id" character varying(20) NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "email" character varying(150) NOT NULL, "phone" character varying(20), "address" text, "gender" "public"."users_gender_enum", "role" "public"."users_role_enum" NOT NULL DEFAULT 'buyer', "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', "password_hash" text NOT NULL, "verified" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_232b9597ff9a89b2c2fc5d1b5e5" UNIQUE ("national_id"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("user_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_photos" ADD CONSTRAINT "FK_230c81b221e78373a2fcf20753f" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_192cb6d659136046ced7f54ac8b" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD CONSTRAINT "FK_8736d7a1e75cc1265c710fd97ff" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" ADD CONSTRAINT "FK_0bdd388214173a80166584c2d0f" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" ADD CONSTRAINT "FK_9b091a7f7d4af6b53ea17e1cd54" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appeals" ADD CONSTRAINT "FK_2ecce1c446ccfe5cde6f78ec91e" FOREIGN KEY ("incident_id") REFERENCES "incidents"("incident_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appeals" ADD CONSTRAINT "FK_bd438a4f31531de6e7c669b47b4" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" ADD CONSTRAINT "FK_a9cf1ae111ab7a571c3dbb6dfdb" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" ADD CONSTRAINT "FK_daec768dfbaf7ea630262abe7fb" FOREIGN KEY ("moderator_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" ADD CONSTRAINT "FK_ff33274f4da6631217925edbeb8" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "items" ADD CONSTRAINT "FK_20719f5611327abb661f3cccb9a" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_7540635fef1922f0b156b9ef74f" FOREIGN KEY ("chat_id") REFERENCES "chats"("chat_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_a956bacea253f921eab7bb3b14e" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_f754443807ae962605b6158bf03" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD CONSTRAINT "FK_41675043c3cf0c8512dba470b86" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD CONSTRAINT "FK_2e483ed4089e1e05f124ac1710b" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ratings" DROP CONSTRAINT "FK_2e483ed4089e1e05f124ac1710b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" DROP CONSTRAINT "FK_41675043c3cf0c8512dba470b86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_f754443807ae962605b6158bf03"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_a956bacea253f921eab7bb3b14e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_7540635fef1922f0b156b9ef74f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "items" DROP CONSTRAINT "FK_20719f5611327abb661f3cccb9a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" DROP CONSTRAINT "FK_ff33274f4da6631217925edbeb8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" DROP CONSTRAINT "FK_daec768dfbaf7ea630262abe7fb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incidents" DROP CONSTRAINT "FK_a9cf1ae111ab7a571c3dbb6dfdb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appeals" DROP CONSTRAINT "FK_bd438a4f31531de6e7c669b47b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appeals" DROP CONSTRAINT "FK_2ecce1c446ccfe5cde6f78ec91e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_9b091a7f7d4af6b53ea17e1cd54"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_0bdd388214173a80166584c2d0f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP CONSTRAINT "FK_8736d7a1e75cc1265c710fd97ff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_192cb6d659136046ced7f54ac8b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_photos" DROP CONSTRAINT "FK_230c81b221e78373a2fcf20753f"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
    await queryRunner.query(`DROP TABLE "ratings"`);
    await queryRunner.query(`DROP TABLE "chats"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "items"`);
    await queryRunner.query(`DROP TYPE "public"."items_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."items_type_enum"`);
    await queryRunner.query(`DROP TABLE "incidents"`);
    await queryRunner.query(`DROP TYPE "public"."incidents_status_enum"`);
    await queryRunner.query(`DROP TABLE "appeals"`);
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TYPE "public"."reports_type_enum"`);
    await queryRunner.query(`DROP TABLE "favorites"`);
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TABLE "item_photos"`);
  }
}

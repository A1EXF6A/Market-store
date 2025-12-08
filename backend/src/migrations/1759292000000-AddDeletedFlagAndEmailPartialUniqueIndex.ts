import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedFlagAndEmailPartialUniqueIndex1759292000000 implements MigrationInterface {
  name = "AddDeletedFlagAndEmailPartialUniqueIndex1759292000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // add deleted column
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted" boolean NOT NULL DEFAULT false`);

    // drop existing unique constraint on email if exists
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_97672ac88f789774dd47f7c8be3"`);

    // create unique partial index for non-deleted users
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_email_unique_active" ON "users" ("email") WHERE (deleted = false)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // drop partial unique index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email_unique_active"`);

    // restore old unique constraint on email
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);

    // drop deleted column
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "deleted"`);
  }
}

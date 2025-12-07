import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuspendedUntilToUsers1733530000000 implements MigrationInterface {
  name = "AddSuspendedUntilToUsers1733530000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add column if it does not exist
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspended_until" TIMESTAMP NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "suspended_until"`);
  }
}

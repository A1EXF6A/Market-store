import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserSuspendedUntil1759290000000 implements MigrationInterface {
  name = "AddUserSuspendedUntil1759290000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "suspended_until" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "suspended_until"`);
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuspendedUntilToUsers1759191992280 implements MigrationInterface {
  name = "AddSuspendedUntilToUsers1759191992280";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "suspended_until" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "suspended_until"`,
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserSuspendedUntil1759290000000 implements MigrationInterface {
  name = "AddUserSuspendedUntil1759290000000";

  public async up(queryRunner: QueryRunner): Promise<void> {}

  public async down(queryRunner: QueryRunner): Promise<void> {}
}

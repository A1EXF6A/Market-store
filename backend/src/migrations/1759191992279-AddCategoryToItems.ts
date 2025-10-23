import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryToItems1759191992279 implements MigrationInterface {
  name = "AddCategoryToItems1759191992279";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "items" ADD "category" character varying(100)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "items" DROP COLUMN "category"`
    );
  }
}
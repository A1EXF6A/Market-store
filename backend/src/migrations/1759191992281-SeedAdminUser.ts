import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from 'bcryptjs';

export class SeedAdminUser1759191992281 implements MigrationInterface {
  name = "SeedAdminUser1759191992281";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Hash de la contraseña "admin123"
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await queryRunner.query(`
      INSERT INTO "users" 
      ("national_id", "first_name", "last_name", "email", "role", "status", "password_hash", "verified") 
      VALUES 
      ('ADMIN001', 'Admin', 'User', 'admin@sistema.com', 'admin', 'active', '${passwordHash}', true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "users" WHERE "email" = 'admin@sistema.com'
    `);
  }
}
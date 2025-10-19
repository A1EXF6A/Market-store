import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { DataSource } from 'typeorm';
import AppDataSource from '../../src/data-source';
import { execSync } from 'child_process';

let app: INestApplication;
let container: StartedTestContainer;
let dataSource: DataSource;

describe('AuthController (e2e)', () => {
  beforeAll(async () => {
    // 🐳 Levantar contenedor temporal de Postgres
    new GenericContainer('postgres:14')
      .withEnvironment({
  POSTGRES_USER: 'test',
  POSTGRES_PASSWORD: 'test',
  POSTGRES_DB: 'testdb',
})
.start();

    const host = container.getHost();
    const port = container.getMappedPort(5432);
    process.env.DATABASE_URL = `postgresql://test:test@${host}:${port}/testdb`;

    // 👷 Reconfigurar DataSource dinámicamente
    (AppDataSource as any).options = {
      ...AppDataSource.options,
      host,
      port,
      username: 'test',
      password: 'test',
      database: 'testdb'
    };

    // 🚀 Ejecutar migraciones
    execSync('npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts', { stdio: 'inherit' });

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = AppDataSource;
    await dataSource.initialize();
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
    await dataSource.destroy();
  });

  it('/auth/register (POST) debe registrar un usuario', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'e2e@example.com',
        nationalId: '11223344',
        password: '12345678',
        firstName: 'E2E',
        lastName: 'Test'
      })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    expect(res.body.user.email).toBe('e2e@example.com');
  });

  it('/auth/login (POST) debe loguear un usuario existente', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'e2e@example.com',
        password: '12345678'
      })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
  });
});

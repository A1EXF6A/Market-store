import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// AppModule will be imported dynamically after we configure the test DB
// supertest exports a function; use require to ensure compatibility with Jest/ts-jest transpilation
const request = require('supertest');
import { GenericContainer, StartedTestContainer } from 'testcontainers';
// import { DataSource } from 'typeorm';
import AppDataSource from '../../src/data-source';
import { execSync } from 'child_process';

let app: INestApplication;
let container: StartedTestContainer;
// let dataSource: DataSource;

describe('AuthController (e2e)', () => {
  beforeAll(async () => {
    // 🐳 Levantar contenedor temporal de Postgres
    container = await new GenericContainer('postgres:14')
      .withEnvironment({
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
        POSTGRES_DB: 'testdb',
      })
      .withExposedPorts(5432)
      .start();

    const host = container.getHost();
    const port = container.getMappedPort(5432);
    process.env.DATABASE_URL = `postgresql://test:test@${host}:${port}/testdb`;

    // 👷 Reconfigurar DataSource dinámicamente
    // Set environment variables used by src/config/env.ts and migrations
    process.env.DB_HOST = host;
    process.env.DB_PORT = String(port);
    process.env.DB_USER = 'test';
  process.env.DB_USERNAME = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.DB_NAME = 'testdb';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

    // También actualizamos AppDataSource.options para que TypeOrmModule use estas credenciales
    (AppDataSource as any).options = {
      ...AppDataSource.options,
      host,
      port,
      username: 'test',
      password: 'test',
      database: 'testdb',
    };

      // 🚀 Ejecutar migraciones (pasamos las variables de entorno explícitamente para la sub-proceso)
      execSync('npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts', {
        stdio: 'inherit',
        env: {
          ...process.env,
          DB_HOST: host,
          DB_PORT: String(port),
          DB_USER: 'test',
          DB_USERNAME: 'test',
          DB_PASSWORD: 'test',
          DB_NAME: 'testdb',
        },
      });

    const { AppModule } = await import('../../src/app.module');
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // dataSource = AppDataSource;
    // await dataSource.initialize();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (container) await container.stop();
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

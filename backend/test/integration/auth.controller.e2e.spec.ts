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
let container: StartedTestContainer | undefined;
let dbHost: string;
let dbPort: number;
const dbUser = 'test';
const dbPassword = 'test';
const dbName = 'testdb';
// let dataSource: DataSource;

describe('AuthController (e2e)', () => {
  beforeAll(async () => {
    // 🐳 DB for tests: use CI-provided Postgres when CI_PG=1, else Testcontainers
    if (process.env.CI_PG === '1') {
      dbHost = process.env.POSTGRES_HOST || 'host.docker.internal';
      dbPort = Number(process.env.POSTGRES_PORT || 55432);
    } else {
      process.env.TESTCONTAINERS_RYUK_DISABLED ??= 'true';
      container = await new GenericContainer('postgres:14')
        .withEnvironment({
          POSTGRES_USER: dbUser,
          POSTGRES_PASSWORD: dbPassword,
          POSTGRES_DB: dbName,
        })
        .withExposedPorts(5432)
        .start();

      const hostOverride = process.env.TESTCONTAINERS_HOST_OVERRIDE;
      dbHost = hostOverride && hostOverride.length > 0 ? hostOverride : container.getHost();
      dbPort = container.getMappedPort(5432);
    }
    process.env.DATABASE_URL = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

    // 👷 Reconfigurar DataSource dinámicamente
    // Set environment variables used by src/config/env.ts and migrations
    process.env.DB_HOST = dbHost;
    process.env.DB_PORT = String(dbPort);
    process.env.DB_USER = dbUser;
    process.env.DB_USERNAME = dbUser;
    process.env.DB_PASSWORD = dbPassword;
    process.env.DB_NAME = dbName;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

    // También actualizamos AppDataSource.options para que TypeOrmModule use estas credenciales
    (AppDataSource as any).options = {
      ...AppDataSource.options,
      host: dbHost,
      port: dbPort,
      username: dbUser,
      password: dbPassword,
      database: dbName,
    };

      // 🚀 Ejecutar migraciones (pasamos las variables de entorno explícitamente para la sub-proceso)
      execSync('npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts', {
        stdio: 'inherit',
        env: {
          ...process.env,
          DB_HOST: dbHost,
          DB_PORT: String(dbPort),
          DB_USER: dbUser,
          DB_USERNAME: dbUser,
          DB_PASSWORD: dbPassword,
          DB_NAME: dbName,
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

  it('/auth/register + verify + login flujo completo', async () => {
    const unique = Date.now();
    const email = `e2e_${unique}@example.com`;
    const nationalId = String(10000000 + (unique % 10000000));

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        nationalId,
        password: '12345678',
        firstName: 'E2E',
        lastName: 'Test',
      })
      .expect(201);

    expect(registerRes.body).toHaveProperty('message');

    // Marcar usuario como verificado en la base de datos para permitir login
    const { DataSource } = await import('typeorm');
    const dataSource = app.get<any>(DataSource);
    await dataSource.manager.query('UPDATE users SET verified=$1 WHERE email=$2', [true, email]);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: '12345678',
      })
      .expect(201);

    expect(loginRes.body).toHaveProperty('access_token');
    expect(loginRes.body.user.email).toBe(email);
  });
});

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import AppDataSource from '../../src/data-source';
import { execSync } from 'child_process';

let app: INestApplication;
let container: StartedTestContainer;

describe('ProductsController (e2e)', () => {
  beforeAll(async () => {
    container = await new GenericContainer('postgres:14')
      .withEnvironment({ POSTGRES_USER: 'test', POSTGRES_PASSWORD: 'test', POSTGRES_DB: 'testdb' })
      .withExposedPorts(5432)
      .start();

    const host = container.getHost();
    const port = container.getMappedPort(5432);

    process.env.DB_HOST = host;
    process.env.DB_PORT = String(port);
    process.env.DB_USER = 'test';
    process.env.DB_USERNAME = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.DB_NAME = 'testdb';
  process.env.DATABASE_URL = `postgresql://test:test@${host}:${port}/testdb`;

    (AppDataSource as any).options = {
      ...AppDataSource.options,
      host,
      port,
      username: 'test',
      password: 'test',
      database: 'testdb',
    };

    execSync('npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts', {
      stdio: 'inherit',
      env: { ...process.env },
    });

    // we'll insert test data after the app is initialized using the same DataSource

  const { AppModule } = await import('../../src/app.module');
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    // Create a user via the auth endpoint to ensure all required fields are set
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'seller@example.com',
        nationalId: '9999',
        password: '12345678',
        firstName: 'Seller',
        lastName: 'One',
      })
      .expect(201);

    const { DataSource } = await import('typeorm');
    const dataSource = app.get<any>(DataSource);
    const manager = dataSource.manager;

    const sellers = await manager.query('SELECT * FROM users WHERE email=$1', ['seller@example.com']);
    const seller = sellers[0];

    // Insert items using raw SQL to match DB column names
    await manager.query(
      `INSERT INTO items(code, seller_id, type, name, description, price, location, availability, status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      ['C1', seller.user_id, 'product', 'Product A', 'Desc A', 50, 'CityX', true, 'active'],
    );

    await manager.query(
      `INSERT INTO items(code, seller_id, type, name, description, price, location, availability, status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      ['C2', seller.user_id, 'service', 'Service B', 'Desc B', 200, 'CityY', true, 'active'],
    );
  });

  afterAll(async () => {
    if (app) await app.close();
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
    if (container) await container.stop();
  });

  it('GET /products debe listar productos activos', async () => {
    const res = await request(app.getHttpServer()).get('/products').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /products/:id debe devolver detalle del producto', async () => {
    const list = await request(app.getHttpServer()).get('/products').expect(200);
    const id = list.body[0].itemId;
    const res = await request(app.getHttpServer()).get(`/products/${id}`).expect(200);
    expect(res.body).toHaveProperty('itemId');
  });
});

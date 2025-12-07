import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { TestContext, createTestApp, closeTestApp } from './test-db.util';

let app: INestApplication;
let ctx: TestContext;

describe('AuthController (e2e)', () => {
  beforeAll(async () => {
    ctx = await createTestApp(false); // aquí SÍ se usa JWT real
    app = ctx.app;
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('/auth/register (POST) registra usuario', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'e2e@example.com',
        nationalId: '11223344',
        password: '12345678',
        firstName: 'E2E',
        lastName: 'Test',
      })
      .expect(201);

    expect(res.body).toHaveProperty('email', 'e2e@example.com');
  });

  it('/auth/login (POST) loguea usuario existente', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'e2e@example.com',
        password: '12345678',
      })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
  });
});

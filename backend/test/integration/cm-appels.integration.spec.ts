// test/integration/cm-appeals.integration.spec.ts
require('dotenv').config({ path: '.env' });

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

describe('CM-US Appeals - Endpoints (sin apelaciones existentes)', () => {
  let app: INestApplication;
  let httpServer: any;
  let moderatorToken: string;

  const moderatorCredentials = {
    email: 'mod1@sistema.com',
    password: 'con1234',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    httpServer = app.getHttpServer();

    // Login moderador real
    const loginRes = await request(httpServer)
      .post('/auth/login')
      .send(moderatorCredentials);

    expect([200, 201]).toContain(loginRes.status);
    moderatorToken = loginRes.body.access_token;
    expect(moderatorToken).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /appeals - debería retornar 200 y un array vacío si no hay apelaciones', async () => {
    const res = await request(httpServer)
      .get('/appeals')
      .set('Authorization', `Bearer ${moderatorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('PATCH /appeals/:id - debería retornar 404 si no existe la apelación', async () => {
    const res = await request(httpServer)
      .patch('/appeals/9999') // ID inexistente
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ approved: true });

    expect([404, 401]).toContain(res.status);
  });
});

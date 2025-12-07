import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { DataSource } from 'typeorm';
import { TestContext, createTestApp, closeTestApp } from './test-db.util';

let app: INestApplication;
let ctx: TestContext;
let seller: any;
let buyer: any;

describe('ProductsController (e2e)', () => {
  beforeAll(async () => {
    ctx = await createTestApp(true); 
    app = ctx.app;

    const dataSource = app.get<DataSource>(DataSource);
    const manager = dataSource.manager;

    // Crear users vía endpoint de auth (para respetar reglas)
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

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'buyer@example.com',
        nationalId: '8888',
        password: '12345678',
        firstName: 'Buyer',
        lastName: 'One',
      })
      .expect(201);

    const sellers = await manager.query('SELECT * FROM users WHERE email=$1', ['seller@example.com']);
    seller = sellers[0];
    const buyers = await manager.query('SELECT * FROM users WHERE email=$1', ['buyer@example.com']);
    buyer = buyers[0];

    // Forzamos roles
    await manager.query('UPDATE users SET role=$1 WHERE user_id=$2', ['seller', seller.user_id]);
    await manager.query('UPDATE users SET role=$1 WHERE user_id=$2', ['buyer', buyer.user_id]);

    // Insertar un par de productos iniciales
    await manager.query(
      `INSERT INTO items(code, seller_id, type, name, description, price, location, availability, status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      ['C1', seller.user_id, 'product', 'Product A', 'Desc A', 50, 'CityX', true, 'active'],
    );
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('GET /products lista productos activos', async () => {
    const res = await request(app.getHttpServer()).get('/products').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('flujo completo CRUD + favoritos', async () => {
    // Crear
    const createRes = await request(app.getHttpServer())
      .post('/products')
      .set('x-test-user', JSON.stringify({ userId: seller.user_id, role: ['seller'] }))
      .field('name', 'E2E Product')
      .field('description', 'Desc')
      .field('type', 'product')
      .field('price', '12')
      .expect(201);

    const createdId = createRes.body.itemId;

    // Mis productos
    const my = await request(app.getHttpServer())
      .get('/products/my-products')
      .set('x-test-user', JSON.stringify({ userId: seller.user_id, role: ['seller'] }))
      .expect(200);

    expect(my.body.find((p: any) => p.itemId === createdId)).toBeDefined();

 
    const favRes = await request(app.getHttpServer())
      .post(`/products/${createdId}/favorite`)
      .set('x-test-user', JSON.stringify({ userId: buyer.user_id, role: ['buyer'] }))
      .expect(201);

    expect(favRes.body).toHaveProperty('isFavorite', true);
  });
});

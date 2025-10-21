import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { JwtService } from '@nestjs/jwt';
import AppDataSource from '../../src/data-source';
import { execSync } from 'child_process';

let app: INestApplication;
let container: StartedTestContainer;
let sellerToken: string;
let buyerToken: string;
let seller: any;
let buyer: any;

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
  // JWT secret for tests
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
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

    // Override auth guards for tests: read user from x-test-user header
    const moduleBuilder = Test.createTestingModule({ imports: [AppModule] })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          const header = req.get('x-test-user');
          if (header) {
            try {
              req.user = JSON.parse(header);
              return true;
            } catch (e) {
              return false;
            }
          }
          return false;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true });

    const moduleFixture = await moduleBuilder.compile();
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

    // Create a buyer user to test favorites actions
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

    const { DataSource } = await import('typeorm');
    const dataSource = app.get<any>(DataSource);
    const manager = dataSource.manager;

      const sellers = await manager.query('SELECT * FROM users WHERE email=$1', ['seller@example.com']);
      seller = sellers[0];

    const buyers = await manager.query('SELECT * FROM users WHERE email=$1', ['buyer@example.com']);
    buyer = buyers[0];

  // Ensure the registered user has seller role so protected endpoints allow creation
  await manager.query('UPDATE users SET role=$1 WHERE user_id=$2', ['seller', seller.user_id]);

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

    // nothing: we'll use x-test-user header in requests
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

  it('POST /products, PATCH /products/:id, GET /products/my-products y DELETE /products/:id flujo completo', async () => {
    // Crear producto usando token generado
    const createRes = await request(app.getHttpServer())
      .post('/products')
      .set('x-test-user', JSON.stringify({ userId: seller.user_id, role: ['seller'] }))
      .field('name', 'E2E Product')
      .field('description', 'Desc')
      .field('type', 'product')
      .field('price', '12')
      .expect(201);

    expect(createRes.body).toHaveProperty('itemId');
    const createdId = createRes.body.itemId;

    // Obtener mis productos
    const my = await request(app.getHttpServer())
      .get('/products/my-products')
      .set('x-test-user', JSON.stringify({ userId: seller.user_id, role: ['seller'] }))
      .expect(200);

    expect(Array.isArray(my.body)).toBe(true);
    expect(my.body.find((p: any) => p.itemId === createdId)).toBeDefined();

    // Actualizar producto (enviar multipart para que UploadedFiles no sea undefined)
    await request(app.getHttpServer())
      .patch(`/products/${createdId}`)
      .set('x-test-user', JSON.stringify({ userId: seller.user_id, role: ['seller'] }))
      .field('name', 'Updated Name')
      .expect(200);

    // Borrar producto
    await request(app.getHttpServer())
      .delete(`/products/${createdId}`)
      .set('x-test-user', JSON.stringify({ userId: seller.user_id, role: ['seller'] }))
      .expect(200);
  });

  it('POST /products/:id/favorite y GET /products/favorites flujo de favoritos', async () => {
    // Obtener lista de productos y elegir uno
    const list = await request(app.getHttpServer()).get('/products').expect(200);
    const id = list.body[0].itemId;

    // Agregar a favoritos
    const favAdd = await request(app.getHttpServer())
      .post(`/products/${id}/favorite`)
      .set('x-test-user', JSON.stringify({ userId: buyer.user_id, role: ['buyer'] }))
      .expect(201);

    expect(favAdd.body).toHaveProperty('isFavorite', true);

    // Obtener favoritos
    const favs = await request(app.getHttpServer())
      .get('/products/favorites')
      .set('x-test-user', JSON.stringify({ userId: buyer.user_id, role: ['buyer'] }))
      .expect(200);

    expect(Array.isArray(favs.body)).toBe(true);
    expect(favs.body.find((p: any) => p.itemId === id)).toBeDefined();

    // Quitar favorito (toggle) -> expect 201 and isFavorite false
    const favRemove = await request(app.getHttpServer())
      .post(`/products/${id}/favorite`)
      .set('x-test-user', JSON.stringify({ userId: buyer.user_id, role: ['buyer'] }))
      .expect(201);

    expect(favRemove.body).toHaveProperty('isFavorite', false);
  });
});

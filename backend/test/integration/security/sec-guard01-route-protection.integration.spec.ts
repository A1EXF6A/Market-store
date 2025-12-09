import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ensureTestDb } from '../test-db';
import { AuthModule } from '../../../src/auth/auth.module';
import { UsersModule } from '../../../src/users/users.module';
import { ProductsModule } from '../../../src/products/products.module';
import { User, UserRole } from '../../../src/entities/user.entity';
import { Item } from '../../../src/entities/item.entity';
import { ItemPhoto } from '../../../src/entities/item-photo.entity';
import { Favorite } from '../../../src/entities/favorite.entity';
import { Chat } from '../../../src/entities/chat.entity';
import { Appeal } from '../../../src/entities/appeal.entity';
import { Incident } from '../../../src/entities/incident.entity';
import { Message } from '../../../src/entities/message.entity';
import { Rating } from '../../../src/entities/rating.entity';
import { Report } from '../../../src/entities/report.entity';
import { Service } from '../../../src/entities/service.entity';

describe('SEC-Guard01 - route protection and roles', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let sellerToken: string;
  let buyerToken: string;

  beforeAll(async () => {
    await ensureTestDb();
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testSecret';
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          synchronize: true,
          logging: false,
          entities: [User, Item, ItemPhoto, Favorite, Chat, Appeal, Incident, Message, Rating, Report, Service],
        }),
        JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '24h' } }),
        AuthModule,
        UsersModule,
        ProductsModule,
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    jwt = app.get(JwtService);

    // seller
    await request(app.getHttpServer()).post('/auth/register').send({ email: 'seller6@example.com', password: 'Password123!', firstName: 'Seller', lastName: 'Six', nationalId: '50015001', role: UserRole.SELLER }).expect(201);
    let v = jwt.sign({ userId: 1, type: 'email_verification' });
    await request(app.getHttpServer()).get(`/auth/verify-email?token=${v}`).expect(200);
    let res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'seller6@example.com', password: 'Password123!' }).expect(201);
    sellerToken = res.body.access_token;

    // buyer
    await request(app.getHttpServer()).post('/auth/register').send({ email: 'buyer5@example.com', password: 'Password123!', firstName: 'Buyer', lastName: 'Five', nationalId: '99990000' }).expect(201);
    v = jwt.sign({ userId: 2, type: 'email_verification' });
    await request(app.getHttpServer()).get(`/auth/verify-email?token=${v}`).expect(200);
    res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'buyer5@example.com', password: 'Password123!' }).expect(201);
    buyerToken = res.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects without token on protected routes (401)', async () => {
    await request(app.getHttpServer())
      .get('/auth/profile')
      .expect(401);
  });

  it('rejects invalid token (401)', async () => {
    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', 'Bearer invalid.token')
      .expect(401);
  });

  it('enforces role-based access (403 for wrong role)', async () => {
    // Assuming POST /products requires seller role
    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ code: 'PRD-SEC-001', type: 'product', name: 'RBAC Test', price: 1 })
      .expect(403);
  });
});

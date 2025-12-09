import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ensureTestDb } from '../test-db';
import { AuthModule } from '../../../src/auth/auth.module';
import { ProductsModule } from '../../../src/products/products.module';
import { UsersModule } from '../../../src/users/users.module';
import { User, UserRole } from '../../../src/entities/user.entity';
import { Item } from '../../../src/entities/item.entity';
import { ItemPhoto } from '../../../src/entities/item-photo.entity';
import { ItemType } from '../../../src/entities/enums';
import { Favorite } from '../../../src/entities/favorite.entity';
import { Chat } from '../../../src/entities/chat.entity';
import { Appeal } from '../../../src/entities/appeal.entity';
import { Incident } from '../../../src/entities/incident.entity';
import { Message } from '../../../src/entities/message.entity';
import { Rating } from '../../../src/entities/rating.entity';
import { Report } from '../../../src/entities/report.entity';
import { Service } from '../../../src/entities/service.entity';

describe('PR-Fav01 - Favorites add/remove and list', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let buyerToken: string;
  let sellerToken: string;
  let itemId: number;

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
    await request(app.getHttpServer()).post('/auth/register').send({ email: 'seller2@example.com', password: 'Password123!', firstName: 'Seller', lastName: 'Two', nationalId: '90129012', role: UserRole.SELLER }).expect(201);
    let v = jwt.sign({ userId: 1, type: 'email_verification' });
    await request(app.getHttpServer()).get(`/auth/verify-email?token=${v}`).expect(200);
    let res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'seller2@example.com', password: 'Password123!' }).expect(201);
    sellerToken = res.body.access_token;

    // buyer
    await request(app.getHttpServer()).post('/auth/register').send({ email: 'buyer@example.com', password: 'Password123!', firstName: 'Buyer', lastName: 'One', nationalId: '33332222' }).expect(201);
    v = jwt.sign({ userId: 2, type: 'email_verification' });
    await request(app.getHttpServer()).get(`/auth/verify-email?token=${v}`).expect(200);
    res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'buyer@example.com', password: 'Password123!' }).expect(201);
    buyerToken = res.body.access_token;

    // create item by seller
    const itemRes = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ code: 'PRD-FAV-001', type: ItemType.PRODUCT, name: 'Fav Product', price: 9.99 })
      .expect(201);
    itemId = itemRes.body.itemId || itemRes.body.item_id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('add and remove favorite, list favorites', async () => {
    await request(app.getHttpServer())
      .post(`/products/${itemId}/favorite`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/products/favorites')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThanOrEqual(1);

    await request(app.getHttpServer())
      .post(`/products/${itemId}/favorite`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(201);

    const list2 = await request(app.getHttpServer())
      .get('/products/favorites')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    // Should be 0 or less than before
    expect(list2.body.length).toBeLessThan(list.body.length);
  });
});

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
import { ItemType } from '../../../src/entities/enums';
import { ItemPhoto } from '../../../src/entities/item-photo.entity';
import { Favorite } from '../../../src/entities/favorite.entity';
import { Chat } from '../../../src/entities/chat.entity';
import { Appeal } from '../../../src/entities/appeal.entity';
import { Incident } from '../../../src/entities/incident.entity';
import { Message } from '../../../src/entities/message.entity';
import { Rating } from '../../../src/entities/rating.entity';
import { Report } from '../../../src/entities/report.entity';
import { Service } from '../../../src/entities/service.entity';

describe('PR-Items02 - PATCH /products/:id edit product (seller-only)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let sellerToken: string;
  let buyerToken: string;
  let itemId: number;

  beforeAll(async () => {
    await ensureTestDb();
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testSecret';
    process.env.EMAIL_VERIFICATION_SECRET = process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET;
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
    await request(app.getHttpServer()).post('/auth/register').send({ email: 'seller3@example.com', password: 'Password123!', firstName: 'Seller', lastName: 'Three', nationalId: '80018001', role: UserRole.SELLER }).expect(201);
    let v = jwt.sign(
      { userId: 1, type: 'email_verification' },
      { secret: process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET }
    );
    await request(app.getHttpServer()).get(`/auth/verify-email?token=${v}`).expect(200);
    let res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'seller3@example.com', password: 'Password123!' }).expect(201);
    sellerToken = res.body.access_token;

    // buyer
    await request(app.getHttpServer()).post('/auth/register').send({ email: 'buyer2@example.com', password: 'Password123!', firstName: 'Buyer', lastName: 'Two', nationalId: '22221111' }).expect(201);
    v = jwt.sign(
      { userId: 2, type: 'email_verification' },
      { secret: process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET }
    );
    await request(app.getHttpServer()).get(`/auth/verify-email?token=${v}`).expect(200);
    res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'buyer2@example.com', password: 'Password123!' }).expect(201);
    buyerToken = res.body.access_token;

    // create item by seller
    const itemRes = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ code: 'PRD-EDIT-001', type: ItemType.PRODUCT, name: 'Editable Product', price: 12.5, images: [] })
      .expect(201);
    itemId = itemRes.body.itemId || itemRes.body.item_id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('seller can update product', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/products/${itemId}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ name: 'Updated Product', price: 15.0 })
      .expect(200);
    expect(res.body.name).toBe('Updated Product');
    expect(Number(res.body.price)).toBe(15.0);
  });

  it('buyer cannot update product (403)', async () => {
    await request(app.getHttpServer())
      .patch(`/products/${itemId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ name: 'Hack', price: 1 })
      .expect(403);
  });
});

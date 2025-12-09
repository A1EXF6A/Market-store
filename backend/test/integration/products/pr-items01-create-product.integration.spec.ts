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

describe('PR-Items01 - POST /products create product item', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let token: string;

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

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'seller@example.com', password: 'Password123!', firstName: 'Seller', lastName: 'One', nationalId: '77778888', role: UserRole.SELLER })
      .expect(201);
    const v = jwt.sign(
      { userId: 1, type: 'email_verification' },
      { secret: process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET }
    );
    await request(app.getHttpServer()).get(`/auth/verify-email?token=${v}`).expect(200);
    const res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'seller@example.com', password: 'Password123!' }).expect(201);
    token = res.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates product item', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'PRD-001',
        type: ItemType.PRODUCT,
        name: 'Product 1',
        price: 19.99,
        category: 'general',
        description: 'Test product',
        // simulate no images uploaded
        images: [],
      })
      .expect(201);

    expect(res.body.itemId || res.body.item_id).toBeDefined();
    expect(res.body.type).toBe('product');
  });
});

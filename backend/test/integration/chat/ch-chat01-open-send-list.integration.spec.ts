import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ensureTestDb } from '../test-db';
import { AuthModule } from '../../../src/auth/auth.module';
import { UsersModule } from '../../../src/users/users.module';
import { ChatModule } from '../../../src/chat/chat.module';
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

describe('CH-Chat01 - open chat, send message, list', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let buyerToken: string;
  let sellerToken: string;
  let chatId: number;

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
        ChatModule,
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    jwt = app.get(JwtService);

    // seller
    await request(app.getHttpServer()).post('/auth/register').send({ email: 'seller5@example.com', password: 'Password123!', firstName: 'Seller', lastName: 'Five', nationalId: '60016001', role: UserRole.SELLER }).expect(201);
    let v = jwt.sign({ userId: 1, type: 'email_verification' });
    await request(app.getHttpServer()).get(`/auth/verify-email?token=${v}`).expect(200);
    let res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'seller5@example.com', password: 'Password123!' }).expect(201);
    sellerToken = res.body.access_token;

    // buyer
    await request(app.getHttpServer()).post('/auth/register').send({ email: 'buyer4@example.com', password: 'Password123!', firstName: 'Buyer', lastName: 'Four', nationalId: '44445555' }).expect(201);
    v = jwt.sign({ userId: 2, type: 'email_verification' });
    await request(app.getHttpServer()).get(`/auth/verify-email?token=${v}`).expect(200);
    res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'buyer4@example.com', password: 'Password123!' }).expect(201);
    buyerToken = res.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('buyer opens chat with seller, sends message, lists messages', async () => {
    const open = await request(app.getHttpServer())
      .post('/chats/start')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ sellerId: 1 })
      .expect(201);
    chatId = open.body.chatId || open.body.chat_id;

    await request(app.getHttpServer())
      .post(`/chats/messages`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ chatId, content: 'Hello seller!' })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get(`/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body[0].content).toBe('Hello seller!');
  });
});

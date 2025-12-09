import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ensureTestDb } from '../test-db';
import { AuthModule } from '../../../src/auth/auth.module';
import { UsersModule } from '../../../src/users/users.module';
import { User } from '../../../src/entities/user.entity';
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

describe('US-Users02 - PATCH /users/me (update profile)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let token: string;

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
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    jwt = app.get(JwtService);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'upd@example.com', password: 'Password123!', firstName: 'Upd', lastName: 'User', nationalId: '33334444' })
      .expect(201);
    const v = jwt.sign(
      { userId: 1, type: 'email_verification' },
      { secret: process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET }
    );
    await request(app.getHttpServer()).get(`/auth/verify-email?token=${v}`).expect(200);
    const res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'upd@example.com', password: 'Password123!' }).expect(201);
    token = res.body.access_token;
  });

  afterAll(async () => {
    await request(app.getHttpServer()).delete('/users/me').set('Authorization', `Bearer ${token}`);
    await app.close();
  });

  it('updates name and address and persists', async () => {
    await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'upd@example.com', firstName: 'Updated', lastName: 'User', address: '123 Test St' })
      .expect(200);

    const prof = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Validate name via profile
    expect(prof.body.firstName).toBe('Updated');
    expect(prof.body.lastName).toBe('User');

    // Fetch full user to check address
    const user = await request(app.getHttpServer())
      .get(`/users/${prof.body.userId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(user.body.address).toBe('123 Test St');
  });
});

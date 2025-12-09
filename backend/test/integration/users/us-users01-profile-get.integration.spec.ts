import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ensureTestDb } from '../test-db';
import { AuthModule } from '../../../src/auth/auth.module';
import { UsersModule } from '../../../src/users/users.module';
import { User, UserRole, UserStatus } from '../../../src/entities/user.entity';
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

describe('US-Users01 - GET /auth/profile (JWT)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let accessToken: string;

  const testUser = {
    email: 'profile.user@example.com',
    password: 'Password123!',
    firstName: 'Profile',
    lastName: 'User',
    nationalId: '11112222',
    role: UserRole.BUYER,
    status: UserStatus.ACTIVE,
  };

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
          entities: [
            User,
            Item,
            ItemPhoto,
            Favorite,
            Chat,
            Appeal,
            Incident,
            Message,
            Rating,
            Report,
            Service,
          ],
        }),
        JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '24h' } }),
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    jwt = app.get(JwtService);

    // Register user via API to ensure password hash & verified state
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testUser.email,
        password: testUser.password,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        nationalId: testUser.nationalId,
      })
      .expect(201);

    // Verify user to allow login
    const verifyToken = jwt.sign({ userId: 1, type: 'email_verification' });
    await request(app.getHttpServer())
      .get(`/auth/verify-email?token=${verifyToken}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(201);
    accessToken = res.body.access_token;
  });

  afterAll(async () => {
    await request(app.getHttpServer()).delete('/users/me').set('Authorization', `Bearer ${accessToken}`);
    await app.close();
  });

  it('returns profile data with valid JWT', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.email).toBe(testUser.email);
    expect(res.body.firstName).toBe(testUser.firstName);
    expect(res.body.lastName).toBe(testUser.lastName);
  });
});

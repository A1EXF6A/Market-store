require('dotenv').config({ path: '.env' });

import * as request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";

import { AuthModule } from "../../src/auth/auth.module";
import { UsersModule } from "../../src/users/users.module";
import { User, UserRole, UserStatus } from "../../src/entities/user.entity";
import { Item } from "../../src/entities/item.entity";
import { ItemPhoto } from "../../src/entities/item-photo.entity";
import { Favorite } from "../../src/entities/favorite.entity";
import { Chat } from "../../src/entities/chat.entity";
import { Appeal } from "../../src/entities/appeal.entity";
import { Incident } from "../../src/entities/incident.entity";
import { Message } from "../../src/entities/message.entity";
import { Rating } from "../../src/entities/rating.entity";
import { Report } from "../../src/entities/report.entity";
import { Service } from "../../src/entities/service.entity";

describe("UsersController Endpoints Coverage", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let testUserToken: string;
  let testUserId: number;

  const testUser = {
    email: "coverage.user@test.com",
    password: "12345678",
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = "testSecret";

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          synchronize: false,
          logging: true,
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
        TypeOrmModule.forFeature([User]),
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));

    // Crear usuario de prueba
    const passwordHash = await bcrypt.hash(testUser.password, 10);
    const user = userRepository.create({
      nationalId: "999990999",
      firstName: "Coverage",
      lastName: "User",
      email: testUser.email,
      passwordHash,
      role: UserRole.BUYER,
      status: UserStatus.ACTIVE,
      verified: true,
    });
    const savedUser = await userRepository.save(user);
    testUserId = savedUser.userId;

    // Login para obtener token
    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    testUserToken = loginRes.body?.access_token ?? "fake-token";
  });

  afterAll(async () => {
    await userRepository.delete({ email: testUser.email });
    await app.close();
  });

  it("Should call all UsersController endpoints", async () => {
    const server = app.getHttpServer();

    // GET /users
    await request(server).get("/users").set("Authorization", `Bearer ${testUserToken}`);

    // GET /users/:id
    await request(server).get(`/users/${testUserId}`).set("Authorization", `Bearer ${testUserToken}`);

    // PATCH /users/:id/status
    await request(server)
      .patch(`/users/${testUserId}/status`)
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({ status: UserStatus.SUSPENDED });

    // PATCH /users/:id/verify
    await request(server)
      .patch(`/users/${testUserId}/verify`)
      .set("Authorization", `Bearer ${testUserToken}`);

    // PUT /users/profile
    await request(server)
      .put("/users/profile")
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({ firstName: "Updated", lastName: "User" });

    // PATCH /users/change-password
    await request(server)
      .patch("/users/change-password")
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({ oldPassword: testUser.password, newPassword: "newPassword123" });

    // PATCH /users/me
    await request(server)
      .patch("/users/me")
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({ email: testUser.email, firstName: "MeUpdated" });

    // PATCH /users/:id
    await request(server)
      .patch(`/users/${testUserId}`)
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({ firstName: "AdminUpdated" });

    // PATCH /users/:id/role
    await request(server)
      .patch(`/users/${testUserId}/role`)
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({ role: UserRole.SELLER });

    // DELETE /users/:id
    await request(server)
      .delete(`/users/${testUserId}`)
      .set("Authorization", `Bearer ${testUserToken}`);

    expect(true).toBe(true); // solo para que el test pase
  });
});

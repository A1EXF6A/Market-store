require('dotenv').config({ path: '.env' }); // o '.env.test' si tienes uno

import * as request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";

import { AuthModule } from "../../src/auth/auth.module";
import { User } from "../../src/entities/user.entity";
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

describe("CM-US09 - Login con usuario suspendido", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const suspendedUser = {
    email: "maria.gonzalez@email.com",
    password: "con123",
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
          synchronize: true,
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
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await app.close();
  });

  it("No debería permitir login de usuario suspendido", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: suspendedUser.email,
        password: suspendedUser.password,
      });

    // Esperamos que devuelva 401 Unauthorized
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/INVALID_CREDENTIALS|User suspended/i);
  });
});

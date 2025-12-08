// test/integration/cm-us06-login-fallo.integration.spec.ts
require('dotenv').config({ path: '.env' }); // o '.env.test' si tienes uno

import * as request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtModule } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";

import { AuthModule } from "../../src/auth/auth.module";
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

describe("CM-US06 - Login con credenciales inválidas o usuario no verificado", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const testUser = {
    email: "noverificado@email.com",
    password: "Password123!",
    firstName: "No",
    lastName: "Verificado",
    nationalId: "87621",
    role: UserRole.BUYER,
    status: UserStatus.ACTIVE,
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = "testSecret"; // Secret para tests

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
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: "24h" },
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));

    // Limpiar usuario previo
    await userRepository.delete({ email: testUser.email });

    // Crear usuario NO verificado
    const user = userRepository.create({
      ...testUser,
      passwordHash: await bcrypt.hash(testUser.password, 10),
      verified: false,
    });
    await userRepository.save(user);
  });

  afterAll(async () => {
    await userRepository.delete({ email: testUser.email });
    await app.close();
  });

  it("Debería fallar login con credenciales inválidas", async () => {
    // Usuario con contraseña incorrecta
    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: testUser.email, password: "IncorrectPassword!" })
      .expect(401);
  });

  it("Debería fallar login con usuario no verificado", async () => {
    // Usuario con contraseña correcta pero no verificado
    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: testUser.email, password: testUser.password })
      .expect(401);
  });
});

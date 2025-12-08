require('dotenv').config({ path: '.env' }); // o '.env.test' si tienes uno

import * as request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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

describe("CM-US07 - Recuperación de contraseña (Integración)", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  const testUser = {
    email: "recuperar@email.com",
    password: "Password123!",
    firstName: "Recuperar",
    lastName: "Usuario",
    nationalId: "99999999",
    role: UserRole.BUYER,
    status: UserStatus.ACTIVE,
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
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));

    // Limpiar usuario previo si existe
    const existingUser = await userRepository.findOne({ where: { email: testUser.email } });
    if (existingUser) await userRepository.remove(existingUser);

    // Crear usuario
    const user = userRepository.create({
      ...testUser,
      passwordHash: await bcrypt.hash(testUser.password, 10),
      verified: true,
    });
    await userRepository.save(user);
  });

  afterAll(async () => {
    await userRepository.delete({ email: testUser.email });
    await app.close();
  });

  it("Debería enviar token de recuperación al email", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/forgot-password")
      .send({ email: testUser.email })
      .expect(201);

    expect(res.body.message).toBeDefined();
    // No se puede verificar el token real porque va por email
  });

  it("Debería fallar si el email no existe", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/forgot-password")
      .send({ email: "noexiste@email.com" })
      .expect(201);

    expect(res.body.message).toBeDefined();
  });
});

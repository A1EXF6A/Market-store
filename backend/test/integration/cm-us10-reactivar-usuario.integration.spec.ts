// test/integration/cm-us10-reactivar-usuario.integration.spec.ts
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

describe("CM-US10 - Reactivar usuario", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const testUser = {
    email: "reactivar.usuario@email.com",
    password: "Password123!",
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = "testSecret";

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "127.0.0.1",
          port: 5432,
          username: "postgres",
          password: "Youpikne/47",
          database: "sistema_ventas",
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

    // Crear usuario suspendido
    const passwordHash = await bcrypt.hash(testUser.password, 10);
    const user = userRepository.create({
      nationalId: "99999999",
      firstName: "Usuario",
      lastName: "Suspendido",
      email: testUser.email,
      passwordHash,
      role: UserRole.BUYER,
      status: UserStatus.SUSPENDED,
      verified: true,
    });

    await userRepository.save(user);
  });

  afterAll(async () => {
    await userRepository.delete({ email: testUser.email });
    await app.close();
  });

  it("Debería permitir reactivar un usuario y hacer login", async () => {
    // Reactivar usuario
    const user = await userRepository.findOne({ where: { email: testUser.email } });
    user.status = UserStatus.ACTIVE;
    await userRepository.save(user);

    // Intentar login
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(201); // Login exitoso
    expect(res.body.user.email).toBe(testUser.email);

    // Verificar status directamente en la base de datos
    const updatedUser = await userRepository.findOne({ where: { email: testUser.email } });
    expect(updatedUser.status).toBe(UserStatus.ACTIVE);
  });
});

// test/integration/cm-us05-login.integration.spec.ts
import * as request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtModule, JwtService } from "@nestjs/jwt";

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

describe("CM-US05 - Login de usuario existente (Integración)", () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let accessToken: string;

  const testUser = {
    email: "juan.perez@email.com",
    password: "Password123!",
    firstName: "Juan",
    lastName: "Pérez",
    nationalId: "12345678",
    role: UserRole.BUYER,
    status: UserStatus.ACTIVE,
  };

  beforeAll(async () => {
    //  el test
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
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: "24h" },
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    jwtService = app.get(JwtService);
    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));

    // Limpiar usuario previo por si existe
    await userRepository.delete({ email: testUser.email });

    // Crear usuario verificado para login
    const user = userRepository.create({
      ...testUser,
      passwordHash: await require("bcryptjs").hash(testUser.password, 10),
      verified: true,
    });

    await userRepository.save(user);
  });

  afterAll(async () => {
    await userRepository.delete({ email: testUser.email });
    await app.close();
  });

  it("Debería iniciar sesión y devolver JWT + datos del usuario", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: testUser.email, password: testUser.password })
      .expect(201);

    accessToken = res.body.access_token;
    console.log("Access token generado:", accessToken); // ✅ depuración
    expect(accessToken).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.verified).toBe(true);
  });

  it("Debería permitir acceso a /auth/profile usando el JWT", async () => {
    const res = await request(app.getHttpServer())
      .get("/auth/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.email).toBe(testUser.email);
    expect(res.body.firstName).toBe(testUser.firstName);
    expect(res.body.lastName).toBe(testUser.lastName);
    expect(res.body.verified).toBe(true);
  });
});

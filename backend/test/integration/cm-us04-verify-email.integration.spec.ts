require('dotenv').config({ path: '.env' }); 
import * as request from "supertest"; // <-- cambio aquí
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

describe("CM-US04 - Verificación de correo (Integración)", () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let verificationToken: string;

  const testUser = {
    email: "testuser@example.com",
    password: "Password123!",
    firstName: "Test",
    lastName: "User",
    nationalId: "123456789",
  };

  beforeAll(async () => {
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

    jwtService = app.get(JwtService);
    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));

    // Limpiar usuario previo por si existe
    await userRepository.delete({ email: testUser.email });
  });

  afterAll(async () => {
    await userRepository.delete({ email: testUser.email });
    await app.close();
  });

  it("Debería registrar un usuario", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/register")
      .send(testUser)
      .expect(201);

    expect(res.body.message).toContain("Registro exitoso");

    const user = await userRepository.findOneBy({ email: testUser.email });
    expect(user).toBeDefined();

    // Generar token de verificación como lo hace AuthService
    verificationToken = jwtService.sign(
      { userId: user.userId, type: "email_verification" },
      {
        secret: process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET,
        expiresIn: "24h",
      }
    );
  });

  it("Debería verificar el usuario usando GET /auth/verify-email?token=...", async () => {
    const res = await request(app.getHttpServer())
      .get("/auth/verify-email")
      .query({ token: verificationToken })
      .expect(200);

    expect(res.body.message).toBe("Email verified successfully");

    const user = await userRepository.findOneBy({ email: testUser.email });
    expect(user.verified).toBe(true);
  });
});

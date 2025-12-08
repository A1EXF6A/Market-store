import * as request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { JwtService, JwtModule } from "@nestjs/jwt";

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

describe("CM-US08 - Resetear contraseña", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const testUser = {
    email: "resetuser@email.com",
    password: "OldPassword123!",
    firstName: "Reset",
    lastName: "User",
    nationalId: "99988877",
    role: UserRole.BUYER,
    status: UserStatus.ACTIVE,
  };

  let resetToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = "testSecret";
    process.env.EMAIL_VERIFICATION_SECRET = "testSecret";

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

    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    jwtService = app.get(JwtService);

    // Limpiar usuario previo
    const existing = await userRepository.findOne({ where: { email: testUser.email } });
    if (existing) await userRepository.remove(existing);

    // Crear usuario verificado
    const user = userRepository.create({
      ...testUser,
      passwordHash: await bcrypt.hash(testUser.password, 10),
      verified: true,
    });
    await userRepository.save(user);

    // Generar token de reseteo
    resetToken = jwtService.sign({ userId: user.userId, type: "password_reset" }, { secret: process.env.JWT_SECRET, expiresIn: "1h" });
  });

  afterAll(async () => {
    await userRepository.delete({ email: testUser.email });
    await app.close();
  });

  it("Debería resetear la contraseña correctamente", async () => {
    const newPassword = "NewPassword123!";

    const res = await request(app.getHttpServer())
      .post("/auth/reset-password")
      .send({ token: resetToken, newPassword })
      .expect(201);

    expect(res.body.message).toBe("Password reset successfully");

    // Verificar que la contraseña fue actualizada y encriptada
    const updatedUser = await userRepository.findOne({ where: { email: testUser.email } });
    const isMatch = await bcrypt.compare(newPassword, updatedUser.passwordHash);
    expect(isMatch).toBe(true);
  });
});

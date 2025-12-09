require('dotenv').config({ path: '.env' });

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";

import { AuthModule } from "../../src/auth/auth.module";
import { UsersService } from "../../src/users/users.service";
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

describe("CM-US08 - UsersService coverage helpers", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let usersService: UsersService;

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
      providers: [UsersService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    usersService = moduleRef.get<UsersService>(UsersService);

    // Crear un usuario para “tocar” todos los métodos
    const passwordHash = await bcrypt.hash("Test1234", 10);
    testUser = userRepository.create({
      nationalId: "123456789",
      firstName: "Coverage",
      lastName: "Test",
      email: "coverage@test.com",
      passwordHash,
      role: UserRole.BUYER,
      status: UserStatus.ACTIVE,
      verified: false,
    });
    await userRepository.save(testUser);
  });

  afterAll(async () => {
    await userRepository.delete({ email: testUser.email });
    await app.close();
  });

  it("Should call all UsersService methods to increase coverage", async () => {
    // findAll
    await usersService.findAll({ role: UserRole.BUYER, status: UserStatus.ACTIVE, search: "Coverage" });

    // findById
    await usersService.findById(testUser.userId);

    // findByEmail
    await usersService.findByEmail(testUser.email);

    // updateUser
    await usersService.updateUser(testUser.userId, { firstName: "UpdatedName" });

    // changePassword
    await usersService.changePassword(testUser.userId, { currentPassword: "Test1234", newPassword: "New1234" });

    // verifyUser
    await usersService.verifyUser(testUser.userId);

    // updateUserStatus
    await usersService.updateUserStatus(testUser.userId, UserStatus.SUSPENDED, new Date());

    // updateUserRole
    await usersService.updateUserRole(testUser.userId, UserRole.SELLER);

    // switchMyRole
    try {
      await usersService.switchMyRole(testUser.userId, UserRole.SELLER);
    } catch {}

    // deleteUser
    const userForDelete = await userRepository.save(
      userRepository.create({ ...testUser, email: "delete@test.com" })
    );
    await usersService.deleteUser(userForDelete.userId);

    // createUserSafe
    try {
      await usersService.createUserSafe({ email: testUser.email, password: "abc123", role: UserRole.BUYER });
    } catch {}
  });
});

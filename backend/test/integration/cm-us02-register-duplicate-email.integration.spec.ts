import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { User } from '../../src/entities/user.entity';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../../src/email/email.service';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Importar todas las entidades usadas en relaciones
import { Item } from '../../src/entities/item.entity';
import { ItemPhoto } from '../../src/entities/item-photo.entity';
import { Favorite } from '../../src/entities/favorite.entity';
import { Service } from '../../src/entities/service.entity';
import { Report } from '../../src/entities/report.entity';
import { Message } from '../../src/entities/message.entity';
import { Appeal } from '../../src/entities/appeal.entity';
import { Rating } from '../../src/entities/rating.entity';
import { Incident } from '../../src/entities/incident.entity';
import { Chat } from '../../src/entities/chat.entity';

// Cargar variables del .env
dotenv.config();

describe('CM-US02 - Registro con correo duplicado', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let dataSource: DataSource;

  const testUserData = {
    email: 'juan.perez@email.com',
    password: 'Password123!',
    nationalId: '12345678',
    firstName: 'Juan',
    lastName: 'Perez',
  };

  beforeAll(async () => {
    // Inicializar DataSource usando variables de entorno
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: true, // Solo en tests
      entities: [
        User,
        Item,
        ItemPhoto,
        Favorite,
        Service,
        Report,
        Message,
        Appeal,
        Rating,
        Incident,
        Chat,
      ],
    });

    await dataSource.initialize();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        EmailService,
        JwtService,
        {
          provide: 'UserRepository',
          useValue: dataSource.getRepository(User),
        },
        {
          provide: UsersService,
          useFactory: () => new UsersService(dataSource.getRepository(User)),
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);

    // Insertar usuario inicial para probar duplicado
    const passwordHash = await bcrypt.hash(testUserData.password, 10);
    await usersService['userRepository'].save({
      ...testUserData,
      passwordHash, 
    });
  });

  afterAll(async () => {
    // Limpiar la base de datos
    const user = await usersService.findByEmail(testUserData.email);
    if (user) {
      await usersService.deleteUser(user.userId);
    }
    await dataSource.destroy();
  });

  it('debería lanzar error 409 si el correo ya existe', async () => {
    const duplicateUserData = {
      ...testUserData,
      nationalId: '87654321', // cambiar para no violar otra restricción
    };

    await expect(authService.register(duplicateUserData))
      .rejects
      .toThrow(ConflictException);
  });
});

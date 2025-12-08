import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { EmailService } from '../../src/email/email.service';
import { JwtService } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import { User } from '../../src/entities/user.entity';
import { Item } from '../../src/entities/item.entity';
import { ItemPhoto } from '../../src/entities/item-photo.entity';
import { Message } from '../../src/entities/message.entity';
import { Chat } from '../../src/entities/chat.entity';
import { Rating } from '../../src/entities/rating.entity';
import { Report } from '../../src/entities/report.entity';
import { Appeal } from '../../src/entities/appeal.entity';
import { Service } from '../../src/entities/service.entity';
import { Favorite } from '../../src/entities/favorite.entity';
import { Incident } from '../../src/entities/incident.entity';

dotenv.config();

describe('CM-US01 - Registro de usuario (Integración real)', () => {
  let authService: AuthService;
  let userRepo;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          entities: [
            User, Item, ItemPhoto, Message, Chat, Rating, Report, Appeal, Service, Favorite, Incident
          ],
          synchronize: true, // solo para desarrollo
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [
        AuthService,
        UsersService,
        JwtService,
        EmailService, // nuestro servicio hardcodeado
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepo = module.get('UserRepository'); // repositorio real
  });

  afterAll(async () => {
    // Limpiar el usuario de prueba
    await userRepo.delete({ email: 'alejosanchez456@gmail.com' });
  });

  it('debería crear un usuario real y enviar correo de verificación', async () => {
    const registerDto = {
      email: 'alejosanchez456@gmail.com',
      password: 'Password123!',
      firstName: 'Alejo',
      lastName: 'Sanchez',
      nationalId: '1234578',
    };

    const response = await authService.register(registerDto);

    expect(response).toEqual({
      message: 'Registro exitoso. Revisa tu correo para verificar la cuenta (expira en 24h).',
    });

    const savedUser = await userRepo.findOne({ where: { email: registerDto.email } });
    expect(savedUser).toBeDefined();
    expect(savedUser.verified).toBe(false);
  });
});

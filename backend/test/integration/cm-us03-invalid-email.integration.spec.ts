import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/users/users.service';
import { AuthService } from '../../src/auth/auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../../src/email/email.service'; // ajusta la ruta según tu proyecto

describe('CM-US03 - Registro con correo inválido (Integración)', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository, // mock básico del repositorio
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn() }, // mock del JWT
        },
        {
          provide: EmailService,
          useValue: { sendEmail: jest.fn() }, // mock del EmailService
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('debería lanzar un error al registrar un correo inválido', async () => {
    const registerDto = {
      email: 'correo-invalido', // correo no válido
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      nationalId: '12345678', // required por RegisterDto
    };

    await expect(authService.register(registerDto)).rejects.toThrow();
  });
});

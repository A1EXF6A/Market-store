import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as any;

    jwtService = {
      sign: jest.fn().mockReturnValue('fake-jwt'),
    } as any;

    service = new AuthService(userRepo, jwtService);
  });

  describe('register', () => {
    it('debería registrar un nuevo usuario y devolver un token', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      userRepo.create.mockReturnValue({ userId: 1, email: 'test@example.com' } as any);
      userRepo.save.mockResolvedValue({ userId: 1, email: 'test@example.com' } as any);

      const result = await service.register({
        email: 'test@example.com',
        nationalId: '1234567890',
        password: '12345678',
        firstName: 'Test',
        lastName: 'User'
      } as any);

      expect(result.access_token).toBe('fake-jwt');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('debería lanzar error si el email ya existe', async () => {
      userRepo.findOneBy.mockResolvedValue({ email: 'test@example.com' } as any);
      await expect(service.register({
        email: 'test@example.com',
        nationalId: '1234567890',
        password: '12345678',
        firstName: 'Test',
        lastName: 'User'
      } as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('debería loguear con credenciales válidas', async () => {
      const user = { userId: 1, email: 'test@example.com', passwordHash: await bcrypt.hash('12345678', 10) } as User;
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.login({ email: 'test@example.com', password: '12345678' });
      expect(result.access_token).toBe('fake-jwt');
    });

    it('debería lanzar error si las credenciales son inválidas', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.login({ email: 'wrong@example.com', password: 'invalid' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

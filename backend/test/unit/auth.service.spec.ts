import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailService } from '../../src/common/services/email.service';
import * as bcrypt from 'bcryptjs';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;

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

    emailService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    } as any;

    service = new AuthService(userRepo, jwtService, emailService);
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

    it('debería lanzar error si faltan campos (email/nationalId/password)', async () => {
      await expect(service.register({} as any)).rejects.toThrow(ConflictException);
    });

    it('debería lanzar error si nationalId ya existe', async () => {
      // Simular que la verificación por email no encuentra nada, pero la de nationalId sí
      (userRepo.findOneBy as jest.Mock)
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ nationalId: '123' } as any); // nationalId check

      await expect(
        service.register({
          email: 'unique@example.com',
          nationalId: '123',
          password: '12345678',
          firstName: 'Test',
          lastName: 'User'
        } as any)
      ).rejects.toThrow(ConflictException);
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

    it('debería lanzar error si faltan campos (email/password)', async () => {
      await expect(service.login({} as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('debería devolver usuario por id usando userRepository.findOne', async () => {
      const user = { userId: 42, email: 'u@example.com' } as any;
      userRepo.findOne.mockResolvedValue(user);
      const result = await service.validateUser(42);
      expect(result).toBe(user);
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { userId: 42 } });
    });
  });
});

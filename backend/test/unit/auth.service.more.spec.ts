import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../../src/email/email.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { User, UserRole, UserStatus } from '../../src/entities/user.entity';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  __esModule: true,
  compare: jest.fn(async () => true),
  hash: jest.fn(async (v: string) => `hashed:${v}`),
}));

describe('AuthService additional coverage', () => {
  let auth: AuthService;
  let repo: any;
  let jwt: any;
  let email: any;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((u: Partial<User>) => ({ ...u, userId: 1 } as any)),
      save: jest.fn(async (u: any) => u),
    };
    jwt = {
      sign: jest.fn(() => 'signed-token'),
      verify: jest.fn(),
    } as Partial<JwtService> as JwtService;
    email = {
      sendVerificationEmail: jest.fn(async () => {}),
      sendPasswordResetEmail: jest.fn(async () => {}),
    } as Partial<EmailService> as EmailService;
    auth = new AuthService(repo as any, jwt as any, email as any);
    process.env.JWT_SECRET = 's';
    process.env.EMAIL_VERIFICATION_SECRET = 'vs';
    (bcrypt as any).compare.mockResolvedValue(true);
  });

  describe('register', () => {
    it('throws when fields are missing', async () => {
      await expect(auth.register({} as any)).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws when email exists', async () => {
      repo.findOne.mockResolvedValueOnce({ userId: 2 });
      await expect(auth.register({ email: 'a@b.c', nationalId: '1', password: 'p' } as any)).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws when nationalId exists', async () => {
      repo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ userId: 3 });
      await expect(auth.register({ email: 'a@b.c', nationalId: '1', password: 'p' } as any)).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates user and sends email', async () => {
      repo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      const res = await auth.register({ email: 'a@b.c', nationalId: '1', password: 'p', role: UserRole.SELLER, firstName: 'X' } as any);
      expect(jwt.sign).toHaveBeenCalled();
      expect(email.sendVerificationEmail).toHaveBeenCalled();
      expect(res.message).toMatch(/Registro exitoso/);
    });
  });

  describe('login', () => {
    it('missing fields', async () => {
      await expect(auth.login({} as any)).rejects.toBeInstanceOf(ConflictException);
    });

    it('deleted account yields USER_DELETED', async () => {
      repo.findOne
        .mockResolvedValueOnce(null) // active user lookup
        .mockResolvedValueOnce({ userId: 9, deleted: true });
      await expect(auth.login({ email: 'a@b.c', password: 'p' })).rejects.toThrow(new UnauthorizedException('USER_DELETED'));
    });

    it('invalid credentials when no user', async () => {
      repo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      await expect(auth.login({ email: 'a@b.c', password: 'p' })).rejects.toThrow(new UnauthorizedException('INVALID_CREDENTIALS'));
    });

    it('email not verified', async () => {
      const user = { email: 'a@b.c', passwordHash: '$2b$10$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', verified: false } as any;
      repo.findOne.mockResolvedValueOnce(user);
      await expect(auth.login({ email: 'a@b.c', password: 'aaaaaaaaaa' })).rejects.toThrow(new UnauthorizedException('EMAIL_NOT_VERIFIED'));
    });

    it('suspended user with future suspendedUntil', async () => {
      const future = new Date(Date.now() + 3600_000).toISOString();
      const user = { userId: 2, email: 'a@b.c', passwordHash: '$2b$10$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', verified: true, status: UserStatus.SUSPENDED, suspendedUntil: future } as any;
      repo.findOne.mockResolvedValueOnce(user);
      await expect(auth.login({ email: 'a@b.c', password: 'aaaaaaaaaa' })).rejects.toThrow(new UnauthorizedException('USER_SUSPENDED'));
    });

    it('suspension expired auto-reactivates and logs in', async () => {
      const past = new Date(Date.now() - 3600_000).toISOString();
      const user = { userId: 3, email: 'a@b.c', passwordHash: '$2b$10$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', verified: true, status: UserStatus.SUSPENDED, suspendedUntil: past } as any;
      repo.findOne.mockResolvedValueOnce(user);
      const res = await auth.login({ email: 'a@b.c', password: 'aaaaaaaaaa' });
      expect(res.access_token).toBeDefined();
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('forgot/reset password', () => {
    it('forgotPassword: non-existing email returns generic message', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      const res = await auth.forgotPassword('none@example.com');
      expect(res.message).toMatch(/reset link/);
    });

    it('forgotPassword: existing email sends email', async () => {
      repo.findOne.mockResolvedValueOnce({ userId: 1, email: 'a@b.c' });
      const res = await auth.forgotPassword('a@b.c');
      expect(jwt.sign).toHaveBeenCalled();
      expect(email.sendPasswordResetEmail).toHaveBeenCalled();
      expect(res.message).toMatch(/reset link/);
    });

    it('resetPassword: invalid token', async () => {
      jwt.verify = jest.fn(() => { throw new Error('bad'); });
      await expect(auth.resetPassword('badtoken', 'newpass')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('resetPassword: wrong type', async () => {
      jwt.verify = jest.fn(() => ({ type: 'other', userId: 1 }));
      await expect(auth.resetPassword('t', 'p')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('verify/resend email', () => {
    it('verifyEmail: wrong type', async () => {
      jwt.verify = jest.fn(() => ({ type: 'x', userId: 1 }));
      await expect(auth.verifyEmail('t')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('verifyEmail: ok and saves', async () => {
      jwt.verify = jest.fn(() => ({ type: 'email_verification', userId: 5 }));
      repo.findOne.mockResolvedValueOnce({ userId: 5, verified: false });
      const res = await auth.verifyEmail('tok');
      expect(repo.save).toHaveBeenCalled();
      expect(res.message).toMatch(/verified successfully/);
    });

    it('resendVerificationEmail: unknown email returns generic', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      const res = await auth.resendVerificationEmail('x@y.z');
      expect(res.message).toMatch(/verification link/);
    });

    it('resendVerificationEmail: already verified', async () => {
      repo.findOne.mockResolvedValueOnce({ verified: true });
      const res = await auth.resendVerificationEmail('x@y.z');
      expect(res.message).toMatch(/already verified/);
    });

    it('resendVerificationEmail: sends email', async () => {
      repo.findOne.mockResolvedValueOnce({ userId: 1, email: 'x@y.z', firstName: 'F', verified: false });
      const res = await auth.resendVerificationEmail('x@y.z');
      expect(jwt.sign).toHaveBeenCalled();
      expect(email.sendVerificationEmail).toHaveBeenCalled();
      expect(res.message).toMatch(/resent successfully/);
    });
  });
});

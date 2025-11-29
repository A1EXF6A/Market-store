// src/auth/auth.service.ts
import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { Repository } from "typeorm";

import { User, UserRole, UserStatus } from "../entities/user.entity";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { EmailService } from "../email/email.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(EmailService) private readonly emailService: EmailService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { email, nationalId, password, role, ...userData } = registerDto;

    if (!email || !nationalId || !password) {
      throw new ConflictException("All fields are required");
    }

    const emailExists = await this.userRepository.findOne({ where: { email, deleted: false } });
    if (emailExists) throw new ConflictException("User already exists with this email");

    const nationalIdExists = await this.userRepository.findOne({ where: { nationalId } });
    if (nationalIdExists) throw new ConflictException("User already exists with this national ID");

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      ...userData,
      email,
      nationalId,
      passwordHash,
      role: (role as any) ?? UserRole.BUYER,
      verified: false,
    });

    await this.userRepository.save(user);

    // ---- Token de verificación (24h) ----
    const vPayload: Record<string, any> = { userId: user.userId, type: "email_verification" };
    const vToken = this.jwtService.sign(vPayload, {
      secret: process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET,
      // Si tu tipo de JwtSignOptions protesta, deja solo '24h' o castea como any:
      expiresIn: ("24h" as any),
    });

    try {
      await this.emailService.sendVerificationEmail(user.email, vToken, user.firstName);
    } catch (err) {
      console.error("Error sending verification email:", err?.message || err);
    }

    return {
      message: "Registro exitoso. Revisa tu correo para verificar la cuenta (expira en 24h).",
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    if (!email || !password) {
      throw new ConflictException("All fields are required");
    }

    // Prefer an active (non-deleted) user for login
    const user = await this.userRepository.findOne({ where: { email, deleted: false } });

    // If there's no active user, but there is a deleted account with this email,
    // report USER_DELETED so the frontend can show an appropriate message.
    if (!user) {
      const deletedUser = await this.userRepository.findOne({ where: { email, deleted: true } });
      if (deletedUser) {
        throw new UnauthorizedException("USER_DELETED");
      }
      // no user at all
      throw new UnauthorizedException("INVALID_CREDENTIALS");
    }

    const ok = await bcrypt.compare(password, user.passwordHash ?? "");
    if (!ok) {
      throw new UnauthorizedException("INVALID_CREDENTIALS");
    }

    // Verificación de correo
    if (!user.verified) {
      throw new UnauthorizedException("EMAIL_NOT_VERIFIED");
    }

    // NUEVA VERIFICACIÓN: Usuario suspendido (soporta suspensión temporal)
    if (user.status === UserStatus.SUSPENDED) {
      const now = new Date();
      // If suspendedUntil is null => permanent suspension
      if (!user.suspendedUntil) {
        throw new UnauthorizedException("USER_SUSPENDED");
      }

      // If suspendedUntil is in the future => still suspended
      const suspendedUntilDate = new Date(user.suspendedUntil);
      if (suspendedUntilDate > now) {
        throw new UnauthorizedException("USER_SUSPENDED");
      }

      // Suspension expired: reactivate user automatically
      user.status = UserStatus.ACTIVE;
      user.suspendedUntil = null as any;
      try {
        await this.userRepository.save(user);
      } catch (err) {
        // If saving fails, still deny login to be safe
        throw new UnauthorizedException("USER_SUSPENDED");
      }
    }

    const payload: Record<string, any> = {
      email: user.email,
      sub: user.userId,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: "24h",
    });

    return {
      access_token,
      user: {
        userId: user.userId,
        email: user.email,
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        verified: user.verified,
        status: user.status,
      },
    };
  }

  async validateUser(userId: number): Promise<User> {
    // When validating from token, ensure the account is not deleted
    return this.userRepository.findOne({ where: { userId, deleted: false } });
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return { message: "If the email exists, a reset link has been sent" };

    const rPayload: Record<string, any> = { userId: user.userId, type: "password_reset" };
    const rToken = this.jwtService.sign(rPayload, {
      secret: process.env.JWT_SECRET,
      expiresIn: ("1h" as any),
    });

    try {
      await this.emailService.sendPasswordResetEmail(email, rToken);
    } catch (err) {
      console.error("Error sending reset email:", err?.message || err);
    }

    return { message: "If the email exists, a reset link has been sent" };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      if (payload.type !== "password_reset") {
        throw new UnauthorizedException("Invalid token type");
      }

      const user = await this.userRepository.findOne({ where: { userId: payload.userId } });
      if (!user) throw new UnauthorizedException("Invalid token");

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      await this.userRepository.save(user);

      return { message: "Password reset successfully" };
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  async verifyEmail(token: string) {
    console.log("Verifying email with token:", token);
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET,
      });

      if (payload.type !== "email_verification") {
        throw new UnauthorizedException("Invalid token type");
      }

      const user = await this.userRepository.findOne({ where: { userId: payload.userId } });
      if (!user) throw new UnauthorizedException("Invalid token");

      if (user.verified) return { message: "Email already verified" };

      user.verified = true;
      await this.userRepository.save(user);

      return { message: "Email verified successfully" };
    } catch (error) {
      console.error("Email verification error:", error?.message || error);
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return { message: "If the email exists, a verification link has been sent" };
    if (user.verified) return { message: "Email is already verified" };

    const vPayload: Record<string, any> = { userId: user.userId, type: "email_verification" };
    const vToken = this.jwtService.sign(vPayload, {
      secret: process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET,
      expiresIn: ("24h" as any),
    });

    try {
      await this.emailService.sendVerificationEmail(user.email, vToken, user.firstName);
    } catch (err) {
      console.error("Error resending verification:", err?.message || err);
    }

    return { message: "Verification email resent successfully" };
  }
}

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

import { User, UserRole } from "../entities/user.entity";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { EmailService } from "../common/services/email.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @Inject(JwtService) private jwtService: JwtService,
    @Inject(EmailService) private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, nationalId, password, ...userData } = registerDto;

    if (!email || !nationalId || !password) {
      throw new ConflictException("All fields are required");
    }

    const emailVerify = await this.userRepository.findOneBy({ email });

    if (emailVerify) {
      throw new ConflictException("User already exists with this email");
    }

    const nationalIdVerify = await this.userRepository.findOneBy({
      nationalId,
    });

    if (nationalIdVerify) {
      throw new ConflictException("User already exists with this national ID");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      ...userData,
      email,
      nationalId,
      passwordHash: hashedPassword,
      // Use provided role when present, otherwise default to BUYER
      role: (userData as any).role ?? UserRole.BUYER,
    });

    await this.userRepository.save(user);

    const payload = { email: user.email, sub: user.userId, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        verified: user.verified,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    if (!email || !password) {
      throw new ConflictException("All fields are required");
    }

    const user = await this.userRepository.findOne({ where: { email } });
    const passwordCompare = await bcrypt.compare(
      password,
      user?.passwordHash || "",
    );

    if (!user || !passwordCompare) {
      throw new UnauthorizedException("INVALID_CREDENTIALS");
    }

    const payload = { email: user.email, sub: user.userId, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        verified: user.verified,
      },
    };
  }

  async validateUser(userId: number): Promise<User> {
    return this.userRepository.findOne({ where: { userId } });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: "If the email exists, a reset link has been sent" };
    }

    // Generate reset token
    const resetToken = this.jwtService.sign(
      { userId: user.userId, type: 'password_reset' },
      { expiresIn: '1h' }
    );

    // Send email with reset token
    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
      return { message: "If the email exists, a reset link has been sent" };
    } catch (error) {
      console.error('Error sending email:', error);
      return { message: "If the email exists, a reset link has been sent" };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userRepository.findOne({ 
        where: { userId: payload.userId } 
      });

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.passwordHash = hashedPassword;
      await this.userRepository.save(user);

      return { message: "Password reset successfully" };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

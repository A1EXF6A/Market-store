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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @Inject(JwtService) private jwtService: JwtService,
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
}

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";

import { User, UserRole } from "../entities/user.entity";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

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
      role: UserRole.BUYER,
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

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
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

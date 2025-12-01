import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { User, UserStatus, UserRole } from "../entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import * as bcrypt from "bcryptjs";

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(filters?: UserFilters): Promise<User[]> {
    const where: any = {};

    if (filters?.role) where.role = filters.role;
    if (filters?.status) where.status = filters.status;

    if (filters?.search) {
      where.firstName = Like(`%${filters.search}%`);
      // Si quieres que también busque por email/lastName:
      // return this.userRepository.find({
      //   where: [
      //     { firstName: Like(`%${filters.search}%`) },
      //     { lastName: Like(`%${filters.search}%`) },
      //     { email: Like(`%${filters.search}%`) },
      //   ],
      // });
    }

    return this.userRepository.find({ where, order: { createdAt: "DESC" } });
  }

  async findById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  async updateUser(userId: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);

    if (dto.email && dto.email !== user.email) {
      const exists = await this.findByEmail(dto.email);
      if (exists) throw new ConflictException("Email already in use");
    }

    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findById(userId);

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Current password is incorrect");

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);
  }

  async verifyUser(userId: number): Promise<User> {
    const user = await this.findById(userId);
    user.verified = true;
    return this.userRepository.save(user);
  }

    async updateUserStatus(
    userId: number,
    status: UserStatus,
    bannedUntil?: Date | null,
  ): Promise<User> {
    const user = await this.findById(userId);

    user.status = status;

    if (status === UserStatus.BANNED) {
      user.bannedUntil = bannedUntil ?? null; // null = definitivo
    } else {
      user.bannedUntil = null; // al activar o suspender, limpiamos el ban
    }

    return this.userRepository.save(user);
  }

  async updateUserRole(userId: number, role: UserRole): Promise<User> {
    const user = await this.findById(userId);
    user.role = role;
    return this.userRepository.save(user);
  }

  // =========================================================
  // ✅ NUEVO: CAMBIO DE ROL PARA EL MISMO USUARIO
  // Vendedor ⇄ Comprador
  // =========================================================
  async switchMyRole(userId: number, targetRole: UserRole): Promise<User> {
    const user = await this.findById(userId);

    // No permitir que admin/mod cambien su rol aquí
    if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
      throw new ForbiddenException("Admins/Moderators cannot change role here");
    }

    // Solo permitir buyer/seller
    if (![UserRole.BUYER, UserRole.SELLER].includes(targetRole)) {
      throw new ForbiddenException("Invalid target role");
    }

    user.role = targetRole;
    return this.userRepository.save(user);
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.findById(userId);
    await this.userRepository.remove(user);
  }
}

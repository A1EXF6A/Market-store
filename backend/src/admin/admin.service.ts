// src/admin/admin.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import * as bcrypt from 'bcryptjs';

// ⬅️ Usa SIEMPRE los enums exportados desde la entidad
import { User, UserRole, UserStatus } from '../entities/user.entity';

type CreateModeratorDto = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nationalId?: string;
};

@Injectable()
export class AdminService {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  async findAllUsers() {
    return this.userRepo.find({
      // ⬅️ Usa los nombres de PROPIEDAD de la entidad (camelCase)
      select: ['userId', 'firstName', 'lastName', 'email', 'role', 'status', 'verified', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async createModerator(dto: CreateModeratorDto) {
    const { email, password, firstName, lastName } = dto;

    // 1) Email único
    const existsByEmail = await this.userRepo.findOne({ where: { email } });
    if (existsByEmail) throw new ConflictException('Email already exists');

    // 2) nationalId único (la columna es unique)
    //    Si no lo envían, genero uno corto y único que respete el length(20)
    const nationalId = dto.nationalId ?? `MOD${Date.now()}`; // p.ej. "MOD1731438123456"
    const existsByNationalId = await this.userRepo.findOne({ where: { nationalId } });
    if (existsByNationalId) throw new ConflictException('National ID already exists');

    const passwordHash = await bcrypt.hash(password, 10);

    const userData: DeepPartial<User> = {
      email,
      firstName,
      lastName,
      nationalId,
      passwordHash,
      role: UserRole.MODERATOR,
      status: UserStatus.ACTIVE,
      verified: true, // puedes dejarlo en true si el admin crea moderadores ya verificados
    };

    const user = this.userRepo.create(userData);
    await this.userRepo.save(user);

    return { message: 'Moderator created successfully' };
  }

  async toggleUserStatus(userId: number) {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('User not found');

    user.status =
      user.status === UserStatus.ACTIVE ? UserStatus.SUSPENDED : UserStatus.ACTIVE;

    await this.userRepo.save(user);

    return {
      message: `User ${user.status === UserStatus.ACTIVE ? 'activated' : 'suspended'}`,
    };
  }
}

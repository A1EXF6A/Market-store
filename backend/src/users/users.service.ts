import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from "@nestjs/common";
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

  async findById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findAll(filters?: UserFilters): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (filters?.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.status) {
      queryBuilder.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    queryBuilder.orderBy('user.createdAt', 'DESC');
    
    return queryBuilder.getMany();
  }

  async updateUserStatus(
    userId: number,
    status: UserStatus,
    suspendedUntil?: string,
  ): Promise<User> {
    const user = await this.findById(userId);
    user.status = status;

    if (status === UserStatus.SUSPENDED && suspendedUntil) {
      // parse ISO string to Date
      const dt = new Date(suspendedUntil);
      if (isNaN(dt.getTime())) {
        // invalid date string, ignore and keep null
        user.suspendedUntil = null;
      } else {
        user.suspendedUntil = dt;
      }
    } else {
      // clear suspension when setting other statuses
      user.suspendedUntil = null;
    }

    return this.userRepository.save(user);
  }

  async verifyUser(userId: number): Promise<User> {
    const user = await this.findById(userId);
    user.verified = true;
    return this.userRepository.save(user);
  }

  async updateUser(userId: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);
    
    // Check if email is being updated and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({ 
        where: { email: updateUserDto.email } 
      });
      if (existingUser) {
        throw new ConflictException("Email already in use");
      }
    }

    // Update user fields
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.findById(userId);
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash
    );
    
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.passwordHash = hashedNewPassword;
    await this.userRepository.save(user);
  }

  async updateUserRole(userId: number, role: UserRole): Promise<User> {
    const user = await this.findById(userId);
    user.role = role;
    return this.userRepository.save(user);
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.findById(userId);
    await this.userRepository.remove(user);
  }
}

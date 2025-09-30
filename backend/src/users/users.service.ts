import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserStatus } from "../entities/user.entity";

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

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async updateUserStatus(userId: number, status: UserStatus): Promise<User> {
    const user = await this.findById(userId);
    user.status = status;
    return this.userRepository.save(user);
  }

  async verifyUser(userId: number): Promise<User> {
    const user = await this.findById(userId);
    user.verified = true;
    return this.userRepository.save(user);
  }
}

// src/admin/admin.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';

import { AdminService } from './admin.service';

// Si tus decorators/guards están en common (según tu zip):
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

// Opción A: si sigues usando los enums en auth/enums:
import { UserRole } from '../auth/enums/user-role.enum';
// Opción B (recomendada): si moviste los enums a la entidad:
// import { UserRole } from '../entities/user.entity';

// Recomendado: DTO para crear moderador
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
class CreateModeratorDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  nationalId?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GET /admin/users
  @Get('users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  // POST /admin/moderators
  @Post('moderators')
  createModerator(@Body() body: CreateModeratorDto) {
    return this.adminService.createModerator(body);
  }

  // PATCH /admin/users/:id/toggle-status
  @Patch('users/:id/toggle-status')
  toggleUserStatus(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.toggleUserStatus(id);
  }
}

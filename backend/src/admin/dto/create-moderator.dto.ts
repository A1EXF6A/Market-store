// src/admin/dto/create-moderator.dto.ts
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateModeratorDto {
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

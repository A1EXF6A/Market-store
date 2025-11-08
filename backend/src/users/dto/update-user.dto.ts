import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
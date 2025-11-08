import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from "class-validator";
import { UserGender } from "../../entities/user.entity";

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;
  
  @IsString()
  role?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(UserGender)
  @IsOptional()
  gender?: UserGender;

  @IsString()
  @MinLength(8)
  password: string;
}

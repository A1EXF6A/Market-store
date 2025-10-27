import { IsEnum, IsOptional, IsString } from "class-validator";
import { UserStatus } from "../../entities/user.entity";

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;

  // ISO date string or omitted for indefinite suspension handling in backend
  @IsOptional()
  @IsString()
  suspendedUntil?: string;
}

import { IsEnum, IsOptional, IsString } from "class-validator";
import { ItemStatus } from "../../entities/enums"; // Debe contener: 'active' | 'suspended' | 'hidden' | 'pending' | 'banned'

export class UpdateProductStatusDto {
  @IsEnum(ItemStatus)
  status: ItemStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

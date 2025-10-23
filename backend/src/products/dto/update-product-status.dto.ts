import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ItemStatus } from '../../entities/enums';

export class UpdateProductStatusDto {
  @IsEnum(ItemStatus)
  status: ItemStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
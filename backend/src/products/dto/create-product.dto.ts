import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayMaxSize,
  IsBoolean,
} from "class-validator";
import { Transform } from "class-transformer";
import { ItemType } from "../../entities/enums";

export class CreateProductDto {
  @IsEnum(ItemType)
  type: ItemType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

   @IsNumber()
   @IsOptional()
   @Transform(({ value }) => value ? parseFloat(value) : undefined)
   price?: number;

  @IsString()
  @IsOptional()
  location?: string;

   @IsBoolean()
   @IsOptional()
   @Transform(({ value }) => value === 'true')
   availability?: boolean;

   @IsString()
   @IsOptional()
   workingHours?: string;
}

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
  price?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsBoolean()
  @IsOptional()
  availability?: boolean;

  @IsArray()
  @ArrayMaxSize(5)
  @IsOptional()
  photos?: string[];

  @IsString()
  @IsOptional()
  workingHours?: string;
}

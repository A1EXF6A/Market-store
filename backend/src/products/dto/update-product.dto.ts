import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayMaxSize,
  IsBoolean,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { PartialType } from "@nestjs/mapped-types";
import { CreateProductDto } from "./create-product.dto";
import { ItemType } from "../../entities/enums";

/**
 * Hereda de CreateProductDto, pero todos los campos son opcionales.
 * Se añaden campos propios de update (ej. removedImages).
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  // "59.99" → 59.99
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const v = value.trim().toLowerCase();
      if (v === "true" || v === "1") return true;
      if (v === "false" || v === "0") return false;
    }
    return undefined;
  })
  availability?: boolean;

  @IsOptional()
  @IsString()
  workingHours?: string;

  @IsOptional()
  @IsString()
  code?: string;

  /**
   * Imágenes a eliminar. Acepta:
   * - Array: ["url1","url2"]
   * - String único: "url1"  → lo transformamos a ["url1"]
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim().length > 0) return [value];
    return undefined;
  })
  removedImages?: string[];
}

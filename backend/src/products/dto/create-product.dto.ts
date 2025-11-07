import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ItemType } from "../../entities/enums"; // Debe contener 'product' | 'service'

/**
 * Nota:
 * - Los campos enviados por multipart/form-data llegan como string.
 * - Usamos Transform/Type para convertir a number/boolean según corresponda.
 */
export class CreateProductDto {
  @IsEnum(ItemType)
  type: ItemType; // 'product' | 'service'

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  // price puede llegar como "59.99" → convertir a number
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsString()
  @IsOptional()
  location?: string;

  // availability puede llegar como "true"/"false"/1/0 → convertir a boolean
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

  // Requerido si type === 'service' (valídalo en el service)
  @IsString()
  @IsOptional()
  workingHours?: string;

  // Opcional: tu migración exige code NOT NULL; si no lo mandas desde el front,
  // GENÉRALO en el service antes de guardar.
  @IsString()
  @IsOptional()
  code?: string;
}

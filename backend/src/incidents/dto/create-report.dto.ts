import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
} from "class-validator";
import { Type } from "class-transformer";
import { ReportType } from "../../entities/report.entity";

export class CreateReportDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  itemId: number;

  @IsEnum(ReportType)
  type: ReportType;

  @IsString()
  @IsOptional()
  comment?: string;
}

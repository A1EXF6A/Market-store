import { IsEnum, IsNotEmpty, IsString, IsOptional } from "class-validator";
import { ReportType } from "../../entities/report.entity";

export class CreateReportDto {
  @IsNotEmpty()
  itemId: number;

  @IsEnum(ReportType)
  type: ReportType;

  @IsString()
  @IsOptional()
  comment?: string;
}

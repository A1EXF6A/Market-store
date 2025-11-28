import { IsOptional, IsString } from "class-validator";

export class CreateIncidentFromReportDto {
  @IsOptional()
  @IsString()
  description?: string;
}

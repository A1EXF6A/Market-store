import { IsString, IsNotEmpty, IsInt } from "class-validator";
import { Type } from "class-transformer";

export class CreateAppealDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  incidentId: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

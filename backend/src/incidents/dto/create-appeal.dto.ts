import { IsString, IsNotEmpty } from "class-validator";

export class CreateAppealDto {
  @IsNotEmpty()
  incidentId: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

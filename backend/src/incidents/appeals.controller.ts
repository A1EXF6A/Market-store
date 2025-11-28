import { Controller, Get, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { IncidentsService } from "./incidents.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { GetUser } from "../common/decorators/get-user.decorator";
import { User, UserRole } from "../entities/user.entity";

@Controller("appeals")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppealsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  getAppeals() {
    return this.incidentsService.getAppeals();
  }

  @Patch(":id")
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  reviewAppeal(@Param("id") id: string, @Body("approved") approved: boolean, @GetUser() user: User) {
    return this.incidentsService.reviewAppeal(+id, !!approved, user.userId);
  }
}

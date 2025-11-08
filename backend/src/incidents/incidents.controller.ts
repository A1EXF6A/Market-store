import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from "@nestjs/common";
import { IncidentsService, IncidentFilters } from "./incidents.service";
import { CreateReportDto } from "./dto/create-report.dto";
import { CreateAppealDto } from "./dto/create-appeal.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { GetUser } from "../common/decorators/get-user.decorator";
import { User, UserRole } from "../entities/user.entity";
import { ItemStatus } from "../entities/enums";

@Controller("incidents")
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post("reports")
  @UseGuards(RolesGuard)
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  createReport(
    @Body() createReportDto: CreateReportDto,
    @GetUser() user: User,
  ) {
    return this.incidentsService.createReport(createReportDto, user.userId);
  }

  @Post("appeals")
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  createAppeal(
    @Body() createAppealDto: CreateAppealDto,
    @GetUser() user: User,
  ) {
    return this.incidentsService.createAppeal(createAppealDto, user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  getIncidents(@Query() filters: any) {
    return this.incidentsService.getIncidents(filters);
  }

  @Get("reports")
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  getReports(@Query() filters: any) {
    return this.incidentsService.getReports(filters);
  }

  @Get("my-incidents")
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  getMyIncidents(@GetUser() user: User) {
    return this.incidentsService.getSellerIncidents(user.userId);
  }

  @Patch(":id/assign")
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  assignModerator(@Param("id") id: string, @GetUser() user: User) {
    return this.incidentsService.assignModerator(+id, user.userId);
  }

  @Patch(":id/resolve")
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  resolveIncident(
    @Param("id") id: string,
    @Body("status") status: ItemStatus,
    @GetUser() user: User,
  ) {
    return this.incidentsService.resolveIncident(+id, status, user.userId);
  }
}

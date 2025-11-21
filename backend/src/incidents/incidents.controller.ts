// src/incidents/incidents.controller.ts
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
import { IncidentsService } from "./incidents.service";
import { CreateReportDto } from "./dto/create-report.dto";
import { CreateAppealDto } from "./dto/create-appeal.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { GetUser } from "../common/decorators/get-user.decorator";
import { User, UserRole } from "../entities/user.entity";
import { IncidentStatus, ItemStatus } from "../entities/enums";

@Controller("incidents")
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  /* ========== Comprador: crear reporte ========== */
  @Post("reports")
  @UseGuards(RolesGuard)
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  createReport(
    @Body() createReportDto: CreateReportDto,
    @GetUser() user: User,
  ) {
    return this.incidentsService.createReport(createReportDto, user.userId);
  }

  /* ========== Vendedor: crear apelación ========== */
  @Post("appeals")
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  createAppeal(
    @Body() createAppealDto: CreateAppealDto,
    @GetUser() user: User,
  ) {
    return this.incidentsService.createAppeal(createAppealDto, user.userId);
  }

  /* ========== Moderador/Admin: listar incidencias ========== */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  getIncidents(@Query() filters: any) {
    return this.incidentsService.getIncidents(filters);
  }

  /* ========== Moderador/Admin: listar reportes de compradores ========== */
  @Get("reports")
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  getReports(@Query() filters: any) {
    return this.incidentsService.getReports(filters);
  }

  /* ========== Vendedor: ver sus incidencias ========== */
  @Get("my-incidents")
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  getMyIncidents(@GetUser() user: User) {
    return this.incidentsService.getSellerIncidents(user.userId);
  }

  /* ========== Moderador/Admin: tomar incidente (asignarse) ========== */
  @Patch(":id/assign")
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  assignModerator(@Param("id") id: string, @GetUser() user: User) {
    return this.incidentsService.assignModerator(+id, user.userId);
  }

  /* ========== Moderador/Admin: resolver incidente ========== */
  @Patch(":id/resolve")
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  resolveIncident(
    @Param("id") id: string,
    @Body()
    body: {
      incidentStatus: IncidentStatus; // "resolved" | "rejected" | ...
      itemStatus?: ItemStatus;        // "banned" | "active" | "hidden"...
    },
    @GetUser() user: User,
  ) {
    return this.incidentsService.resolveIncident(
      +id,
      body.incidentStatus,
      user.userId,
      body.itemStatus,
    );
  }
}

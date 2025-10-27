import { Controller, Get, UseGuards } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { GetUser } from "../common/decorators/get-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { User, UserRole } from "../entities/user.entity";

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("buyer-stats")
  @UseGuards(RolesGuard)
  @Roles(UserRole.BUYER)
  getBuyerStats(@GetUser() user: User) {
    return this.dashboardService.getBuyerStats(user.userId);
  }

  @Get("seller-stats")
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  getSellerStats(@GetUser() user: User) {
    return this.dashboardService.getSellerStats(user.userId);
  }

  @Get("admin-stats")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  getAdminStats() {
    return this.dashboardService.getAdminStats();
  }
}
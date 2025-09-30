import { Controller, Get, Param, Patch, Body, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole, UserStatus } from "../entities/user.entity";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findById(+id);
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  updateStatus(@Param("id") id: string, @Body("status") status: UserStatus) {
    return this.usersService.updateUserStatus(+id, status);
  }

  @Patch(":id/verify")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  verifyUser(@Param("id") id: string) {
    return this.usersService.verifyUser(+id);
  }
}

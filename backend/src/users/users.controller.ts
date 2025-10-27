import { Controller, Get, Param, Patch, Body, UseGuards, Put, Delete, Query } from "@nestjs/common";
import { UsersService, UserFilters } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { GetUser } from "../common/decorators/get-user.decorator";
import { UserRole, UserStatus, User } from "../entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  findAll(@Query() query: any) {
    const filters: UserFilters = {
      role: query.role,
      status: query.status,
      search: query.search
    };
    return this.usersService.findAll(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findById(+id);
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  updateStatus(
    @Param("id") id: string,
    @Body() body: { status: UserStatus; suspendedUntil?: string },
  ) {
    return this.usersService.updateUserStatus(
      +id,
      body.status,
      body.suspendedUntil,
    );
  }

  @Patch(":id/verify")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  verifyUser(@Param("id") id: string) {
    return this.usersService.verifyUser(+id);
  }

  @Put("profile")
  updateProfile(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(user.userId, updateUserDto);
  }

  @Patch("change-password")
  async changePassword(@GetUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
    await this.usersService.changePassword(user.userId, changePasswordDto);
    return { message: "Password changed successfully" };
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateUser(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(+id, updateUserDto);
  }

  @Patch(":id/role")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateRole(@Param("id") id: string, @Body("role") role: UserRole) {
    return this.usersService.updateUserRole(+id, role);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param("id") id: string) {
    await this.usersService.deleteUser(+id);
    return { message: "User deleted successfully" };
  }
}

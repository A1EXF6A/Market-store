import { Controller, Get, Param, Req, Patch, Body, UseGuards, Put, Delete, Query,   BadRequestException, ForbiddenException } from "@nestjs/common";
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
  constructor(private usersService: UsersService) { }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  findAll(@Query() query: any) {
    const filters: UserFilters = {
      role: query.role,
      status: query.status,
      search: query.search,
      showDeleted: query.showDeleted === "true",
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
    @Body("status") status: UserStatus,
    @Body("suspendedUntil") suspendedUntil?: string,
  ) {
    const until = suspendedUntil ? new Date(suspendedUntil) : null;
    return this.usersService.updateUserStatus(+id, status, until);
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
  @Patch('me')
  @UseGuards(JwtAuthGuard,) // solo autenticados
  async updateMe(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.userId;
    const userEmail = req.user.email;
    if (!userId || !userEmail||userEmail!==updateUserDto.email) {
      throw new BadRequestException('Usuario no autenticado correctamente');
    }
    console.log("Authenticated user ID:", updateUserDto);
    // Impedir que usuarios normales intenten cambiar role o status desde /me
    // (si quieres permitirlo para admins, tendrías que verificar el role)
    const dto = { ...updateUserDto } as any;
    if (dto.role) delete dto.role;
    if (dto.status) delete dto.status;

    // Dejar que el servicio haga la comprobación de email (conflictos) como ya tienes
    return this.usersService.updateUser(userId, dto);
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
  async deleteUser(@Param("id") id: string, @GetUser() actor?: User) {
    const targetId = +id;
    // allow admin or the user themself
    if (!actor) throw new ForbiddenException("Not authorized");
    if (actor.role !== UserRole.ADMIN && actor.userId !== targetId) {
      throw new ForbiddenException("Insufficient permissions to delete this user");
    }

    await this.usersService.deleteUser(targetId);
    // if the actor deleted their own account, return a message client can act on
    return { message: "User deleted successfully" };
  }
}
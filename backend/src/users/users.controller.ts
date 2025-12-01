import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  Put,
  Delete,
  Query,
} from "@nestjs/common";
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

  // =========================
  // ADMIN/MOD: LISTAR USUARIOS
  // =========================
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  findAll(@Query() query: any) {
    const filters: UserFilters = {
      role: query.role,
      status: query.status,
      search: query.search,
    };
    return this.usersService.findAll(filters);
  }

  // =========================
  // PERFIL PROPIO (EDITAR)
  // =========================
  @Put("profile")
  updateProfile(@GetUser() user: User, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(user.userId, dto);
  }

  // =========================
  // CAMBIAR CONTRASEÑA PROPIA
  // =========================
  @Patch("change-password")
  changePassword(@GetUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.userId, dto);
  }

  // =========================
  // ✅ NUEVO: CAMBIAR ROL PROPIO BUYER/SELLER
  // =========================
  @Patch("me/role")
  switchMyRole(
    @GetUser() user: User,
    @Body("role") role: UserRole,
  ) {
    return this.usersService.switchMyRole(user.userId, role);
  }

  // =========================
  // ADMIN: VERIFY
  // =========================
  @Patch(":id/verify")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  verifyUser(@Param("id") id: string) {
    return this.usersService.verifyUser(+id);
  }

  // =========================
  // ADMIN: SUSPENDER/ACTIVAR
  // =========================
   @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param("id") id: string,
    @Body("status") status: UserStatus,
    @Body("bannedUntil") bannedUntil?: string,
  ) {
    return this.usersService.updateUserStatus(
      +id,
      status,
      bannedUntil ? new Date(bannedUntil) : null,
    );
  }


  // =========================
  // ADMIN: CAMBIAR ROL A OTRO USUARIO
  // =========================
  @Patch(":id/role")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateRole(@Param("id") id: string, @Body("role") role: UserRole) {
    return this.usersService.updateUserRole(+id, role);
  }

  // =========================
  // ADMIN: ELIMINAR
  // =========================
  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param("id") id: string) {
    await this.usersService.deleteUser(+id);
    return { message: "User deleted successfully" };
  }

  // =========================
  // GET USER BY ID (ADMIN/MOD)
  // =========================
  @Get(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  findById(@Param("id") id: string) {
    return this.usersService.findById(+id);
  }
}

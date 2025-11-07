import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Inject,
  Query,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { GetUser } from "../common/decorators/get-user.decorator";
import { User } from "../entities/user.entity";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  // Registro de usuario
  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // Login
  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Perfil autenticado
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@GetUser() user: User) {
    return {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      verified: user.verified,
    };
  }

  // Recuperar contraseña (envía email)
  @Post("forgot-password")
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  // Resetear contraseña (usa token del email)
  @Post("reset-password")
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  // ✅ Verificar email (GET con token por query)
  @Get("verify-email")
  async verifyEmail(@Query("token") token: string) {
    return this.authService.verifyEmail(token);
  }

  // Reenviar email de verificación
  @Post("resend-verification")
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    return this.authService.resendVerificationEmail(
      resendVerificationDto.email,
    );
  }
}

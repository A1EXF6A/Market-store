import { Controller, Post, Body, UseGuards, Get, Inject } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { GetUser } from "../common/decorators/get-user.decorator";
import { User } from "../entities/user.entity";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

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
}

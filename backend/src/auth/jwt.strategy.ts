import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../users/users.service";
import { UserStatus } from "../entities/user.entity";
import env from "../config/env";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(UsersService) private usersService: UsersService) {

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.jwt.secret,
    });


  }

  async validate(payload: any) {
    console.log('Payload JWT:', payload);
    console.log('UsersService inyectado:', this.usersService);
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    // Enforce suspension at token validation time.
    if (user.status === "suspended" || user.status === (user as any).SUSPENDED) {
      if (user.suspendedUntil) {
        const now = new Date();
        if (now > new Date(user.suspendedUntil)) {
          // Reactivate automatically
          await this.usersService.updateUserStatus(user.userId, UserStatus.ACTIVE);
          user.status = UserStatus.ACTIVE as any;
        } else {
          throw new UnauthorizedException("ACCOUNT_SUSPENDED");
        }
      } else {
        throw new UnauthorizedException("ACCOUNT_SUSPENDED");
      }
    }

    if (user.status === "banned") {
      throw new UnauthorizedException("ACCOUNT_BANNED");
    }

    return user;
  }
}

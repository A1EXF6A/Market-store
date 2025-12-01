import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../users/users.service";
import { UserStatus } from "../entities/user.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(UsersService) private usersService: UsersService) {

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "your-secret-key",
    });


  }

 async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.status === UserStatus.BANNED) {
      const now = new Date();

      if (user.bannedUntil && user.bannedUntil > now) {
        throw new UnauthorizedException(
          `User banned until ${user.bannedUntil.toISOString()}`,
        );
      }

      if (!user.bannedUntil) {
        throw new UnauthorizedException("User permanently banned");
      }
    }

    return user;
  }
}

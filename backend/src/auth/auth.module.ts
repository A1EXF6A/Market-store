import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

import env from "src/config/env";
import { User } from "../entities/user.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { UsersModule } from '../users/users.module';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: env.jwt.secret || "your-secret-key",
      signOptions: { expiresIn: "24h" },
    }),
    MailerModule.forRoot({
      transport: env.email.user 
        ? {
            host: env.email.host,
            port: env.email.port,
            secure: false,
            auth: {
              user: env.email.user,
              pass: env.email.pass,
            },
          }
        : {
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: 'ethereal.user',
              pass: 'ethereal.pass',
            },
          },
      defaults: {
        from: env.email.from || 'test@example.com',
      },
      template: {
        dir: join(process.cwd(), 'dist', 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy, EmailService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule { }

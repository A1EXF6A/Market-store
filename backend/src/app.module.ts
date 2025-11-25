import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "./auth/auth.module";
import { ChatModule } from "./chat/chat.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { IncidentsModule } from "./incidents/incidents.module";
import { ProductsModule } from "./products/products.module";
import { UsersModule } from "./users/users.module";

import AppDataSource from "./data-source";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
      autoLoadEntities: true,

      // ✅ SOLO DEV: actualiza BD con resolved_at y relaciones
      synchronize: true,
    }),
    PassportModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    IncidentsModule,
    ChatModule,
    DashboardModule,
  ],
})
export class AppModule {}

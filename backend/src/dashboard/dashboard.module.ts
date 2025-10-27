import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { User } from "../entities/user.entity";
import { Item } from "../entities/item.entity";
import { Favorite } from "../entities/favorite.entity";
import { Chat } from "../entities/chat.entity";
import { Report } from "../entities/report.entity";
import { Incident } from "../entities/incident.entity";
import { Rating } from "../entities/rating.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Item,
      Favorite,
      Chat,
      Report,
      Incident,
      Rating,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
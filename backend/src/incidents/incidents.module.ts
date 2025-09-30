import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IncidentsService } from "./incidents.service";
import { IncidentsController } from "./incidents.controller";
import { Incident } from "../entities/incident.entity";
import { Report } from "../entities/report.entity";
import { Appeal } from "../entities/appeal.entity";
import { Item } from "../entities/item.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Incident, Report, Appeal, Item])],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}

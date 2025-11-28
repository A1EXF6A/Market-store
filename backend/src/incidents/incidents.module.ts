import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IncidentsService } from "./incidents.service";
import { IncidentsController } from "./incidents.controller";
import { AppealsController } from "./appeals.controller";
import { Incident } from "../entities/incident.entity";
import { Report } from "../entities/report.entity";
import { Appeal } from "../entities/appeal.entity";
import { Item } from "../entities/item.entity";
import { User } from "../entities/user.entity";
import { ProductsModule } from "../products/products.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Incident, Report, Appeal, Item, User]),
    forwardRef(() => ProductsModule)
  ],
  controllers: [IncidentsController, AppealsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}

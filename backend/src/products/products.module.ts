import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { Item } from "../entities/item.entity";
import { ItemPhoto } from "../entities/item-photo.entity";
import { Service } from "../entities/service.entity";
import { Favorite } from "../entities/favorite.entity";
import { AuthModule } from "../auth/auth.module";
import { IncidentsModule } from "../incidents/incidents.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, ItemPhoto, Service, Favorite]), 
    AuthModule,
    forwardRef(() => IncidentsModule)
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

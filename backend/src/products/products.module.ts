import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { Item } from "../entities/item.entity";
import { ItemPhoto } from "../entities/item-photo.entity";
import { Service } from "../entities/service.entity";
import { Favorite } from "../entities/favorite.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Item, ItemPhoto, Service, Favorite])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

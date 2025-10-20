import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Inject,
  Req,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { GetUser } from "../common/decorators/get-user.decorator";
import { User, UserRole } from "../entities/user.entity";

@Controller("products")
export class ProductsController {
  constructor(
    @Inject(ProductsService) private readonly productsService: ProductsService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 5 }]))
  create(@Body() createProductDto: CreateProductDto, @UploadedFiles() files: { images?: Express.Multer.File[] }, @GetUser() user: User) {
    return this.productsService.create(createProductDto, files, user.userId);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.productsService.findAll(filters);
  }

  @Get("my-products")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  findMyProducts(@GetUser() user: User) {
    return this.productsService.findBySeller(user.userId);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  getFavorites(@Req() req) {
    return this.productsService.getFavorites(req.user.userId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 5 }]))
  update(
    @Param("id") id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @GetUser() user: User,
  ) {
    return this.productsService.update(+id, updateProductDto, files, user);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  remove(@Param("id") id: string, @GetUser() user: User) {
    return this.productsService.remove(+id, user);
  }

  @Post(":id/favorite")
  @UseGuards(JwtAuthGuard)
  toggleFavorite(@Param("id") id: string, @GetUser() user: User) {
    return this.productsService.toggleFavorite(+id, user.userId);
  }
}

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
} from "@nestjs/common";
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
  create(@Body() createProductDto: CreateProductDto, @GetUser() user: User) {
    return this.productsService.create(createProductDto, user.userId);
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

  // Endpoint protegido para favoritos del usuario autenticado
  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  getFavorites(@Req() req) {
    console.log('Headers:', req.headers);
    console.log('Usuario autenticado:', req.user);
    console.log('Usuario autenticado:', req.user);
    return this.productsService.getFavorites(req.user.id);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  update(
    @Param("id") id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: User,
  ) {
    return this.productsService.update(+id, updateProductDto, user);
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

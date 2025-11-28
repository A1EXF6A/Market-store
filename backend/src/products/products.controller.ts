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
  ForbiddenException,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { UpdateProductStatusDto } from "./dto/update-product-status.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtService } from "@nestjs/jwt";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { GetUser } from "../common/decorators/get-user.decorator";
import { User, UserRole } from "../entities/user.entity";
import { composeLog } from "testcontainers/build/common";

@Controller("products")
export class ProductsController {
  constructor(
    @Inject(ProductsService) private readonly productsService: ProductsService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @UseInterceptors(FileFieldsInterceptor([{ name: "images", maxCount: 5 }]))
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @GetUser() user: User,
  ) {
    return this.productsService.create(createProductDto, files, user.userId);
  }

  @Get()
  findAll(@Query() filters: any, @Req() req) {
    // Si se solicita filtrar por 'status', validar que el request tenga
    // un JWT válido y que el usuario sea ADMIN o MODERATOR
    if (filters?.status) {
      const authHeader = req.headers?.authorization;
      if (!authHeader) {
        throw new ForbiddenException(
          'Only admins and moderators can filter by status',
        );
      }

      const token = authHeader.split(" ")[1];
      try {
        const payload: any = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });

        if (payload.role !== UserRole.ADMIN && payload.role !== UserRole.MODERATOR) {
          throw new ForbiddenException(
            'Only admins and moderators can filter by status',
          );
        }
      } catch (err) {
        throw new ForbiddenException('Invalid token or insufficient permissions');
      }
    }

    return this.productsService.findAll(filters);
  }

  @Get("my-products")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  findMyProducts(@GetUser() user: User) {
    return this.productsService.findBySeller(user.userId);
  }

  @Get("favorites")
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
  @UseInterceptors(FileFieldsInterceptor([{ name: "images", maxCount: 5 }]))
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

  @Patch(":id/availability")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  markAsSold(@Param("id") id: string, @Body("available") available: boolean) {
    console.log(`Toggling availability for product ${id} to ${available}`);
    return this.productsService.toggleAvailability(+id, available);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  updateStatus(
    @Param("id") id: string,
    @Body() updateStatusDto: UpdateProductStatusDto,
  ) {
    return this.productsService.updateStatus(+id, updateStatusDto.status, updateStatusDto.reason);
  }
}

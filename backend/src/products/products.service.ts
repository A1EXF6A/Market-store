import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Favorite } from "src/entities/favorite.entity";
import { ItemPhoto } from "src/entities/item-photo.entity";
import { ItemStatus, ItemType } from "../entities/enums";
import { Service } from "src/entities/service.entity";
import { User } from "src/entities/user.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Item } from "src/entities/item.entity";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    @InjectRepository(ItemPhoto)
    private photoRepository: Repository<ItemPhoto>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    sellerId: number,
  ): Promise<Item> {
    const { photos, workingHours, ...itemData } = createProductDto;

    const code = await this.generateUniqueCode();

    const item = this.itemRepository.create({
      ...itemData,
      code,
      sellerId,
      status: this.detectProhibitedContent(itemData.name, itemData.description)
        ? ItemStatus.PENDING
        : ItemStatus.ACTIVE,
    });

    const savedItem = await this.itemRepository.save(item);

    if (photos && photos.length > 0) {
      const photoEntities = photos.map((url) =>
        this.photoRepository.create({ itemId: savedItem.itemId, url }),
      );
      await this.photoRepository.save(photoEntities);
    }

    if (createProductDto.type === ItemType.SERVICE && workingHours) {
      const service = this.serviceRepository.create({
        itemId: savedItem.itemId,
        workingHours,
      });
      await this.serviceRepository.save(service);
    }

    return this.findOne(savedItem.itemId);
  }

  async findAll(filters?: any): Promise<Item[]> {
    const queryBuilder = this.itemRepository
      .createQueryBuilder("item")
      .leftJoinAndSelect("item.seller", "seller")
      .leftJoinAndSelect("item.photos", "photos")
      .leftJoinAndSelect("item.service", "service")
      .where("item.status = :status", { status: ItemStatus.ACTIVE });

    if (filters?.type) {
      queryBuilder.andWhere("item.type = :type", { type: filters.type });
    }

    if (filters?.minPrice) {
      queryBuilder.andWhere("item.price >= :minPrice", {
        minPrice: filters.minPrice,
      });
    }

    if (filters?.maxPrice) {
      queryBuilder.andWhere("item.price <= :maxPrice", {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters?.location) {
      queryBuilder.andWhere("item.location ILIKE :location", {
        location: `%${filters.location}%`,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Item> {
    const item = await this.itemRepository.findOne({
      where: { itemId: id },
      relations: ["seller", "photos", "service"],
    });

    if (!item) {
      throw new NotFoundException("Product not found");
    }

    return item;
  }

  async findBySeller(sellerId: number): Promise<Item[]> {
    return this.itemRepository.find({
      where: { sellerId },
      relations: ["photos", "service"],
    });
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    user: User,
  ): Promise<Item> {
    const item = await this.findOne(id);

    if (item.sellerId !== user.userId) {
      throw new ForbiddenException("You can only update your own products");
    }

    const { photos, workingHours, ...updateData } = updateProductDto;

    await this.itemRepository.update(id, updateData);

    if (photos) {
      await this.photoRepository.delete({ itemId: id });
      if (photos.length > 0) {
        const photoEntities = photos.map((url) =>
          this.photoRepository.create({ itemId: id, url }),
        );
        await this.photoRepository.save(photoEntities);
      }
    }

    if (item.type === ItemType.SERVICE && workingHours) {
      await this.serviceRepository.upsert({ itemId: id, workingHours }, [
        "itemId",
      ]);
    }

    return this.findOne(id);
  }

  async remove(id: number, user: User): Promise<void> {
    const item = await this.findOne(id);

    if (item.sellerId !== user.userId) {
      throw new ForbiddenException("You can only delete your own products");
    }

    if (item.status === ItemStatus.BANNED) {
      throw new ForbiddenException("Banned products cannot be deleted");
    }

    await this.itemRepository.delete(id);
  }

  async toggleFavorite(
    itemId: number,
    userId: number,
  ): Promise<{ isFavorite: boolean }> {
    const existing = await this.favoriteRepository.findOne({
      where: { itemId, userId },
    });

    if (existing) {
      await this.favoriteRepository.delete({ itemId, userId });
      return { isFavorite: false };
    } else {
      await this.favoriteRepository.save({ itemId, userId });
      return { isFavorite: true };
    }
  }

  async getFavorites(userId: number): Promise<Item[]> {
    const favorites = await this.favoriteRepository.find({
      where: { userId },
      relations: ["item", "item.seller", "item.photos"],
    });

    return favorites.map((fav) => fav.item);
  }

  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
      code = `P${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const existing = await this.itemRepository.findOne({ where: { code } });
      exists = !!existing;
    }

    return code;
  }

  private detectProhibitedContent(name: string, description?: string): boolean {
    const prohibitedWords = [
      "arma",
      "droga",
      "explosivo",
      "ilegal",
      "robado",
      "falsificado",
      "weapon",
      "drug",
      "explosive",
      "illegal",
      "stolen",
      "fake",
    ];

    const content = `${name} ${description || ""}`.toLowerCase();
    return prohibitedWords.some((word) => content.includes(word));
  }
}

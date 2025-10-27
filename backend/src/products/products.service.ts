import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Favorite } from "src/entities/favorite.entity";
import { ItemPhoto } from "src/entities/item-photo.entity";
import { ItemStatus, ItemType } from "../entities/enums";
import { Service } from "src/entities/service.entity";
import { User } from "src/entities/user.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Item } from "src/entities/item.entity";
import { IncidentsService } from "../incidents/incidents.service";
import * as fs from "fs";
import * as path from "path";

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
    @Inject(forwardRef(() => IncidentsService))
    private incidentsService: IncidentsService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    files: { images?: Express.Multer.File[] },
    sellerId: number,
  ): Promise<Item> {
    const { workingHours, ...itemData } = createProductDto;

    const code = await this.generateUniqueCode();

    const isDangerous = this.detectProhibitedContent(itemData.name, itemData.description);
    
    const item = this.itemRepository.create({
      ...itemData,
      code,
      sellerId,
      status: isDangerous ? ItemStatus.PENDING : ItemStatus.ACTIVE,
    });

    const savedItem = await this.itemRepository.save(item);

    // Automatically create incident if dangerous content is detected
    if (isDangerous) {
      await this.incidentsService.createIncident(
        savedItem.itemId,
        `Producto detectado automáticamente como potencialmente peligroso. Palabras detectadas en: "${itemData.name}" ${itemData.description ? `- "${itemData.description}"` : ''}`,
      );
    }

    if (files.images && files.images.length > 0) {
      const photoUrls = await this.saveImages(files.images);
      const photoEntities = photoUrls.map((url) =>
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
      .leftJoinAndSelect("item.service", "service");

    // By default, show only ACTIVE items unless a specific status is requested.
    // If filters.status === 'all' we don't filter by status (show all statuses).
    if (!filters || !filters.status) {
      queryBuilder.where("item.status = :status", { status: ItemStatus.ACTIVE });
    } else if (filters.status !== "all") {
      queryBuilder.where("item.status = :status", { status: filters.status });
    }

    if (!filters) {
      return queryBuilder.getMany();
    }

    if (filters?.search) {
      queryBuilder.andWhere("item.name ILIKE :name", {
        name: `%${filters.search}%`,
      });
    }

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

    if (filters?.category) {
      queryBuilder.andWhere("item.category ILIKE :category", {
        category: `%${filters.category}%`,
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
    files: { images?: Express.Multer.File[] },
    user: User,
  ): Promise<Item> {
    const item = await this.findOne(id);

    if (item.sellerId !== user.userId) {
      throw new ForbiddenException("You can only update your own products");
    }

    const { workingHours, removedImages, ...updateData } = updateProductDto;

    await this.itemRepository.update(id, updateData);

    if (removedImages && removedImages.length > 0) {
      await this.removeImages(removedImages);
      await this.photoRepository.delete({ itemId: id, url: In(removedImages) });
    }

    if (files.images) {
      await this.photoRepository.delete({ itemId: id });
      if (files.images.length > 0) {
        const photoUrls = await this.saveImages(files.images);
        const photoEntities = photoUrls.map((url) =>
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

  toggleAvailability = async (id: number, available: boolean) => {
    const item = await this.findOne(id);

    item.availability = available;
    await this.itemRepository.save(item);

    return item;
  };

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
    console.log("Buscando favoritos para usuario:", userId);

    const favorites = await this.favoriteRepository.find({
      where: { user: { userId } }, // 🔹 Filtra usando la relación
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

  private async saveImages(images: Express.Multer.File[]): Promise<string[]> {
    const urls: string[] = [];
    const uploadDir = path.join(__dirname, "..", "..", "uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const image of images) {
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(image.originalname)}`;
      const filePath = path.join(uploadDir, uniqueName);
      fs.writeFileSync(filePath, image.buffer);
      urls.push(`/uploads/${uniqueName}`);
    }

    return urls;
  }

  private async removeImages(urls: string[]): Promise<void> {
    const uploadDir = path.join(__dirname, "..", "..", "uploads");

    for (const url of urls) {
      const fileName = path.basename(url);
      const filePath = path.join(uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  async updateStatus(
    id: number,
    status: ItemStatus,
    reason?: string,
  ): Promise<Item> {
    const item = await this.findOne(id);

    await this.itemRepository.update(id, { status });

    return this.findOne(id);
  }

  private detectProhibitedContent(name: string, description?: string): boolean {
    const prohibitedWords = [
      // Weapons/Armas
      "arma", "weapon", "pistola", "rifle", "gun", "firearm", "ammunition", "munición",
      "cuchillo", "knife", "blade", "sword", "espada", "dagger", "machete",
      
      // Drugs/Drogas
      "droga", "drug", "narcótico", "narcotic", "cocaína", "cocaine", "heroína", "heroin",
      "marihuana", "marijuana", "cannabis", "lsd", "éxtasis", "ecstasy", "metanfetamina",
      
      // Explosives/Explosivos
      "explosivo", "explosive", "bomba", "bomb", "dinamita", "dynamite", "granada", "grenade",
      "pólvora", "gunpowder", "nitrato", "nitrate",
      
      // Illegal/Ilegal
      "ilegal", "illegal", "prohibido", "forbidden", "banned", "contrabando", "contraband",
      "falsificado", "fake", "counterfeit", "robado", "stolen", "pirata", "pirated",
      
      // Adult/Pornographic content
      "pornografía", "pornography", "xxx", "adulto", "sexual", "erótico", "erotic",
      
      // Human/Animal related prohibited
      "órgano", "organ", "humano", "human", "esclavo", "slave", "tráfico", "trafficking",
      "animal protegido", "endangered", "marfil", "ivory", "cuerno", "horn",
      
      // Chemical/Venenos
      "veneno", "poison", "tóxico", "toxic", "químico peligroso", "dangerous chemical",
      "ácido", "acid", "mercurio", "mercury", "asbesto", "asbestos",
      
      // Prescription drugs
      "medicamento controlado", "prescription", "receta médica", "controlled substance",
      
      // Identity/Documents
      "documento falso", "fake document", "identidad falsa", "fake id", "pasaporte falso",
      "cedula falsa", "licencia falsa"
    ];

    const content = `${name} ${description || ""}`.toLowerCase();
    
    // Check for exact word matches (not just substring contains)
    const words = content.split(/\s+/);
    const contentText = words.join(" ");
    
    return prohibitedWords.some((prohibitedWord) => {
      // Check for both exact matches and phrase matches
      return contentText.includes(prohibitedWord.toLowerCase()) ||
             words.some(word => word === prohibitedWord.toLowerCase());
    });
  }
}

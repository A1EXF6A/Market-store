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
import { User, UserRole } from "src/entities/user.entity";
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

  // ✅ 1. Convertir strings a número
  if (createProductDto.price && typeof createProductDto.price === "string") {
    createProductDto.price = parseFloat(createProductDto.price);
  }

  // ✅ 2. Validar servicios
  if (createProductDto.type === ItemType.SERVICE && !createProductDto.workingHours) {
    throw new Error("El campo 'workingHours' es obligatorio para servicios");
  }

  // ✅ 3. Generar código único
  const code = await this.generateUniqueCode();

  // ✅ 4. Detectar contenido peligroso
  const isDangerous = this.detectProhibitedContent(
    createProductDto.name,
    createProductDto.description,
  );

  const { workingHours, ...itemData } = createProductDto;

  const item = this.itemRepository.create({
    ...itemData,
    code,
    sellerId,
    status: isDangerous ? ItemStatus.PENDING : ItemStatus.ACTIVE,
  });

  const savedItem = await this.itemRepository.save(item);

  if (isDangerous) {
    await this.incidentsService.createIncident(
      savedItem.itemId,
      `Producto detectado automáticamente como potencialmente peligroso. Palabras detectadas en: "${itemData.name}" ${
        itemData.description ? `- "${itemData.description}"` : ""
      }`,
    );
  }

  // ✅ 5. Guardar imágenes si existen
  if (files.images && files.images.length > 0) {
    const photoUrls = await this.saveImages(files.images);
    const photoEntities = photoUrls.map((url) =>
      this.photoRepository.create({ itemId: savedItem.itemId, url }),
    );
    await this.photoRepository.save(photoEntities);
  }

  // ✅ 6. Crear fila en services si es tipo 'service'
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

    // Por defecto mostrar solo productos 'active', pero si se pasa un filtro
    // `status` lo respetamos.
    if (filters?.status) {
      queryBuilder.where("item.status = :status", { status: filters.status });
    } else {
      queryBuilder.where("item.status = :status", { status: ItemStatus.ACTIVE });
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

    // Sellers are not allowed to delete products that are not ACTIVE
    if (user.role === UserRole.SELLER && item.status !== ItemStatus.ACTIVE) {
      throw new ForbiddenException(
        "You cannot delete a product that is not in active state",
      );
    }

    // Keep explicit ban check for clarity
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
    // Categorized prohibited terms and phrases. Each category contains explicit
    // phrases and keywords that constitute prohibited content. The check is
    // case-insensitive and matches both single words and multi-word phrases.
    const prohibitedByCategory: Record<string, string[]> = {
      "weapons": [
        "arma", "armas", "weapon", "weapons", "pistola", "pistolas", "pistol", "rifle", "rifles",
        "gun", "guns", "firearm", "firearms", "ammunition", "munición", "municiones",
        "silenciador", "silencer", "automatico", "automatic", "ak-47", "ar-15",
        "detonador", "detonator", "bala", "bullet", "cargador", "magazine"
      ],
      "explosives": [
        "bomba", "bomb", "explosivo", "explosive", "dinamita", "dynamite", "granada", "grenade",
        "pólvora", "gunpowder", "detonador", "detonator", "tnt", "C4", "c-4"
      ],
      "drugs": [
        "droga", "drogas", "drug", "drugs", "narcótico", "narcotic", "cocaína", "cocaine", "heroína", "heroin",
        "marihuana", "marijuana", "cannabis", "lsd", "éxtasis", "ecstasy", "metanfetamina", "meth",
        "psicotrópico", "opioide", "fentanyl", "cough syrup for misuse", "supply drugs"
      ],
      "illicit_services": [
        "servicio ilícito", "servicios ilícitos", "illegal service", "hacking service", "hackear",
        "ransomware", "ddos", "ddos attack", "fraud service", "deepfake service", "venta de datos personales",
        "venta de correos", "phishing service", "falsificación de documentos", "fake diploma service"
      ],
      "fraud_and_scams": [
        "fraude", "fraud", "scam", "estafa", "phishing", "ponzi", "pyramid scheme", "fake offer",
        "venta de cuentas robadas", "stolen accounts", "sell hacked accounts", "fake tickets", "counterfeit tickets",
        "chargeback guarantee", "safe payment guarantee"
      ],
      "counterfeit_goods": [
        "falsificado", "falsificados", "counterfeit", "knockoff", "replica", "réplica", "fake brand",
        "imitación marca", "reloj replica", "bolso falso", "fake handbag", "counterfeit currency"
      ],
      "deceptive_services": [
        "servicio falso", "servicios falsos", "fake service", "false advertising", "misleading service",
        "garantía falsa", "fake warranty", "unauthorized repair service"
      ],
      "high_risk_items": [
        "material radioactivo", "radioactive material", "biological sample", "pathogen", "virus sample",
        "hazardous chemical", "toxic chemical", "mercury", "asbestos", "hazardous waste"
      ],
      "regulated_without_license": [
        "venta de medicamentos sin receta", "prescription drugs without prescription", "medical device without certification",
        "venta de pesticidas no autorizados", "licensed required", "sin licencia", "without license"
      ],
      "offensive_and_hate": [
        "pornografía", "pornography", "sex trafficking", "sexual exploitation", "hate speech", "discurso de odio",
        "contenido ofensivo", "offensive content", "racial slur", "insulto racial"
      ],
      "intellectual_property": [
        "infracción de derechos", "copyright infringement", "pirateado", "warez", "unauthorized distribution",
        "venta de obras protegidas", "sell copyrighted materials"
      ],
      "identity_and_documents": [
        "documento falso", "fake document", "fake id", "pasaporte falso", "cedula falsa", "fake passport",
        "forged diploma", "licencia falsa"
      ],
      "human_trafficking_and_exploitation": [
        "tráfico de personas", "human trafficking", "servicio sexual pago", "sexual slavery", "esclavo humano"
      ],
      "personal_data_and_privacy": [
        "venta de datos personales", "personal data sale", "doxing service", "do-xing", "leaked database"
      ]
    };

    const content = `${name} ${description || ""}`.toLowerCase();

    // Build a flat list of phrases and also keep category mapping for logging
    const flatList: { phrase: string; category: string }[] = [];
    for (const [category, phrases] of Object.entries(prohibitedByCategory)) {
      for (const p of phrases) {
        flatList.push({ phrase: p.toLowerCase(), category });
      }
    }

    // Normalize: collapse multiple whitespace and compare
    const normalized = content.replace(/\s+/g, " ").trim();

    const matches = flatList.filter((entry) => normalized.includes(entry.phrase));
    if (matches.length > 0) {
      // Optional: log which categories matched for easier moderation/debugging
      const categories = Array.from(new Set(matches.map((m) => m.category)));
      console.warn(`Prohibited content detected for categories: ${categories.join(", ")}`);
      return true;
    }

    return false;
  }
}
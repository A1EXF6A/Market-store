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

  /* ===========================================================
     PASO 11 — VOCABULARIO PROHIBIDO EXPANDIDO
  ============================================================ */
  private readonly prohibitedWords = [
    // Weapons
    "arma","armas","weapon","gun","guns","pistola","rifle","escopeta","shotgun",
    "cuchillo","knife","blade","katana","machete","taser","ametralladora","munición",

    // Explosives
    "bomba","explosivo","bomb","molotov","dinamita","granada","c4","tnt","pólvora",

    // Drugs
    "droga","drogas","cocaína","heroína","crack","marihuana","cannabis","weed",
    "hachís","metanfetamina","meth","lsd","éxtasis","mdma","opio","fentanilo",

    // Prescription drugs
    "xanax","adderall","ritalin","esteroides","steroids","anabólico",

    // Sexual content
    "porno","pornografía","xxx","sexual","erótico","dildo","vibrador","sex toy",

    // Extremist content
    "tortura","decapitación","isis","terrorismo","al qaeda",

    // Fake documents
    "pasaporte falso","dni falso","cedula falsa","fake id","fake passport",
    "documento falso","licencia falsa","visa falsa",

    // Stolen goods
    "robado","stolen","mercancía robada","saqueado","loot",

    // Cybercrime
    "scam","fraude","phishing","hack","hacker","keylogger","botnet",
    "carding","fullz","bank logs","ransomware","malware","skimmer",

    // Wildlife trafficking
    "marfil","ivory","piel de tigre","cuerno de rinoceronte","animal protegido",
    "especies en peligro","tráfico animal",

    // Dangerous chemicals
    "veneno","poison","cianuro","mercurio","ácido sulfúrico",
    "ácido nítrico","cloroformo","gas nervioso",

    // Human trafficking
    "órgano humano","venta de órganos","esclavo","tráfico humano",

    // Radioactive material
    "uranio","plutonio","material radioactivo",
  ];

  private readonly prohibitedCategories = [
    "armas",
    "drogas",
    "explosivos",
    "químicos peligrosos",
    "sustancias químicas peligrosas",
    "animales protegidos",
    "documentos ilegales",
    "identidad falsa",
    "venenos",
    "material sexual",
    "objetos robados",
    "material radioactivo",
    "tráfico humano",
    "cybercrime",
    "fraude",
  ];

  private detectProhibitedContent(text?: string): boolean {
    if (!text) return false;
    const content = text.toLowerCase();
    return this.prohibitedWords.some((w) => content.includes(w));
  }

  private isCategoryDangerous(category?: string): boolean {
    if (!category) return false;
    const c = category.toLowerCase();
    return this.prohibitedCategories.some((w) => c.includes(w));
  }

  /* ===========================================================
     CREATE PRODUCT
  ============================================================ */
  async create(
    dto: CreateProductDto,
    files: { images?: Express.Multer.File[] },
    sellerId: number,
  ): Promise<Item> {
    if (dto.price && typeof dto.price === "string") {
      dto.price = parseFloat(dto.price);
    }

    if (dto.type === ItemType.SERVICE && !dto.workingHours)
      throw new Error("El campo 'workingHours' es obligatorio para servicios");

    const code = await this.generateUniqueCode();

    const nameDanger = this.detectProhibitedContent(dto.name);
    const descDanger = this.detectProhibitedContent(dto.description);
    const categoryDanger = this.isCategoryDangerous(dto.category);

    const isDangerous = nameDanger || descDanger || categoryDanger;

    const { workingHours, ...itemData } = dto;

    const item = this.itemRepository.create({
      ...itemData,
      code,
      sellerId,
      status: isDangerous ? ItemStatus.PENDING : ItemStatus.ACTIVE,
    });

    const savedItem = await this.itemRepository.save(item);

    if (isDangerous) {
      const reason = categoryDanger
        ? `La categoría "${dto.category}" está prohibida.`
        : `Contenido prohibido detectado en nombre o descripción.`;

      await this.incidentsService.createIncident(savedItem.itemId, reason);
    }

    // Save images
    if (files.images?.length) {
      const urls = await this.saveImages(files.images);
      await this.photoRepository.save(
        urls.map((url) =>
          this.photoRepository.create({ itemId: savedItem.itemId, url }),
        ),
      );
    }

    // Save service
    if (dto.type === ItemType.SERVICE && workingHours) {
      await this.serviceRepository.save({
        itemId: savedItem.itemId,
        workingHours,
      });
    }

    return this.findOne(savedItem.itemId);
  }

  /* ===========================================================
     FIND ALL
  ============================================================ */
  async findAll(filters?: any): Promise<Item[]> {
    const query = this.itemRepository
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
      query.andWhere("item.name ILIKE :s", { s: `%${filters.search}%` });
    }

    if (filters?.category) {
      query.andWhere("item.category ILIKE :c", { c: `%${filters.category}%` });
    }

    if (filters?.type) {
      query.andWhere("item.type = :t", { t: filters.type });
    }

    return query.getMany();
  }

  /* ===========================================================
     FIND ONE
  ============================================================ */
  async findOne(id: number): Promise<Item> {
    const item = await this.itemRepository.findOne({
      where: { itemId: id },
      relations: ["seller", "photos", "service"],
    });

    if (!item) throw new NotFoundException("Product not found");

    return item;
  }

  /* ===========================================================
     MÉTODO RESTAURADO — Buscar productos por vendedor
  ============================================================ */
  async findBySeller(sellerId: number): Promise<Item[]> {
    return this.itemRepository.find({
      where: { sellerId },
      relations: ["photos", "service", "seller"],
    });
  }

  /* ===========================================================
     UPDATE PRODUCT
  ============================================================ */
  async update(
    id: number,
    dto: UpdateProductDto,
    files: { images?: Express.Multer.File[] },
    user: User,
  ): Promise<Item> {
    const item = await this.findOne(id);

    if (item.sellerId !== user.userId)
      throw new ForbiddenException("Solo puedes actualizar tus productos");

    const pendingIncidents = await this.incidentsService.findPendingByItem(id);
    if (pendingIncidents.length > 0)
      throw new ForbiddenException(
        "No puedes editar un producto con incidentes pendientes",
      );

    const { workingHours, removedImages, ...updateData } = dto;

    await this.itemRepository.update(id, updateData);

    if (removedImages?.length) {
      await this.removeImages(removedImages);
      await this.photoRepository.delete({ itemId: id, url: In(removedImages) });
    }

    if (files.images) {
      await this.photoRepository.delete({ itemId: id });

      const urls = await this.saveImages(files.images);

      await this.photoRepository.save(
        urls.map((url) =>
          this.photoRepository.create({ itemId: id, url }),
        ),
      );
    }

    if (item.type === ItemType.SERVICE && workingHours) {
      await this.serviceRepository.upsert({ itemId: id, workingHours }, ["itemId"]);
    }

    return this.findOne(id);
  }

  /* ===========================================================
     MÉTODO RESTAURADO — Cambiar disponibilidad
  ============================================================ */
  async toggleAvailability(id: number, available: boolean): Promise<Item> {
    const item = await this.findOne(id);
    item.availability = available;
    await this.itemRepository.save(item);
    return item;
  }

  /* ===========================================================
     MÉTODO RESTAURADO — Actualizar status del ITEM
  ============================================================ */
  async updateStatus(
    id: number,
    status: ItemStatus,
    reason?: string,
  ): Promise<Item> {
    const item = await this.findOne(id);

    await this.itemRepository.update(id, { status });

    if (status === ItemStatus.BANNED) {
      await this.incidentsService.createIncident(
        id,
        reason || "Producto marcado como prohibido.",
      );
    }

    return this.findOne(id);
  }

  /* ===========================================================
     DELETE PRODUCT
  ============================================================ */
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

  /* ===========================================================
     FAVORITES
  ============================================================ */
  async toggleFavorite(itemId: number, userId: number) {
    const existing = await this.favoriteRepository.findOne({
      where: { itemId, userId },
    });

    if (existing) {
      await this.favoriteRepository.delete({ itemId, userId });
      return { isFavorite: false };
    }

    await this.favoriteRepository.save({ itemId, userId });
    return { isFavorite: true };
  }

  async getFavorites(userId: number): Promise<Item[]> {
    const favs = await this.favoriteRepository.find({
      where: { user: { userId } },
      relations: ["item", "item.seller", "item.photos"],
    });

    return favs.map((f) => f.item);
  }

  /* ===========================================================
     HELPERS
  ============================================================ */
  private async generateUniqueCode(): Promise<string> {
    let code = "";
    let exists = true;

    while (exists) {
      code = `P${Date.now()}${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;

      exists = !!(await this.itemRepository.findOne({ where: { code } }));
    }

    return code;
  }

  private async saveImages(images: Express.Multer.File[]): Promise<string[]> {
    const uploadDir = path.join(__dirname, "..", "..", "uploads");

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const urls: string[] = [];

    for (const file of images) {
      const filename = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}${path.extname(file.originalname)}`;

      fs.writeFileSync(path.join(uploadDir, filename), file.buffer);

      urls.push(`/uploads/${filename}`);
    }

    return urls;
  }

  private async removeImages(urls: string[]) {
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

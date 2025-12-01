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
      .leftJoinAndSelect("item.service", "service")
      .where("item.status != :banned", { banned: ItemStatus.BANNED });

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

    if (item.sellerId !== user.userId)
      throw new ForbiddenException("No puedes eliminar productos ajenos");

    const pending = await this.incidentsService.findPendingByItem(id);
    if (pending.length > 0)
      throw new ForbiddenException(
        "No puedes eliminar un producto con incidentes pendientes",
      );

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
      const filename = path.basename(url);
      const full = path.join(uploadDir, filename);

      if (fs.existsSync(full)) fs.unlinkSync(full);
    }
  }
}

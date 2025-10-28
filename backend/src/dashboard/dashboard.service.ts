import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { Item } from "../entities/item.entity";
import { Favorite } from "../entities/favorite.entity";
import { Chat } from "../entities/chat.entity";
import { Report } from "../entities/report.entity";
import { Incident } from "../entities/incident.entity";
import { Rating } from "../entities/rating.entity";
import { ItemStatus, ItemType } from "../entities/enums";

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
    @InjectRepository(Rating)
    private ratingRepository: Repository<Rating>,
  ) {}

  async getBuyerStats(userId: number) {
    const [favoritesCount, activeChatsCount, activeProductsCount] =
      await Promise.all([
        this.favoriteRepository.count({
          where: {
            userId: userId,
          },
        }),
        this.chatRepository.count({
          where: {
            buyerId: userId,
          },
        }),
        // Count globally available active products for explorer
        this.itemRepository.count({
          where: {
            status: ItemStatus.ACTIVE,
            availability: true,
            type: ItemType.PRODUCT,
          },
        }),
      ]);

    return {
      favoritesCount,
      activeChatsCount,
      activeProductsCount,
    };
  }

  async getSellerStats(userId: number) {
    const [productsCount, activeChatsCount, averageRating, totalSales] =
      await Promise.all([
        // Count ALL seller's products (remove status filter)
        this.itemRepository.count({
          where: {
            sellerId: userId,
          },
        }),
        this.chatRepository.count({
          where: {
            sellerId: userId,
          },
        }),
        this.ratingRepository
          .createQueryBuilder("rating")
          .where("rating.sellerId = :userId", { userId })
          .select("AVG(rating.score)", "average")
          .getRawOne()
          .then((result) => {
            return result?.average ? parseFloat(result.average) : 0;
          }),
        // Count sold items (availability = false)
        this.itemRepository.count({
          where: {
            sellerId: userId,
            availability: false,
          },
        }),
      ]);

    return {
      productsCount,
      activeChatsCount,
      averageRating,
      totalSales,
    };
  }

  async getAdminStats() {
    const [usersCount, incidentsCount, reportsCount, productsCount] =
      await Promise.all([
        this.userRepository.count(),
        this.incidentRepository.count({
          where: {
            status: ItemStatus.PENDING,
          },
        }),
        this.reportRepository.count(),
        this.itemRepository.count(),
      ]);

    return {
      usersCount,
      incidentsCount,
      reportsCount,
      productsCount,
    };
  }
}


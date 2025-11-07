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
import { ItemStatus } from "../entities/enums";

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
    const [favoritesCount, activeChatsCount] = await Promise.all([
      this.favoriteRepository.count({
        where: { userId },
      }),
      this.chatRepository.count({
        where: { buyer: { userId } },
      }),
    ]);

    return {
      favoritesCount,
      activeChatsCount,
    };
  }

  async getSellerStats(userId: number) {
    const [
      productsCount,
      activeChatsCount,
      averageRatingRow,
      totalSalesRow,
    ] = await Promise.all([
      // Total de ítems del vendedor
      this.itemRepository.count({ where: { sellerId: userId } }),

      // Chats activos del vendedor
      this.chatRepository.count({ where: { seller: { userId } } }),

      // PROMEDIO de ratings del vendedor
      // Opción 1 (recomendada): unir a la relación 'seller'
      this.ratingRepository
        .createQueryBuilder("rating")
        .innerJoin("rating.seller", "seller")
        .where("seller.userId = :userId", { userId })
        .select("COALESCE(AVG(rating.score), 0)", "average")
        .getRawOne(),

      // Suma de ventas = suma de price de items con availability = false
      this.itemRepository
        .createQueryBuilder("item")
        .where("item.sellerId = :userId", { userId })
        .andWhere("item.availability = false")
        .select("COALESCE(SUM(item.price), 0)", "total")
        .getRawOne(),
    ]);

    const averageRating = averageRatingRow?.average
      ? parseFloat(averageRatingRow.average)
      : 0;

    const totalSales = totalSalesRow?.total
      ? parseFloat(totalSalesRow.total)
      : 0;

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
          where: { status: ItemStatus.PENDING },
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

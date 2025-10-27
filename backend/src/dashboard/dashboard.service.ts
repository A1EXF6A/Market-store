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
        where: { 
          userId: userId 
        } 
      }),
      this.chatRepository.count({ 
        where: { 
          buyer: { userId } 
        } 
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
      averageRating,
      totalSales
    ] = await Promise.all([
      this.itemRepository.count({ 
        where: { 
          sellerId: userId 
        } 
      }),
      this.chatRepository.count({ 
        where: { 
          seller: { userId } 
        } 
      }),
      this.ratingRepository
        .createQueryBuilder("rating")
        .innerJoin("rating.item", "item")
        .where("item.sellerId = :userId", { userId })
        .select("AVG(rating.score)", "average")
        .getRawOne()
        .then(result => result?.average ? parseFloat(result.average).toFixed(1) : "5.0"),
      this.itemRepository
        .createQueryBuilder("item")
        .where("item.sellerId = :userId", { userId })
        .andWhere("item.availability = false")
        .select("SUM(item.price)", "total")
        .getRawOne()
        .then(result => result?.total || 0),
    ]);

    return {
      productsCount,
      activeChatsCount,
      averageRating: parseFloat(averageRating),
      totalSales,
    };
  }

  async getAdminStats() {
    const [
      usersCount,
      incidentsCount,
      reportsCount,
      productsCount,
    ] = await Promise.all([
      this.userRepository.count(),
      this.incidentRepository.count({ 
        where: { 
          status: ItemStatus.PENDING 
        } 
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
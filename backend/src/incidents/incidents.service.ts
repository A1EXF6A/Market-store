import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Incident } from "../entities/incident.entity";
import { Report } from "../entities/report.entity";
import { Appeal } from "../entities/appeal.entity";
import { Item, ItemStatus } from "../entities/item.entity";
import { User } from "../entities/user.entity";
import { CreateReportDto } from "./dto/create-report.dto";
import { CreateAppealDto } from "./dto/create-appeal.dto";

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(Appeal)
    private appealRepository: Repository<Appeal>,
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
  ) {}

  async createReport(
    createReportDto: CreateReportDto,
    buyerId: number,
  ): Promise<Report> {
    const { itemId, ...reportData } = createReportDto;

    const item = await this.itemRepository.findOne({ where: { itemId } });
    if (!item) {
      throw new NotFoundException("Product not found");
    }

    const report = this.reportRepository.create({
      ...reportData,
      itemId,
      buyerId,
    });

    return this.reportRepository.save(report);
  }

  async createIncident(
    itemId: number,
    description: string,
    moderatorId?: number,
  ): Promise<Incident> {
    const item = await this.itemRepository.findOne({ where: { itemId } });
    if (!item) {
      throw new NotFoundException("Product not found");
    }

    const incident = this.incidentRepository.create({
      itemId,
      description,
      status: ItemStatus.PENDING,
      moderatorId,
      sellerId: item.sellerId,
    });

    await this.itemRepository.update(itemId, { status: ItemStatus.PENDING });

    return this.incidentRepository.save(incident);
  }

  async createAppeal(
    createAppealDto: CreateAppealDto,
    sellerId: number,
  ): Promise<Appeal> {
    const { incidentId, reason } = createAppealDto;

    const incident = await this.incidentRepository.findOne({
      where: { incidentId },
      relations: ["seller"],
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    if (incident.sellerId !== sellerId) {
      throw new ForbiddenException("You can only appeal your own incidents");
    }

    const appeal = this.appealRepository.create({
      incidentId,
      sellerId,
      reason,
    });

    incident.moderatorId = null;
    await this.incidentRepository.save(incident);

    return this.appealRepository.save(appeal);
  }

  async getIncidents(filters?: any): Promise<Incident[]> {
    const queryBuilder = this.incidentRepository
      .createQueryBuilder("incident")
      .leftJoinAndSelect("incident.item", "item")
      .leftJoinAndSelect("incident.seller", "seller")
      .leftJoinAndSelect("incident.moderator", "moderator")
      .leftJoinAndSelect("incident.appeals", "appeals");

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.andWhere(
        "incident.reportedAt BETWEEN :startDate AND :endDate",
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      );
    }

    if (filters?.status) {
      queryBuilder.andWhere("incident.status = :status", {
        status: filters.status,
      });
    }

    return queryBuilder.orderBy("incident.reportedAt", "DESC").getMany();
  }

  async getReports(): Promise<Report[]> {
    return this.reportRepository.find({
      relations: ["item", "buyer"],
      order: { reportedAt: "DESC" },
    });
  }

  async assignModerator(
    incidentId: number,
    moderatorId: number,
  ): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { incidentId },
    });
    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    incident.moderatorId = moderatorId;
    return this.incidentRepository.save(incident);
  }

  async resolveIncident(
    incidentId: number,
    status: ItemStatus,
    moderatorId: number,
  ): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { incidentId },
      relations: ["item"],
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    incident.status = status;
    incident.moderatorId = moderatorId;

    await this.itemRepository.update(incident.itemId, { status });

    return this.incidentRepository.save(incident);
  }

  async getSellerIncidents(sellerId: number): Promise<Incident[]> {
    return this.incidentRepository.find({
      where: { sellerId },
      relations: ["item", "appeals"],
      order: { reportedAt: "DESC" },
    });
  }
}

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
import { User, UserRole } from "../entities/user.entity";
import { CreateReportDto } from "./dto/create-report.dto";
import { CreateAppealDto } from "./dto/create-appeal.dto";

export interface IncidentFilters {
  status?: ItemStatus;
  startDate?: string;
  endDate?: string;
  moderatorId?: number;
  sellerId?: number;
  search?: string;
}

export interface ReportFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

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
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  async createIncidentFromReport(
    reportId: number,
    description: string,
    moderatorId?: number,
  ): Promise<Incident> {
    const report = await this.reportRepository.findOne({ where: { reportId } });
    if (!report) {
      throw new NotFoundException("Report not found");
    }

    return this.createIncident(report.itemId, description, moderatorId);
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

    // Only allow creating an appeal when the incident is in PENDING state
    if (incident.status !== ItemStatus.PENDING) {
      throw new ForbiddenException(
        "Appeals can only be created for incidents in pending state",
      );
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

  if (filters?.moderatorId) {
    queryBuilder.andWhere("incident.moderatorId = :moderatorId", {
      moderatorId: +filters.moderatorId,
    });
  }

  if (filters?.sellerId) {
    queryBuilder.andWhere("incident.sellerId = :sellerId", {
      sellerId: +filters.sellerId,
    });
  }

  if (filters?.search) {
    queryBuilder.andWhere(
      "(incident.description ILIKE :search " +
        "OR item.name ILIKE :search " +
        "OR item.code ILIKE :search " +
        "OR seller.firstName ILIKE :search " +
        "OR seller.lastName ILIKE :search)",
      { search: `%${filters.search}%` },
    );
  }

  return queryBuilder.orderBy("incident.reportedAt", "DESC").getMany();
}

async findPendingByItem(itemId: number) {
  return this.incidentRepository.find({
    where: {
      itemId,
      status: ItemStatus.PENDING,
    },
    relations: ["seller", "moderator", "appeals"],
  });
}

  async getReports(filters?: ReportFilters): Promise<Report[]> {
    const queryBuilder = this.reportRepository
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.item", "item")
      .leftJoinAndSelect("report.buyer", "buyer");

    if (filters?.type) {
      queryBuilder.andWhere("report.type = :type", {
        type: filters.type,
      });
    }

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.andWhere(
        "report.reportedAt BETWEEN :startDate AND :endDate",
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      );
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        "(report.comment ILIKE :search OR item.name ILIKE :search OR item.code ILIKE :search OR buyer.firstName ILIKE :search OR buyer.lastName ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    return queryBuilder.orderBy("report.reportedAt", "DESC").getMany();
  }

  async getReportIncidentsCount(reportId: number): Promise<{ count: number }> {
    const report = await this.reportRepository.findOne({ where: { reportId } });
    if (!report) {
      throw new NotFoundException("Report not found");
    }

    const count = await this.incidentRepository.count({ where: { itemId: report.itemId } });
    return { count };
  }

    async assignModerator(
    incidentId: number,
    actorId: number,
    targetModeratorId?: number,
  ): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { incidentId },
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    const assignTo = targetModeratorId ?? actorId;

    // If assigning to someone else, only admins are allowed
    if (targetModeratorId && targetModeratorId !== actorId) {
      const actor = await this.userRepository.findOne({ where: { userId: actorId } });
      if (!actor) throw new NotFoundException("Actor user not found");
      if (actor.role !== UserRole.ADMIN) {
        throw new ForbiddenException("Only admins can assign incidents to other moderators");
      }

      const target = await this.userRepository.findOne({ where: { userId: targetModeratorId } });
      if (!target) throw new NotFoundException("Target moderator not found");
      if (target.role !== UserRole.MODERATOR) {
        throw new ForbiddenException("Target user is not a moderator");
      }
    }

    // Ensure the assignee is a moderator or an admin (admins can self-assign)
    const targetUser = await this.userRepository.findOne({ where: { userId: assignTo } });
    if (!targetUser) {
      throw new NotFoundException("User to assign not found");
    }
    if (targetUser.role !== UserRole.MODERATOR && targetUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Assigned user must be a moderator or an admin");
    }

    incident.moderatorId = assignTo;
    return this.incidentRepository.save(incident);
  }

  async resolveIncident(
    incidentId: number,
    status: ItemStatus,
    moderatorId: number,
  ): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { incidentId },
      relations: ["item", "appeals"],
    });

  if (!incident) {
    throw new NotFoundException("Incident not found");
  }

  // Estado final de la incidencia
  incident.status = incidentStatus;
  incident.moderatorId = moderatorId;

    // update item status
    await this.itemRepository.update(incident.itemId, { status });

    // If the incident has appeals and the resolved status is not PENDING,
    // mark all associated appeals as reviewed (true)
    if (incident.appeals && incident.appeals.length > 0 && status !== ItemStatus.PENDING) {
      for (const appeal of incident.appeals) {
        appeal.reviewed = true;
        await this.appealRepository.save(appeal);
      }
    }

  return this.incidentRepository.save(incident);
}

  async getSellerIncidents(sellerId: number): Promise<Incident[]> {
    return this.incidentRepository.find({
      where: { sellerId },
      relations: ["item", "appeals"],
      order: { reportedAt: "DESC" },
    });
  }

  async getAppeals(): Promise<Appeal[]> {
    return this.appealRepository.find({
      relations: ["incident", "seller"],
      order: { createdAt: "DESC" },
    });
  }

  async reviewAppeal(id: number, approved: boolean, moderatorId: number): Promise<Appeal> {
    const appeal = await this.appealRepository.findOne({ where: { appealId: id }, relations: ["incident"] });
    if (!appeal) {
      throw new NotFoundException("Appeal not found");
    }

    // mark as reviewed
    appeal.reviewed = true;

    // update incident status based on decision
    const incident = await this.incidentRepository.findOne({ where: { incidentId: appeal.incidentId }, relations: ["item"] });
    if (incident) {
      if (approved) {
        incident.status = ItemStatus.ACTIVE;
      } else {
        incident.status = ItemStatus.SUSPENDED;
      }
      incident.moderatorId = moderatorId;
      await this.itemRepository.update(incident.itemId, { status: incident.status });
      await this.incidentRepository.save(incident);
    }

    return this.appealRepository.save(appeal);
  }
}

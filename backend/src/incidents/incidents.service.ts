import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Incident } from "../entities/incident.entity";
import { Report } from "../entities/report.entity";
import { Appeal } from "../entities/appeal.entity";
import { Item, ItemStatus } from "../entities/item.entity";
import { IncidentStatus, IncidentType } from "../entities/enums";
import { CreateReportDto } from "./dto/create-report.dto";
import { CreateAppealDto } from "./dto/create-appeal.dto";

export interface IncidentFilters {
  status?: IncidentStatus;
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
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Appeal)
    private readonly appealRepository: Repository<Appeal>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  /* ===================== REPORTES (compradores) ===================== */

  /**
   * Un comprador reporta un producto.
   * - Se crea el Report.
   * - También se crea una Incident de tipo BUYER_REPORT.
   * - ❗ NO se oculta el producto automáticamente (según requisitos).
   */
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
    const savedReport = await this.reportRepository.save(report);

    // Crear Incidencia asociada al reporte del comprador
    const incident = this.incidentRepository.create({
      itemId,
      sellerId: item.sellerId,
      description:
        reportData.comment ||
        "Reporte generado por un comprador sobre este producto/servicio",
      status: IncidentStatus.PENDING,
      type: IncidentType.BUYER_REPORT,
    });
    await this.incidentRepository.save(incident);

    return savedReport;
  }

  /* ===================== INCIDENTES (auto / manual) ===================== */

  /**
   * Crear incidencia desde el sistema o manualmente.
   * - Suele usarse para productos detectados como peligrosos.
   * - Aquí SÍ se cambia el estado del Item (por ejemplo, PENDING / HIDDEN…).
   */
  async createIncident(
    itemId: number,
    description: string,
    moderatorId?: number,
    type: IncidentType = IncidentType.AUTO_DETECTED,
  ): Promise<Incident> {
    const item = await this.itemRepository.findOne({ where: { itemId } });
    if (!item) {
      throw new NotFoundException("Product not found");
    }

    const incident = this.incidentRepository.create({
      itemId,
      sellerId: item.sellerId,
      description,
      status: IncidentStatus.PENDING,
      type,
      moderatorId: moderatorId ?? null,
    });

    // Ocultar / marcar el producto como pendiente de revisión
    await this.itemRepository.update(itemId, { status: ItemStatus.PENDING });

    return this.incidentRepository.save(incident);
  }

  /* ===================== APELACIONES (vendedor) ===================== */

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

    // Reabrir la incidencia para que otro moderador la revise
    incident.moderatorId = null;
    incident.status = IncidentStatus.PENDING;
    await this.incidentRepository.save(incident);

    return this.appealRepository.save(appeal);
  }

<<<<<<< HEAD
  /* ===================== LISTADO DE INCIDENCIAS (moderador/admin) ===================== */

  async getIncidents(filters?: IncidentFilters): Promise<Incident[]> {
    const queryBuilder = this.incidentRepository
      .createQueryBuilder("incident")
      .leftJoinAndSelect("incident.item", "item")
      .leftJoinAndSelect("incident.seller", "seller")
      .leftJoinAndSelect("incident.moderator", "moderator");

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

  /* ===================== LISTADO DE REPORTES (moderador/admin) ===================== */
=======
 async getIncidents(filters?: IncidentFilters): Promise<Incident[]> {
  const queryBuilder = this.incidentRepository
    .createQueryBuilder("incident")
    .leftJoinAndSelect("incident.item", "item")
    .leftJoinAndSelect("incident.seller", "seller")
    .leftJoinAndSelect("incident.moderator", "moderator")
    // 👇 NUEVO: traer también las apelaciones
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

>>>>>>> 0cda334 (Cambios antes de pasar a rama cambios)

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
        "(report.comment ILIKE :search " +
          "OR item.name ILIKE :search " +
          "OR item.code ILIKE :search " +
          "OR buyer.firstName ILIKE :search " +
          "OR buyer.lastName ILIKE :search)",
        { search: `%${filters.search}%` },
      );
    }

    return queryBuilder.orderBy("report.reportedAt", "DESC").getMany();
  }

  /* ===================== ASIGNAR MODERADOR ===================== */

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
    incident.status = IncidentStatus.REVIEWING;

    return this.incidentRepository.save(incident);
  }

<<<<<<< HEAD
  /* ===================== RESOLVER INCIDENTE ===================== */

  /**
   * Resolver la incidencia:
   * - Cambia el estado de la incidencia (RESOLVED / REJECTED / etc.).
   * - Opcionalmente actualiza el estado del producto (itemStatus).
   */
  async resolveIncident(
    incidentId: number,
    incidentStatus: IncidentStatus,
    moderatorId: number,
    itemStatus?: ItemStatus,
  ): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { incidentId },
      relations: ["item"],
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    incident.status = incidentStatus;
    incident.moderatorId = moderatorId;
    incident.resolvedAt = new Date();

    if (itemStatus !== undefined) {
      await this.itemRepository.update(incident.itemId, { status: itemStatus });
    }

    return this.incidentRepository.save(incident);
  }

  /* ===================== INCIDENCIAS DEL VENDEDOR ===================== */
=======
 async resolveIncident(
  incidentId: number,
  incidentStatus: ItemStatus, // ← corregido
  moderatorId: number,
  itemStatus?: ItemStatus,
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

  // Si tienes este campo agregado, usa esto:
  // incident.resolvedAt = new Date();

  // Cambiar estado del producto (si aplica)
  if (itemStatus !== undefined) {
    await this.itemRepository.update(incident.itemId, {
      status: itemStatus,
    });
  }

  // Marcar apelaciones como revisadas
  if (incident.appeals?.length) {
    await this.appealRepository.update(
      { incidentId: incident.incidentId },
      { reviewed: true },
    );
  }

  return this.incidentRepository.save(incident);
}
>>>>>>> 0cda334 (Cambios antes de pasar a rama cambios)

  async getSellerIncidents(sellerId: number): Promise<Incident[]> {
    return this.incidentRepository.find({
      where: { sellerId },
      relations: ["item", "appeals"],
      order: { reportedAt: "DESC" },
    });
  }
}

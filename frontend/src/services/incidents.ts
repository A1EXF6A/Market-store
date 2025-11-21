// src/services/incidents.ts
import { api } from "./api";

// Importa los tipos reales del proyecto
import type {
  Incident,
  Report,
  IncidentStatus,
  ItemStatus,
  ReportType,
  IncidentType,
} from "@/types";

export interface IncidentFilters {
  status?: IncidentStatus;
  startDate?: string;
  endDate?: string;
  moderatorId?: number;
  sellerId?: number;
  search?: string;
}

export interface ReportFilters {
  type?: ReportType | string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const incidentsService = {
  /** ========================
   **  LISTA DE INCIDENCIAS
   ** ======================== */
  async getIncidents(filters?: IncidentFilters): Promise<Incident[]> {
    const res = await api.get("/incidents", { params: filters });
    return res.data;
  },

  /** ========================
   **  LISTA DE REPORTES
   ** ======================== */
  async getReports(filters?: ReportFilters): Promise<Report[]> {
    const res = await api.get("/incidents/reports", { params: filters });
    return res.data;
  },

  /** ========================
   **  CREAR REPORTE (COMPRADOR)
   ** ======================== */
  async createReport(data: {
    itemId: number;
    type: ReportType;
    comment?: string;
  }): Promise<Report> {
    const res = await api.post("/incidents/reports", data);
    return res.data;
  },

  /** ========================
   **  INCIDENCIAS DEL VENDEDOR
   ** ======================== */
  async getMyIncidents(): Promise<Incident[]> {
    const res = await api.get("/incidents/my-incidents");
    return res.data;
  },

  /** ========================
   **  ASIGNAR INCIDENCIA A MODERADOR
   ** ======================== */
  async assign(incidentId: number): Promise<Incident> {
    const res = await api.patch(`/incidents/${incidentId}/assign`);
    return res.data;
  },

  /** ========================
   **  RESOLVER INCIDENCIA
   ** ======================== */
  async resolve(data: {
    incidentId: number;
    incidentStatus: IncidentStatus;
    itemStatus?: ItemStatus;
  }): Promise<Incident> {
    const res = await api.patch(`/incidents/${data.incidentId}/resolve`, {
      incidentStatus: data.incidentStatus,
      itemStatus: data.itemStatus,
    });
    return res.data;
  },
};

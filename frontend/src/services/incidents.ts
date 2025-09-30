import api from './api';
import type { Incident, Report, Appeal } from '../types';
import { ItemStatus, ReportType } from '../types';

export interface IncidentFilters {
  status?: ItemStatus;
  moderatorId?: number;
  search?: string;
}

export interface ReportFilters {
  type?: ReportType;
  search?: string;
}

export interface CreateReportData {
  itemId: number;
  type: ReportType;
  comment?: string;
}

export interface CreateAppealData {
  incidentId: number;
  reason: string;
}

export const incidentsService = {
  getIncidents: async (filters?: IncidentFilters): Promise<Incident[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.moderatorId) params.append('moderatorId', filters.moderatorId.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`/incidents?${params.toString()}`);
    return response.data;
  },

  getIncidentById: async (id: number): Promise<Incident> => {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  },

  assignIncident: async (id: number, moderatorId: number): Promise<Incident> => {
    const response = await api.patch(`/incidents/${id}/assign`, { moderatorId });
    return response.data;
  },

  resolveIncident: async (id: number, status: ItemStatus, description?: string): Promise<Incident> => {
    const response = await api.patch(`/incidents/${id}/resolve`, { status, description });
    return response.data;
  },

  getReports: async (filters?: ReportFilters): Promise<Report[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`/reports?${params.toString()}`);
    return response.data;
  },

  createReport: async (data: CreateReportData): Promise<Report> => {
    const response = await api.post('/reports', data);
    return response.data;
  },

  getAppeals: async (): Promise<Appeal[]> => {
    const response = await api.get('/appeals');
    return response.data;
  },

  createAppeal: async (data: CreateAppealData): Promise<Appeal> => {
    const response = await api.post('/appeals', data);
    return response.data;
  },

  reviewAppeal: async (id: number, approved: boolean): Promise<Appeal> => {
    const response = await api.patch(`/appeals/${id}`, { approved });
    return response.data;
  },
};
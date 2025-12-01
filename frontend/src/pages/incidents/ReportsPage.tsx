/*****************************************************************************************
 * REPORTS PAGE — COMPLETAMENTE CORREGIDO
 * - Corregido el tipo de IconComponent para permitir className
 * - Incluye botón Crear Incidencia
 * - Sin errores de TS
 *****************************************************************************************/

import type { Incident, Report } from "@/types";
import { ItemStatus, ReportType } from "@/types";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";

import {
  incidentsService,
  type ReportFilters,
  type IncidentFilters,
} from "@services/incidents";

import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  Flag,
  MessageSquare,
  Package,
  Search,
  Shield,
  Trash,
  User,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters & IncidentFilters>({});
  const [activeTab, setActiveTab] = useState("reports");

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const clearFilters = async () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    await loadData(emptyFilters);
  };

  const loadData = async (customFilters?: ReportFilters & IncidentFilters) => {
    try {
      setLoading(true);

      const currentFilters =
        customFilters !== undefined ? customFilters : filters;

      if (activeTab === "reports") {
        const data = await incidentsService.getReports(currentFilters);
        setReports(data);
      } else {
        const data = await incidentsService.getIncidents(currentFilters);
        setIncidents(data);
      }
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
      ASIGNAR MODERADOR
  ============================================================ */
  const handleAssignModerator = async (incidentId: number) => {
    try {
      setProcessing(`assign-${incidentId}`);
      await incidentsService.assignIncident(incidentId);
      toast.success("Te has asignado como moderador");
      loadData();
    } catch {
      toast.error("Error al asignarse como moderador");
    } finally {
      setProcessing(null);
    }
  };

  /* ============================================================
      RESOLVER INCIDENTE
  ============================================================ */
  const handleResolveIncident = async (
    incidentId: number,
    status: ItemStatus,
  ) => {
    try {
      setProcessing(`resolve-${incidentId}`);
      await incidentsService.resolveIncident(incidentId, status);

      toast.success(
        status === ItemStatus.ACTIVE
          ? "Incidente resuelto - Producto reactivado"
          : "Incidente resuelto - Producto suspendido",
      );

      loadData();
    } catch {
      toast.error("Error al resolver incidente");
    } finally {
      setProcessing(null);
    }
  };

  /* ============================================================
      CREAR INCIDENTE DESDE REPORTE
  ============================================================ */
  const handleCreateIncidentFromReport = async (reportId: number) => {
    try {
      setProcessing(`create-${reportId}`);
      await incidentsService.createIncidentFromReport(reportId);
      toast.success("Incidencia creada correctamente");
      loadData();
    } catch {
      toast.error("Error al crear incidencia");
    } finally {
      setProcessing(null);
    }
  };

  /* ============================================================
      BADGE: TIPOS DE REPORTES (CORREGIDO)
  ============================================================ */
  const getReportTypeBadge = (type: ReportType) => {
    const typeMap: Record<
      ReportType,
      {
        text: string;
        class: string;
        icon: React.ComponentType<{ className?: string }>;
      }
    > = {
      [ReportType.SPAM]: {
        text: "Spam",
        class: "bg-orange-100 text-orange-800",
        icon: Trash,
      },
      [ReportType.INAPPROPRIATE]: {
        text: "Inapropiado",
        class: "bg-red-100 text-red-800",
        icon: Ban,
      },
      [ReportType.ILLEGAL]: {
        text: "Ilegal",
        class: "bg-red-100 text-red-800",
        icon: AlertTriangle,
      },
      [ReportType.OTHER]: {
        text: "Otro",
        class: "bg-gray-100 text-gray-800",
        icon: Flag,
      },
    };

    const typeInfo = typeMap[type];
    const IconComponent = typeInfo.icon;

    return (
      <Badge className={typeInfo.class}>
        <IconComponent className="h-3 w-3 mr-1" />
        {typeInfo.text}
      </Badge>
    );
  };

  /* ============================================================
      BADGE: ESTADOS DE INCIDENTES (CORREGIDO)
  ============================================================ */
  const getStatusBadge = (status: ItemStatus) => {
    const statusMap: Record<
      ItemStatus,
      {
        text: string;
        class: string;
        icon: React.ComponentType<{ className?: string }>;
      }
    > = {
      [ItemStatus.PENDING]: {
        text: "Pendiente",
        class: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      [ItemStatus.ACTIVE]: {
        text: "Activo",
        class: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      [ItemStatus.SUSPENDED]: {
        text: "Suspendido",
        class: "bg-red-100 text-red-800",
        icon: XCircle,
      },
      [ItemStatus.HIDDEN]: {
        text: "Oculto",
        class: "bg-gray-100 text-gray-800",
        icon: Clock,
      },
      [ItemStatus.BANNED]: {
        text: "Prohibido",
        class: "bg-red-100 text-red-800",
        icon: XCircle,
      },
    };

    const statusInfo = statusMap[status];
    const IconComponent = statusInfo.icon;

    return (
      <Badge className={statusInfo.class}>
        <IconComponent className="h-3 w-3 mr-1" />
        {statusInfo.text}
      </Badge>
    );
  };

  /* ============================================================
      LOADING
  ============================================================ */
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  /* ============================================================
      UI COMPLETO (sin cambios de TS)
  ============================================================ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Shield className="h-8 w-8 text-blue-600" />

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Moderación</h1>
          <p className="text-gray-600 mt-2">
            Gestiona reportes, incidentes y apelaciones
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* TABS */}
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Reportes
          </TabsTrigger>

          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Incidentes y Apelaciones
          </TabsTrigger>
        </TabsList>

        {/* ======================================================================
            TAB DE REPORTES
        ====================================================================== */}
        <TabsContent value="reports" className="space-y-6">

          {/* --------------------------------------------------
            FILTROS  
          -------------------------------------------------- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* SEARCH */}
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Producto, comentario..."
                      className="pl-10"
                      value={filters.search || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* TIPO */}
                <div className="space-y-2">
                  <Label>Tipo de Reporte</Label>
                  <Select
                    value={filters.type || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        type:
                          value === "all" ? undefined : (value as ReportType),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value={ReportType.SPAM}>Spam</SelectItem>
                      <SelectItem value={ReportType.INAPPROPRIATE}>
                        Inapropiado
                      </SelectItem>
                      <SelectItem value={ReportType.ILLEGAL}>Ilegal</SelectItem>
                      <SelectItem value={ReportType.OTHER}>Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* FECHA INICIO */}
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* FECHA FIN */}
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpiar
                </Button>

                <Button
                  onClick={() => loadData()}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* --------------------------------------------------
            TABLA DE REPORTES
          -------------------------------------------------- */}
          <Card>
            <CardHeader>
              <CardTitle>Reportes ({reports.length})</CardTitle>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Reportado por</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Comentario</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.reportId}>
                      {/* PRODUCTO */}
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Package className="h-4 w-4 text-gray-400" />

                          <div>
                            <p className="font-medium">
                              Producto ID: {report.itemId}
                            </p>

                            <Button
                              variant="link"
                              size="sm"
                              asChild
                              className="p-0 h-auto text-blue-600"
                            >
                              <Link to={`/products/${report.itemId}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                Ver producto
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </TableCell>

                      {/* USUARIO */}
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>Usuario ID: {report.buyerId}</span>
                        </div>
                      </TableCell>

                      {/* TIPO DE REPORTE */}
                      <TableCell>
                        {getReportTypeBadge(report.type)}
                      </TableCell>

                      {/* COMENTARIO */}
                      <TableCell>
                        {report.comment ? (
                          <div className="max-w-xs">
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {report.comment}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            Sin comentario
                          </span>
                        )}
                      </TableCell>

                      {/* FECHA */}
                      <TableCell>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(report.reportedAt).toLocaleDateString()}
                        </div>
                      </TableCell>

                      {/* ACCIONES */}
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-2">

                          {/* REVISAR */}
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/products/${report.itemId}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Revisar
                            </Link>
                          </Button>

                          {/* CREAR INCIDENCIA */}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={processing === `create-${report.reportId}`}
                            onClick={() =>
                              handleCreateIncidentFromReport(report.reportId)
                            }
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Crear incidencia
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* NO REPORTES */}
              {reports.length === 0 && (
                <div className="text-center py-12">
                  <Flag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No se encontraron reportes
                  </h3>
                  <p className="text-gray-600">
                    No hay reportes que coincidan con los filtros seleccionados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* --------------------------------------------------
            SUMMARY
          -------------------------------------------------- */}
          {reports.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {reports.filter((r) => r.type === ReportType.SPAM).length}
                  </div>
                  <p className="text-sm text-gray-600">Spam</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {
                      reports.filter(
                        (r) => r.type === ReportType.INAPPROPRIATE,
                      ).length
                    }
                  </div>
                  <p className="text-sm text-gray-600">Inapropiado</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {
                      reports.filter((r) => r.type === ReportType.ILLEGAL)
                        .length
                    }
                  </div>
                  <p className="text-sm text-gray-600">Ilegal</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {reports.filter((r) => r.type === ReportType.OTHER).length}
                  </div>
                  <p className="text-sm text-gray-600">Otros</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ======================================================================
            TAB DE INCIDENTES
        ====================================================================== */}
        <TabsContent value="incidents" className="space-y-6">

          {/* FILTROS DE INCIDENTES */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* SEARCH */}
                <div className="space-y-2">
                  <Label htmlFor="search-incidents">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search-incidents"
                      placeholder="Producto, vendedor..."
                      className="pl-10"
                      value={filters.search || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* STATUS */}
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        status:
                          value === "all"
                            ? undefined
                            : (value as ItemStatus),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value={ItemStatus.PENDING}>
                        Pendiente
                      </SelectItem>
                      <SelectItem value={ItemStatus.ACTIVE}>Activo</SelectItem>
                      <SelectItem value={ItemStatus.SUSPENDED}>
                        Suspendido
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* FECHAS */}
                <div className="space-y-2">
                  <Label>Fecha Inicio</Label>
                  <Input
                    type="date"
                    value={filters.startDate || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha Fin</Label>
                  <Input
                    type="date"
                    value={filters.endDate || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4" />
                  Limpiar
                </Button>

                <Button
                  onClick={() => loadData()}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* TABLA DE INCIDENTES */}
          <Card>
            <CardHeader>
              <CardTitle>
                Incidentes y Apelaciones ({incidents.length})
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Moderador</TableHead>
                    <TableHead>Apelaciones</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {incidents.map((incident) => (
                    <TableRow key={incident.incidentId}>
                      {/* PRODUCTO */}
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Package className="h-4 w-4 text-gray-400" />

                          <div>
                            <p className="font-medium">
                              Producto ID: {incident.itemId}
                            </p>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-blue-600"
                              asChild
                            >
                              <Link to={`/products/${incident.itemId}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                Ver producto
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </TableCell>

                      {/* VENDEDOR */}
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>Usuario ID: {incident.sellerId}</span>
                        </div>
                      </TableCell>

                      {/* ESTADO */}
                      <TableCell>{getStatusBadge(incident.status)}</TableCell>

                      {/* MODERADOR */}
                      <TableCell>
                        {incident.moderatorId ? (
                          <div className="flex items-center space-x-2">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Asignado</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            Sin asignar
                          </span>
                        )}
                      </TableCell>

                      {/* APELACIONES */}
                      <TableCell>
                        {incident.appeals && incident.appeals.length > 0 ? (
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">
                              {incident.appeals.length} apelación
                              {incident.appeals.length !== 1 ? "es" : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            Sin apelaciones
                          </span>
                        )}
                      </TableCell>

                      {/* FECHA */}
                      <TableCell>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(incident.reportedAt).toLocaleDateString()}
                        </div>
                      </TableCell>

                      {/* ACCIONES */}
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">

                          {/* ASIGNAR */}
                          {!incident.moderatorId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleAssignModerator(incident.incidentId)
                              }
                              disabled={
                                processing === `assign-${incident.incidentId}`
                              }
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Asignarme
                            </Button>
                          )}

                          {/* RESOLVER */}
                          {incident.moderatorId &&
                            incident.status === ItemStatus.PENDING && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Resolver
                                  </Button>
                                </DialogTrigger>

                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Resolver Incidente
                                    </DialogTitle>
                                  </DialogHeader>

                                  <div className="space-y-4">
                                    <p className="text-sm text-gray-600">
                                      Descripción: {incident.description}
                                    </p>

                                    {/* LISTA DE APELACIONES */}
                                    {incident.appeals &&
                                      incident.appeals.length > 0 && (
                                        <div className="space-y-2">
                                          <h4 className="font-semibold">
                                            Apelaciones:
                                          </h4>

                                          {incident.appeals.map(
                                            (appeal, index) => (
                                              <div
                                                key={index}
                                                className="bg-gray-50 p-3 rounded-md"
                                              >
                                                <p className="text-sm">
                                                  {appeal.reason}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                  {new Date(
                                                    appeal.createdAt,
                                                  ).toLocaleDateString()}
                                                </p>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      )}

                                    {/* BOTONES RESOLVER */}
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() =>
                                          handleResolveIncident(
                                            incident.incidentId,
                                            ItemStatus.ACTIVE,
                                          )
                                        }
                                        disabled={
                                          processing ===
                                          `resolve-${incident.incidentId}`
                                        }
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Reactivar Producto
                                      </Button>

                                      <Button
                                        onClick={() =>
                                          handleResolveIncident(
                                            incident.incidentId,
                                            ItemStatus.SUSPENDED,
                                          )
                                        }
                                        disabled={
                                          processing ===
                                          `resolve-${incident.incidentId}`
                                        }
                                        variant="destructive"
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Suspender Producto
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* NO INCIDENTES */}
              {incidents.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No se encontraron incidentes
                  </h3>
                  <p className="text-gray-600">
                    No hay incidentes registrados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;

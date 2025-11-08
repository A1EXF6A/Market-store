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
import { incidentsService, type ReportFilters, type IncidentFilters } from "@services/incidents";
import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
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
      const currentFilters = customFilters !== undefined ? customFilters : filters;
      if (activeTab === "reports") {
        const data = await incidentsService.getReports(currentFilters);
        setReports(data);
      } else {
        const data = await incidentsService.getIncidents(currentFilters);
        setIncidents(data);
      }
    } catch (error: any) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignModerator = async (incidentId: number) => {
    try {
      setProcessing(`assign-${incidentId}`);
      await incidentsService.assignIncident(incidentId);
      toast.success("Te has asignado como moderador");
      loadData();
    } catch (error: any) {
      toast.error("Error al asignarse como moderador");
    } finally {
      setProcessing(null);
    }
  };

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
    } catch (error: any) {
      toast.error("Error al resolver incidente");
    } finally {
      setProcessing(null);
    }
  };

  const getReportTypeBadge = (type: ReportType) => {
    const typeMap = {
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

  const getStatusBadge = (status: ItemStatus) => {
    const statusMap: Record<
      ItemStatus,
      { text: string; class: string; icon: React.ComponentType }
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

  return (
    <div className="space-y-6">
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

        <TabsContent value="reports" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                      <SelectValue placeholder="Todos los tipos" />
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
                  onClick={clearFilters}
                  variant="outline"
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

          {/* Reports Table */}
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
                              className="p-0 h-auto text-blue-600"
                              asChild
                            >
                              <Link to={`/products/${report.itemId}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                Ver producto
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>Usuario ID: {report.buyerId}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getReportTypeBadge(report.type)}</TableCell>
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
                      <TableCell>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(report.reportedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/products/${report.itemId}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Revisar
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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

          {/* Summary Statistics */}
          {reports.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {reports.filter((r) => r.type === ReportType.SPAM).length}
                    </div>
                    <p className="text-sm text-gray-600">Spam</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {
                        reports.filter(
                          (r) => r.type === ReportType.INAPPROPRIATE,
                        ).length
                      }
                    </div>
                    <p className="text-sm text-gray-600">Inapropiado</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {
                        reports.filter((r) => r.type === ReportType.ILLEGAL)
                          .length
                      }
                    </div>
                    <p className="text-sm text-gray-600">Ilegal</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {
                        reports.filter((r) => r.type === ReportType.OTHER)
                          .length
                      }
                    </div>
                    <p className="text-sm text-gray-600">Otros</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          {/* Filters for Incidents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search-incidents">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: value === "all" ? undefined : (value as ItemStatus),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value={ItemStatus.PENDING}>Pendiente</SelectItem>
                      <SelectItem value={ItemStatus.ACTIVE}>Activo</SelectItem>
                      <SelectItem value={ItemStatus.SUSPENDED}>Suspendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate-incidents">Fecha Inicio</Label>
                  <Input
                    id="startDate-incidents"
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
                  <Label htmlFor="endDate-incidents">Fecha Fin</Label>
                  <Input
                    id="endDate-incidents"
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
                  onClick={clearFilters}
                  variant="outline"
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

          {/* Incidents Table */}
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
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>Usuario ID: {incident.sellerId}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(incident.status)}</TableCell>
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
                      <TableCell>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(incident.reportedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
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

                          {incident.moderatorId &&
                            incident.status === ItemStatus.PENDING && (
                              <>
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
                              </>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {incidents.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No se encontraron incidentes
                  </h3>
                  <p className="text-gray-600">No hay incidentes registrados</p>
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


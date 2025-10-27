import { useAuthStore } from "@/store/authStore";
import type { Incident } from "@/types";
import { ItemStatus, UserRole } from "@/types";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
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
import { Textarea } from "@components/ui/textarea";
import { incidentsService, type IncidentFilters } from "@services/incidents";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  MoreHorizontal,
  Package,
  Search,
  User,
  UserCheck,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const IncidentsPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<IncidentFilters>({});
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [resolution, setResolution] = useState<{
    status: ItemStatus;
    description: string;
  }>({
    status: ItemStatus.ACTIVE,
    description: "",
  });
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async (customFilters?: IncidentFilters) => {
    try {
      setLoading(true);
      const currentFilters = customFilters !== undefined ? customFilters : filters;
      const data = await incidentsService.getIncidents(currentFilters);
      setIncidents(data);
    } catch (error: any) {
      toast.error("Error al cargar incidencias");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = async () => {
    setFilters({});
    await loadIncidents({});
  };

  const handleAssignIncident = async (incidentId: number) => {
    if (!currentUser) return;

    try {
      setActionLoading(incidentId);
      await incidentsService.assignIncident(incidentId);
      toast.success("Incidencia asignada");
      loadIncidents();
    } catch (error: any) {
      toast.error("Error al asignar incidencia");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveIncident = async () => {
    if (!selectedIncident) return;

    try {
      await incidentsService.resolveIncident(
        selectedIncident.incidentId,
        resolution.status,
      );
      toast.success("Incidencia resuelta");
      setIsResolveDialogOpen(false);
      setSelectedIncident(null);
      loadIncidents();
    } catch (error: any) {
      toast.error("Error al resolver incidencia");
    }
  };

  const getStatusBadge = (status: ItemStatus) => {
    const statusMap = {
      [ItemStatus.ACTIVE]: {
        text: "Activo",
        class: "bg-green-100 text-green-800",
      },
      [ItemStatus.PENDING]: {
        text: "Pendiente",
        class: "bg-yellow-100 text-yellow-800",
      },
      [ItemStatus.SUSPENDED]: {
        text: "Suspendido",
        class: "bg-red-100 text-red-800",
      },
      [ItemStatus.HIDDEN]: {
        text: "Oculto",
        class: "bg-gray-100 text-gray-800",
      },
      [ItemStatus.BANNED]: {
        text: "Prohibido",
        class: "bg-red-100 text-red-800",
      },
    };
    const statusInfo = statusMap[status];
    return <Badge className={statusInfo.class}>{statusInfo.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando incidencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <AlertTriangle className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Incidencias
          </h1>
          <p className="text-gray-600 mt-2">
            Administra incidencias y reports de la plataforma
          </p>
        </div>
      </div>

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
                  placeholder="Producto, vendedor..."
                  className="pl-10"
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
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
                  <SelectItem value={ItemStatus.PENDING}>Pendientes</SelectItem>
                  <SelectItem value={ItemStatus.SUSPENDED}>
                    Suspendidos
                  </SelectItem>
                  <SelectItem value={ItemStatus.BANNED}>Prohibidos</SelectItem>
                  <SelectItem value={ItemStatus.ACTIVE}>Activos</SelectItem>
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
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
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
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
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
              onClick={() => loadIncidents(filters)}
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
          <CardTitle>Incidencias ({incidents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Moderador</TableHead>
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
                        <p className="font-medium">{incident.item?.name}</p>
                        <p className="text-sm text-gray-600">
                          ID: {incident.itemId}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {incident.seller && (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>
                          {incident.seller.firstName} {incident.seller.lastName}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(incident.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(incident.reportedAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {incident.moderator ? (
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="text-sm">
                          {incident.moderator.firstName}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-orange-600">
                        <Clock className="h-3 w-3 mr-1" />
                        Sin asignar
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading === incident.incidentId}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!incident.moderatorId && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleAssignIncident(incident.incidentId)
                            }
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Asignar a mí
                          </DropdownMenuItem>
                        )}
                        {(incident.moderatorId === currentUser?.userId ||
                          currentUser?.role === UserRole.ADMIN) && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedIncident(incident);
                              setIsResolveDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolver
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {incidents.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron incidencias
              </h3>
              <p className="text-gray-600">
                No hay incidencias que coincidan con los filtros seleccionados
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Incident Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Incidencia</DialogTitle>
            <DialogDescription>
              Define el estado final y la resolución para esta incidencia.
            </DialogDescription>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{selectedIncident.item?.name}</h4>
                <p className="text-sm text-gray-600">
                  Vendedor: {selectedIncident.seller?.firstName}{" "}
                  {selectedIncident.seller?.lastName}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Estado Final</Label>
                <Select
                  value={resolution.status}
                  onValueChange={(value) =>
                    setResolution((prev) => ({
                      ...prev,
                      status: value as ItemStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ItemStatus.ACTIVE}>
                      Mantener Activo
                    </SelectItem>
                    <SelectItem value={ItemStatus.SUSPENDED}>
                      Suspender
                    </SelectItem>
                    <SelectItem value={ItemStatus.BANNED}>Prohibir</SelectItem>
                    <SelectItem value={ItemStatus.HIDDEN}>Ocultar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descripción de la Resolución</Label>
                <Textarea
                  placeholder="Explica las razones de esta decisión..."
                  value={resolution.description}
                  onChange={(e) =>
                    setResolution((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResolveDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleResolveIncident}>Resolver Incidencia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncidentsPage;


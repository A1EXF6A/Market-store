import { useAuthStore } from "@/store/authStore";
import type { Incident, Appeal } from "@/types";
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
  UserCheck as UserCheckIcon,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

/* ============================================================
   ✅ Tipo extendido para permitir appeals sin cambiar types globales
   ============================================================ */
type IncidentWithAppeals = Incident & {
  appeals?: Appeal[];
};

/* ============================================================
   COMPONENTE
   ============================================================ */
const IncidentsPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();

  const [incidents, setIncidents] = useState<IncidentWithAppeals[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<IncidentFilters>({});
  const [selectedIncident, setSelectedIncident] =
    useState<IncidentWithAppeals | null>(null);

  /** Modal resolve */
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);

  /** Modal appeal */
  const [isAppealDialogOpen, setIsAppealDialogOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);

  /** Estado de resolución */
  const [resolution, setResolution] = useState<{
    status: ItemStatus;
    description: string;
  }>({
    status: ItemStatus.ACTIVE,
    description: "",
  });

  const [actionLoading, setActionLoading] = useState<number | null>(null);

  /* ============================================================
     Cargar incidencias
     ============================================================ */
  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async (customFilters?: IncidentFilters) => {
    try {
      setLoading(true);
      const currentFilters =
        customFilters !== undefined ? customFilters : filters;

      const data = await incidentsService.getIncidents(currentFilters);

      setIncidents(data as IncidentWithAppeals[]);
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

  /* ============================================================
     Asignar incidencia
     ============================================================ */
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

  /* ============================================================
     Resolver incidencia
     ============================================================ */
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

  /* ============================================================
     Badges
     ============================================================ */
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

  const renderAppealBadge = (incident: IncidentWithAppeals) => {
    const appeals = incident.appeals ?? [];
    const hasPending = appeals.some((a) => !a.reviewed);

    if (hasPending)
      return (
        <Badge variant="outline" className="text-blue-700 border-blue-700">
          Apelación pendiente
        </Badge>
      );

    if (appeals.length > 0)
      return <span className="text-xs text-gray-500">Revisada</span>;

    return <span className="text-xs text-gray-400">Sin apelaciones</span>;
  };

  /* ============================================================
     Modal para ver apelación
     ============================================================ */
  const openAppealDialog = (incident: IncidentWithAppeals) => {
    const appeals = incident.appeals ?? [];
    if (!appeals.length) return;

    const lastAppeal = [...appeals].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

    setSelectedAppeal(lastAppeal);
    setIsAppealDialogOpen(true);
  };

  /* ============================================================
     Loader
     ============================================================ */
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  /* ============================================================
     MAIN RENDER
     ============================================================ */
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <AlertTriangle className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold">Gestión de Incidencias</h1>
          <p className="text-gray-600">Administra incidencias y apelaciones</p>
        </div>
      </div>

      {/* ============================================================
         TABLA
         ============================================================ */}
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
                <TableHead>Apelación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.incidentId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">
                          {incident.item?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {incident.itemId}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      {incident.seller?.firstName}{" "}
                      {incident.seller?.lastName}
                    </div>
                  </TableCell>

                  <TableCell>{getStatusBadge(incident.status)}</TableCell>

                  <TableCell>
                    {new Date(incident.reportedAt).toLocaleDateString()}
                  </TableCell>

                  <TableCell>
                    {incident.moderator ? (
                      <span className="text-sm">
                        {incident.moderator.firstName}
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-orange-600">
                        Sin asignar
                      </Badge>
                    )}
                  </TableCell>

                  {/* ===================== Apelación ===================== */}
                  <TableCell>{renderAppealBadge(incident)}</TableCell>

                  {/* ===================== Acciones ===================== */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        {/* Asignar */}
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

                        {/* Ver apelación */}
                        {((incident as IncidentWithAppeals).appeals?.length ??
                          0) > 0 && (
                          <DropdownMenuItem
                            onClick={() =>
                              openAppealDialog(
                                incident as IncidentWithAppeals,
                              )
                            }
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Ver Apelación
                          </DropdownMenuItem>
                        )}

                        {/* Resolver */}
                        {(incident.moderatorId === currentUser?.userId ||
                          currentUser?.role === UserRole.ADMIN) && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedIncident(
                                incident as IncidentWithAppeals,
                              );
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
        </CardContent>
      </Card>

      {/* ============================================================
         Modal Ver Apelación
         ============================================================ */}
      <Dialog open={isAppealDialogOpen} onOpenChange={setIsAppealDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apelación del vendedor</DialogTitle>
            <DialogDescription>
              Mensaje enviado para reconsiderar la sanción.
            </DialogDescription>
          </DialogHeader>

          {selectedAppeal && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded text-sm whitespace-pre-wrap">
                {selectedAppeal.reason}
              </div>
              <div className="text-xs text-gray-500">
                Fecha:{" "}
                {new Date(selectedAppeal.createdAt).toLocaleString()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsAppealDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================
         Modal Resolver Incidencia
         ============================================================ */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Incidencia</DialogTitle>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <strong>{selectedIncident.item?.name}</strong>
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
                    <SelectItem value={ItemStatus.BANNED}>
                      Prohibir
                    </SelectItem>
                    <SelectItem value={ItemStatus.HIDDEN}>
                      Ocultar
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  rows={3}
                  value={resolution.description}
                  onChange={(e) =>
                    setResolution((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
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
            <Button onClick={handleResolveIncident}>
              Resolver Incidencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncidentsPage;

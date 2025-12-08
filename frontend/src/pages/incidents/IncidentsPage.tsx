import { useAuthStore } from "@/store/authStore";
import type { Incident, Product } from "@/types";
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
import { usersService } from "@services/users";
import { productsService } from "@services/products";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  MoreHorizontal,
  FileText,
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
  const [isAppealDialogOpen, setIsAppealDialogOpen] = useState(false);
  const [moderators, setModerators] = useState<any[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignIncidentId, setAssignIncidentId] = useState<number | null>(null);
  const [selectedModeratorId, setSelectedModeratorId] = useState<number | undefined>(undefined);
  const [resolution, setResolution] = useState<{
    status: ItemStatus;
    description: string;
  }>({
    status: ItemStatus.ACTIVE,
    description: "",
  });

  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [incidentsPage, setIncidentsPage] = useState<number>(0);
  const [incidentsPerPage] = useState<number>(8);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productLoading, setProductLoading] = useState(false);

  /* ============================================================
     Cargar incidencias
     ============================================================ */
  useEffect(() => {
    loadIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusCounts = incidents.reduce<Record<string, number>>((acc, inc) => {
    const s = inc.status ?? "unknown";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const loadIncidents = async (customFilters?: IncidentFilters) => {
    try {
      setLoading(true);
      const currentFilters =
        customFilters !== undefined ? customFilters : filters;

      const data = await incidentsService.getIncidents(currentFilters);
      setIncidents(data);
      setIncidentsPage(0);
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

  const openAssignDialog = async (incidentId: number) => {
    try {
      setAssignIncidentId(incidentId);
      const mods = await usersService.getAll({ role: UserRole.MODERATOR });
      setModerators(mods || []);
      setSelectedModeratorId(mods?.[0]?.userId);
      setIsAssignDialogOpen(true);
    } catch (error: any) {
      toast.error("Error al obtener moderadores");
    }
  };

  const handleAdminAssign = async () => {
    if (!assignIncidentId || !selectedModeratorId) return;
    try {
      setActionLoading(assignIncidentId);
      await incidentsService.assignIncident(assignIncidentId, selectedModeratorId);
      toast.success("Incidencia asignada");
      setIsAssignDialogOpen(false);
      setAssignIncidentId(null);
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
      {/* Assign dialog for admins */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Moderador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Seleccionar moderador</Label>
              <Select
                value={selectedModeratorId?.toString()}
                onValueChange={(val) => setSelectedModeratorId(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un moderador" />
                </SelectTrigger>
                <SelectContent>
                  {moderators.map((m) => (
                    <SelectItem key={m.userId} value={m.userId.toString()}>
                      {m.firstName} {m.lastName} (ID: {m.userId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleAdminAssign} disabled={!selectedModeratorId}>
                Asignar
              </Button>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex items-center gap-4">
        <AlertTriangle className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold">Gestión de Incidencias</h1>
          <p className="text-gray-600">Administra incidencias y apelaciones</p>
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
                  <SelectItem value={ItemStatus.SUSPENDED}>
                    Suspendido
                  </SelectItem>
                  <SelectItem value={ItemStatus.BANNED}>Prohibido</SelectItem>
                  <SelectItem value={ItemStatus.HIDDEN}>Oculto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha inicio</Label>
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
              <Label htmlFor="endDate">Fecha fin</Label>
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
              className="flex items-center gap-2"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
              Limpiar
            </Button>
            <Button
              className="flex items-center gap-2"
              onClick={() => loadIncidents()}
            >
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

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
              {incidents.slice(incidentsPage * incidentsPerPage, (incidentsPage + 1) * incidentsPerPage).map((incident) => (
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
                      <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                        <UserCheckIcon className="h-4 w-4 text-green-600" />
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
                        <DropdownMenuItem
                          onClick={async () => {
                            const itemId = incident.itemId;
                            try {
                              setProductLoading(true);
                              let prod = incident.item as Product | undefined;
                              if (!prod) {
                                prod = await productsService.getById(itemId);
                              }
                              setSelectedProduct(prod || null);
                              setIsProductDialogOpen(true);
                            } catch (err: any) {
                              toast.error("Error al cargar el producto");
                            } finally {
                              setProductLoading(false);
                            }
                          }}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Ver Producto
                        </DropdownMenuItem>

                        {!incident.moderatorId && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                handleAssignIncident(incident.incidentId)
                              }
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Asignar a mí
                            </DropdownMenuItem>
                            {currentUser?.role === UserRole.ADMIN && (
                              <DropdownMenuItem
                                onClick={() => openAssignDialog(incident.incidentId)}
                              >
                                <User className="h-4 w-4 mr-2" />
                                Asignar a...
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        {(incident.moderatorId === currentUser?.userId ||
                          currentUser?.role === UserRole.ADMIN) && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedIncident(
                                incident as IncidentWithAppeals,
                              );
                              setIsResolveDialogOpen(true);
                            }}
                            disabled={incident.status !== ItemStatus.PENDING}
                            title={
                              incident.status !== ItemStatus.PENDING
                                ? "Solo se pueden resolver incidencias en estado Pendiente"
                                : undefined
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolver
                          </DropdownMenuItem>
                        )}
                        {incident.appeals && incident.appeals.length > 0 && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedIncident(incident);
                              setIsAppealDialogOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Apelaciones
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>

          {incidents.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Mostrando {incidentsPage * incidentsPerPage + 1} - {Math.min((incidentsPage + 1) * incidentsPerPage, incidents.length)} de {incidents.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIncidentsPage((p) => Math.max(0, p - 1))}
                  disabled={incidentsPage === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIncidentsPage((p) => Math.min(p + 1, Math.floor((incidents.length - 1) / incidentsPerPage)))}
                  disabled={(incidentsPage + 1) * incidentsPerPage >= incidents.length}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}

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

      {incidents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { key: ItemStatus.PENDING, label: "Pendientes", color: "text-yellow-600" },
            { key: ItemStatus.ACTIVE, label: "Activas", color: "text-green-600" },
            { key: ItemStatus.SUSPENDED, label: "Suspendidas", color: "text-red-600" },
            { key: ItemStatus.HIDDEN, label: "Ocultas", color: "text-gray-600" },
            { key: ItemStatus.BANNED, label: "Prohibidas", color: "text-red-700" },
          ].map((s) => (
            <Card key={s.key}>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${s.color}`}>{statusCounts[s.key] ?? 0}</div>
                  <p className="text-sm text-gray-600">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolve Incident Dialog */}
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
            <Button
              onClick={handleResolveIncident}
              disabled={selectedIncident?.status !== ItemStatus.PENDING}
            >
              Resolver Incidencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/* Appeals Dialog */}
        <Dialog open={isAppealDialogOpen} onOpenChange={setIsAppealDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apelaciones</DialogTitle>
              <DialogDescription>
                Revisa las apelaciones asociadas a esta incidencia.
              </DialogDescription>
            </DialogHeader>

            {selectedIncident ? (
              <div className="space-y-4">
                {selectedIncident.appeals &&
                selectedIncident.appeals.length > 0 ? (
                  selectedIncident.appeals.map((appeal) => (
                    <div key={appeal.appealId} className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm">{appeal.reason}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {new Date(appeal.createdAt).toLocaleString()}
                        </p>
                        <Badge className={appeal.reviewed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                          {appeal.reviewed ? "Revisada" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No hay apelaciones para esta incidencia.</p>
                )}
              </div>
            ) : (
              <p>No se ha seleccionado ninguna incidencia.</p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAppealDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      {/* Product Details Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Producto</DialogTitle>
            <DialogDescription>
              Información básica del producto y ubicación (si está disponible).
            </DialogDescription>
          </DialogHeader>

          {productLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
            </div>
          ) : selectedProduct ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-lg">{selectedProduct.name}</h4>
                <p className="text-sm text-gray-600">ID: {selectedProduct.itemId}</p>
                {selectedProduct.description && (
                  <p className="text-sm text-gray-700 mt-2">{selectedProduct.description}</p>
                )}
              </div>

              {selectedProduct.location && (
                <div className="w-full rounded overflow-hidden border">
                  <iframe
                    title="Ubicación del producto"
                    width="100%"
                    height="240"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      selectedProduct.location,
                    )}&output=embed`}
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          ) : (
            <p>No se encontró el producto.</p>
          )}

          <DialogFooter>
            {selectedProduct && (
              <a
                href={`/products/${selectedProduct.itemId}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button>Ir al producto</Button>
              </a>
            )}
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncidentsPage;

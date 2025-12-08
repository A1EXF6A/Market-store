import type { Incident } from "@/types";
import { ItemStatus } from "@/types";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import CreateAppealModal from "@components/ui/create-appeal-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { incidentsService } from "@services/incidents";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@components/ui/dropdown-menu";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

export default function MyIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [incidentsPage, setIncidentsPage] = useState<number>(0);
  const [incidentsPerPage] = useState<number>(5);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [appliedStatus, setAppliedStatus] = useState<string>("all");
  const [appliedStartDate, setAppliedStartDate] = useState<string>("");
  const [appliedEndDate, setAppliedEndDate] = useState<string>("");

  useEffect(() => {
    loadMyIncidents();
  }, []);

  // Reset page when applied filters change
  useEffect(() => {
    setIncidentsPage(0);
  }, [appliedStatus, appliedStartDate, appliedEndDate]);

  const filteredIncidents = useMemo<Incident[]>(() => {
    return incidents.filter((inc) => {
      if (appliedStatus !== "all" && inc.status !== appliedStatus) return false;
      if (appliedStartDate) {
        const s = new Date(appliedStartDate);
        const reported = new Date(inc.reportedAt);
        if (reported < s) return false;
      }
      if (appliedEndDate) {
        const e = new Date(appliedEndDate);
        const reported = new Date(inc.reportedAt);
        // include the whole day for endDate
        e.setHours(23, 59, 59, 999);
        if (reported > e) return false;
      }
      return true;
    });
  }, [incidents, appliedStatus, appliedStartDate, appliedEndDate]);

  const loadMyIncidents = async () => {
    try {
      const data = await incidentsService.getMyIncidents();
      setIncidents(data);
      setIncidentsPage(0);
    } catch (error: any) {
      toast.error("Error al cargar incidencias");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status?: ItemStatus) => {
    const variants = {
      [ItemStatus.ACTIVE]: { variant: "default" as const, label: "Activo" },
      [ItemStatus.SUSPENDED]: {
        variant: "destructive" as const,
        label: "Suspendido",
      },
      [ItemStatus.HIDDEN]: { variant: "secondary" as const, label: "Oculto" },
      [ItemStatus.PENDING]: {
        variant: "outline" as const,
        label: "Pendiente",
      },
      [ItemStatus.BANNED]: {
        variant: "destructive" as const,
        label: "Baneado",
      },
    };

    const config = (status ? variants[status] : undefined) || {
      variant: "secondary" as const,
      label: status ?? "Desconocido",
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status?: ItemStatus) => {
    switch (status) {
      case ItemStatus.ACTIVE:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case ItemStatus.SUSPENDED:
      case ItemStatus.BANNED:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case ItemStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const canAppeal = (incident: Incident) => {
    // Allow creating an appeal only when the INCIDENT status is PENDING
    const hasActiveAppeal = incident.appeals?.some((appeal) => !appeal.reviewed);
    const isPending = incident.status === ItemStatus.PENDING;
    return isPending && !hasActiveAppeal;
  };

  const handleCreateAppeal = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowAppealModal(true);
  };

  const handleAppealSuccess = () => {
    loadMyIncidents();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Cargando incidencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Mis Incidencias</h1>
        <p className="text-gray-600">
          Gestiona las incidencias relacionadas con tus productos y crea
          apelaciones cuando sea necesario.
        </p>
      </div>

      {filteredIncidents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tienes incidencias</h3>
            <p className="text-gray-600">
              Cuando haya incidencias relacionadas con tus productos,
              aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
            <CardHeader>
            <CardTitle>Incidencias de mis productos</CardTitle>
            <CardDescription>
              {filteredIncidents.length} incidencia{filteredIncidents.length !== 1 ? "s" : ""} {" "}
              encontrada{filteredIncidents.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-start gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Label>Estado</Label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value={ItemStatus.PENDING}>Pendiente</SelectItem>
                    <SelectItem value={ItemStatus.ACTIVE}>Activo</SelectItem>
                    <SelectItem value={ItemStatus.SUSPENDED}>Suspendido</SelectItem>
                    <SelectItem value={ItemStatus.HIDDEN}>Oculto</SelectItem>
                    <SelectItem value={ItemStatus.BANNED}>Prohibido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label>Fecha Inicio</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div className="flex items-center gap-2">
                <Label>Fecha Fin</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setAppliedStatus(statusFilter);
                    setAppliedStartDate(startDate);
                    setAppliedEndDate(endDate);
                  }}
                >Buscar</Button>
                <Button variant="outline" onClick={() => {
                  setStatusFilter("all");
                  setStartDate("");
                  setEndDate("");
                  setAppliedStatus("all");
                  setAppliedStartDate("");
                  setAppliedEndDate("");
                }}>Limpiar</Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Apelaciones</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.slice(incidentsPage * incidentsPerPage, (incidentsPage + 1) * incidentsPerPage).map((incident) => (
                  <TableRow key={incident.incidentId}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(incident.item?.status)}
                        <div>
                          <p className="font-medium">{incident.item?.name}</p>
                          <p className="text-sm text-gray-500">
                            ID: {incident.item?.itemId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(incident.item?.status)}
                    </TableCell>
                    <TableCell>
                      <p
                        className="max-w-xs truncate"
                        title={incident.description}
                      >
                        {incident.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {new Date(incident.reportedAt).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {incident.appeals?.length || 0}
                        </span>
                        {incident.appeals?.some(
                          (appeal) => !appeal.reviewed,
                        ) && (
                          <Badge variant="outline" className="text-xs">
                            Pendiente
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canAppeal(incident) ? (
                              <DropdownMenuItem onClick={() => handleCreateAppeal(incident)}>
                                Apelar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled>
                                {incident.appeals?.some((appeal) => !appeal.reviewed)
                                  ? "Apelación pendiente"
                                  : "No se puede apelar"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {/* No helper text: only the dropdown menu is shown */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                Mostrando {incidentsPage * incidentsPerPage + 1} - {Math.min((incidentsPage + 1) * incidentsPerPage, filteredIncidents.length)} de {filteredIncidents.length}
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
                  onClick={() => setIncidentsPage((p) => Math.min(p + 1, Math.floor((filteredIncidents.length - 1) / incidentsPerPage)))}
                  disabled={(incidentsPage + 1) * incidentsPerPage >= filteredIncidents.length}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateAppealModal
        incident={selectedIncident}
        isOpen={showAppealModal}
        onClose={() => setShowAppealModal(false)}
        onSuccess={handleAppealSuccess}
      />
    </div>
  );
}

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
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function MyIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );
  const [showAppealModal, setShowAppealModal] = useState(false);

  useEffect(() => {
    loadMyIncidents();
  }, []);

  const loadMyIncidents = async () => {
    try {
      const data = await incidentsService.getMyIncidents();
      setIncidents(data);
    } catch (error: any) {
      toast.error("Error al cargar incidencias");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: ItemStatus) => {
    const variants = {
      [ItemStatus.ACTIVE]: { variant: "default" as const, label: "Activo" },
      [ItemStatus.SUSPENDED]: {
        variant: "destructive" as const,
        label: "Suspendido",
      },
      [ItemStatus.HIDDEN]: { variant: "secondary" as const, label: "Oculto" },
      [ItemStatus.PENDING]: { variant: "outline" as const, label: "Pendiente" },
      [ItemStatus.BANNED]: {
        variant: "destructive" as const,
        label: "Baneado",
      },
    };

    const config = variants[status] || {
      variant: "secondary" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: ItemStatus) => {
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

      {incidents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tienes incidencias</h3>
            <p className="text-gray-600">
              Cuando haya incidencias relacionadas con tus productos, aparecerán
              aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Incidencias de mis productos</CardTitle>
            <CardDescription>
              {incidents.length} incidencia{incidents.length !== 1 ? "s" : ""}{" "}
              encontrada{incidents.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                {incidents.map((incident) => (
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
                        {new Date(incident.createdAt).toLocaleDateString(
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
                    <TableCell>
                      {canAppeal(incident) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateAppeal(incident)}
                        >
                          Apelar
                        </Button>
                      ) : (
                        // Show reason via native tooltip (title) and small helper text
                        <div>
                          <span
                            className="text-sm text-gray-500"
                            title={
                              incident.appeals?.some((appeal) => !appeal.reviewed)
                                ? "Tienes una apelación pendiente: espera la revisión del moderador."
                                : incident.status === ItemStatus.PENDING
                                ? "No se puede apelar: ya existe una apelación en revisión o la política lo impide."
                                : "Solo puedes crear apelaciones cuando la incidencia está en estado 'Pendiente'."
                            }
                          >
                            {incident.appeals?.some((appeal) => !appeal.reviewed)
                              ? "Apelación pendiente"
                              : "No se puede apelar"}
                          </span>
                          <div className="text-xs text-gray-400 mt-1">
                            {incident.appeals?.some((appeal) => !appeal.reviewed)
                              ? "Motivo: ya existe una apelación sin resolver."
                              : incident.status === ItemStatus.PENDING
                              ? "Motivo: revisa tus apelaciones previas o contacta al soporte."
                              : "Motivo: la incidencia no está en estado 'Pendiente'."}
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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


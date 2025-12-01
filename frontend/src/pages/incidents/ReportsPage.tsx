import type { Report, Appeal } from "@/types";
import { ReportType } from "@/types";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { incidentsService, type ReportFilters } from "@services/incidents";
import {
  AlertTriangle,
  Ban,
  Calendar,
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
  X,
  MoreHorizontal,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Textarea } from "@components/ui/textarea";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@components/ui/dropdown-menu";

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [activeTab, setActiveTab] = useState("reports");

  // State to control the create-incident modal triggered from actions menu
  const [createDialogOpenFor, setCreateDialogOpenFor] = useState<number | null>(null);
  const [createDescription, setCreateDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const clearFilters = async () => {
    setFilters({});
    await loadData({});
  };

  const loadData = async (customFilters?: ReportFilters) => {
    try {
      setLoading(true);
      const currentFilters = customFilters !== undefined ? customFilters : filters;
      if (activeTab === "reports") {
        const data = await incidentsService.getReports(currentFilters);
        setReports(data);
      } else if (activeTab === "appeals") {
        const data = await incidentsService.getAppeals();
        setAppeals(data);
      }
    } catch (error: any) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const selectedReport = createDialogOpenFor !== null ? reports.find(r => r.reportId === createDialogOpenFor) : null;

  const handleCreateIncident = async () => {
    if (!selectedReport) return;
    try {
      setCreateLoading(true);
      await incidentsService.createIncidentFromReport(selectedReport.reportId, { description: createDescription });
      toast.success("Incidencia creada");
      setCreateDialogOpenFor(null);
      setCreateDescription("");
      loadData();
    } catch (error: any) {
      toast.error("Error al crear incidencia");
    } finally {
      setCreateLoading(false);
    }
  };
  const getReportTypeBadge = (type: ReportType) => {
    const typeMap: Record<ReportType, { text: string; class: string; icon: React.ComponentType<any> }> = {
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
          <p className="text-gray-600 mt-2">Gestiona reportes</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Reportes
            </TabsTrigger>
            <TabsTrigger value="appeals" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Apelaciones
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
                        <div className="flex gap-2 justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/products/${report.itemId}`} className="flex items-center">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Revisar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setCreateDialogOpenFor(report.reportId)} className="flex items-center">
                                <Shield className="h-4 w-4 mr-2" />
                                Crear Incidencia
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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

        <TabsContent value="appeals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apelaciones ({appeals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead>Apelación ID</TableHead>
                      <TableHead>Incidencia</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {appeals.map((appeal) => (
                    <TableRow key={appeal.appealId}>
                      <TableCell>
                        <div className="font-medium">{appeal.appealId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{appeal.incidentId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {(
                            // prefer seller email if provided by API, fallback to seller object or id
                            // @ts-ignore
                            appeal.sellerEmail || (appeal as any).seller?.email || appeal.sellerId
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-600 line-clamp-2">{appeal.reason}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-600">
                          {new Date(appeal.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {appeal.reviewed ? (
                          <Badge className="bg-green-100 text-green-800">Revisada</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                        )}
                      </TableCell>
                    
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {appeals.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay apelaciones</h3>
                  <p className="text-gray-600">No se encontraron apelaciones en el sistema.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Incident Modal (controlled by actions menu) */}
      <Dialog open={createDialogOpenFor !== null} onOpenChange={(open) => { if (!open) { setCreateDialogOpenFor(null); setCreateDescription(""); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <DialogTitle>Crear Incidencia desde Reporte</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">Revisa la información del reporte y añade una descripción adicional si lo deseas.</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {selectedReport ? (
              <>
                <div className="bg-gray-50 border border-gray-100 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Producto: <span className="font-medium text-gray-900">{
                        // prefer product name if provided by API, fallback to product object name or id
                        // @ts-ignore
                        (selectedReport.itemName) || (selectedReport as any).item?.name || `ID ${selectedReport.itemId}`
                      }</span></p>
                      <p className="text-sm text-gray-600">Reportado por: <span className="font-medium">{
                        // prefer buyer email if provided by API, fallback to buyer object or id
                        // @ts-ignore
                        selectedReport.buyerEmail || (selectedReport as any).buyer?.email || selectedReport.buyerId
                      }</span></p>
                    </div>
                    <div className="text-sm text-gray-500">{new Date(selectedReport.reportedAt).toLocaleDateString()}</div>
                  </div>

                  {selectedReport.comment && (
                    <div className="mt-3 px-1">
                      <h4 className="text-xs font-semibold text-gray-700">Comentario del reportante</h4>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.comment}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Descripción (opcional)</Label>
                  <Textarea
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Añade contexto adicional para la incidencia (p. ej. pasos para reproducir, evidencias, etc.)"
                    className="min-h-[120px]"
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">Máx. 1000 caracteres</p>
                    <p className="text-xs text-gray-500">{createDescription.length}/1000</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setCreateDialogOpenFor(null); setCreateDescription(""); }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateIncident} disabled={createLoading}>
                    {createLoading ? "Creando..." : "Crear Incidencia"}
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsPage;


import type { Report, Appeal, Product, Incident } from "@/types";
import { ReportType, ItemStatus } from "@/types";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { productsService } from "@services/products";
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
  MapPin,
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
  const [appealsPage, setAppealsPage] = useState<number>(0);
  const [appealsPerPage] = useState<number>(5);
  const [reportsPage, setReportsPage] = useState<number>(0);
  const [reportsPerPage] = useState<number>(10);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [resolution, setResolution] = useState<{ status: ItemStatus; description: string }>({ status: ItemStatus.ACTIVE, description: "" });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [activeTab, setActiveTab] = useState("reports");

  // State to control the create-incident modal triggered from actions menu
  const [createDialogOpenFor, setCreateDialogOpenFor] = useState<number | null>(null);
  const [createDescription, setCreateDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  // State to control product details modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productModalReportId, setProductModalReportId] = useState<number | null>(null);
  const [incidentsCountMap, setIncidentsCountMap] = useState<Record<number, number>>({});

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
        setReportsPage(0);
        // fetch counts per report using dedicated endpoint to avoid large payloads
        try {
          const counts = await Promise.all(
            data.map(async (r) => {
              try {
                const res = await incidentsService.getReportIncidentsCount(r.reportId);
                return { itemId: r.itemId, count: res.count };
              } catch (err) {
                return { itemId: r.itemId, count: 0 };
              }
            }),
          );
          const map: Record<number, number> = {};
          counts.forEach((c) => {
            if (c.itemId) map[c.itemId] = c.count;
          });
          setIncidentsCountMap(map);
        } catch (e) {
          setIncidentsCountMap({});
        }
      } else if (activeTab === "appeals") {
        const data = await incidentsService.getAppeals();
        setAppeals(data);
        setAppealsPage(0);
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

  const openProductDetails = async (report: Report) => {
    try {
      setProductLoading(true);
      setProductModalReportId(report.reportId);
      // If the API already included the item object or name, use it; otherwise fetch by id
      // @ts-ignore
      if ((report as any).item) {
        // @ts-ignore
        setSelectedProduct((report as any).item as Product);
      } else if (report.itemId) {
        const prod = await productsService.getById(report.itemId);
        setSelectedProduct(prod);
      } else {
        setSelectedProduct(null);
      }
    } catch (error: any) {
      toast.error("Error al cargar los detalles del producto");
    } finally {
      setProductLoading(false);
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
                    <TableHead className="w-[120px] text-center">Incidencias</TableHead>
                    <TableHead>Reportado por</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Comentario</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.slice(reportsPage * reportsPerPage, (reportsPage + 1) * reportsPerPage).map((report) => (
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
                              onClick={() => openProductDetails(report)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver producto
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {incidentsCountMap[report.itemId] ?? ((report as any).incidentCount ?? (report as any).incidents?.length ?? 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{
                            // prefer buyer email if provided by API, fallback to buyer object or id
                            // @ts-ignore
                            (report as any).buyerEmail || (report as any).buyer?.email || `ID ${report.buyerId}`
                          }</span>
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
                              <DropdownMenuItem onClick={() => openProductDetails(report)} className="flex items-center">
                                <Eye className="h-4 w-4 mr-2" />
                                Revisar
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

              {reports.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {reportsPage * reportsPerPage + 1} - {Math.min((reportsPage + 1) * reportsPerPage, reports.length)} de {reports.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReportsPage((p) => Math.max(0, p - 1))}
                      disabled={reportsPage === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReportsPage((p) => Math.min(p + 1, Math.floor((reports.length - 1) / reportsPerPage)))}
                      disabled={(reportsPage + 1) * reportsPerPage >= reports.length}
                    >
                      Siguiente
                    </Button>
                  </div>
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

        {/* Resolve Incident Dialog (used from appeals 'Revisar') */}
        <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolver Incidencia</DialogTitle>
              <DialogDescription>Define el estado final y la resolución para esta incidencia.</DialogDescription>
            </DialogHeader>

            {selectedIncident && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">{selectedIncident.item?.name || `ID ${selectedIncident.itemId}`}</h4>
                  <p className="text-sm text-gray-600">Vendedor: {selectedIncident.seller?.firstName} {selectedIncident.seller?.lastName}</p>
                </div>

                <div className="space-y-2">
                  <Label>Estado Final</Label>
                  <Select
                    value={resolution.status}
                    onValueChange={(value) => setResolution((prev) => ({ ...prev, status: value as ItemStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ItemStatus.ACTIVE}>Mantener Activo</SelectItem>
                      <SelectItem value={ItemStatus.SUSPENDED}>Suspender</SelectItem>
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
                    onChange={(e) => setResolution((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)}>Cancelar</Button>
              <Button
                onClick={async () => {
                  if (!selectedIncident) return;
                  try {
                    await incidentsService.resolveIncident(selectedIncident.incidentId, resolution.status);
                    toast.success('Incidencia resuelta');
                    setIsResolveDialogOpen(false);
                    setSelectedIncident(null);
                    loadData();
                  } catch (err:any) {
                    toast.error('Error al resolver incidencia');
                  }
                }}
                disabled={selectedIncident?.status !== ItemStatus.PENDING}
                title={selectedIncident?.status !== ItemStatus.PENDING ? 'Solo se pueden resolver incidencias en estado Pendiente' : undefined}
              >Resolver Incidencia</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TabsContent value="appeals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apelaciones ({appeals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {appeals.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay apelaciones</h3>
                  <p className="text-gray-600">No se encontraron apelaciones en el sistema.</p>
                </div>
              ) : (
                <>
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
                      {appeals.slice(appealsPage * appealsPerPage, (appealsPage + 1) * appealsPerPage).map((appeal) => (
                        <TableRow key={appeal.appealId}>
                          <TableCell>
                            <div className="font-medium">{appeal.appealId}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">{appeal.incidentId}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {(appeal as any).sellerEmail || (appeal as any).seller?.email || appeal.sellerId}
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

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Mostrando {appealsPage * appealsPerPage + 1} - {Math.min((appealsPage + 1) * appealsPerPage, appeals.length)} de {appeals.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAppealsPage((p) => Math.max(0, p - 1))}
                        disabled={appealsPage === 0}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAppealsPage((p) => Math.min(p + 1, Math.floor((appeals.length - 1) / appealsPerPage)))}
                        disabled={(appealsPage + 1) * appealsPerPage >= appeals.length}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {appeals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {appeals.filter((a) => !a.reviewed).length}
                    </div>
                    <p className="text-sm text-gray-600">Apelaciones Pendientes</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {appeals.filter((a) => a.reviewed).length}
                    </div>
                    <p className="text-sm text-gray-600">Apelaciones Resueltas</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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

      {/* Product Details Modal (opened from report actions) */}
      <Dialog open={selectedProduct !== null} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <Package className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <DialogTitle>{selectedProduct ? selectedProduct.name : (productLoading ? 'Cargando...' : 'Detalle del producto')}</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">Detalles del producto reportado</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {productLoading && (
              <div className="text-center py-6">Cargando producto...</div>
            )}

            {selectedProduct && !productLoading && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedProduct.name}</h3>
                      {selectedProduct.category && <p className="text-sm text-gray-500">{selectedProduct.category}</p>}
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">{selectedProduct.publishedAt ? new Date(selectedProduct.publishedAt).toLocaleDateString() : ''}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="text-xl font-bold text-gray-900">{typeof selectedProduct.price === 'number' ? `$${selectedProduct.price}` : '—'}</div>
                    <div>
                      {selectedProduct.status === 'active' && <Badge className="bg-green-100 text-green-800">Activo</Badge>}
                      {selectedProduct.status === 'suspended' && <Badge className="bg-red-100 text-red-800">Suspendido</Badge>}
                      {selectedProduct.status === 'hidden' && <Badge className="bg-gray-100 text-gray-800">Oculto</Badge>}
                      {selectedProduct.status === 'pending' && <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>}
                      {selectedProduct.status === 'banned' && <Badge className="bg-red-100 text-red-800">Baneado</Badge>}
                    </div>
                  </div>

                    {/* Seller information removed per UX request */}

                  {selectedProduct.location && (
                    <div className="mt-3">
                      <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Ubicación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="block rounded-lg overflow-hidden aspect-video">
                            <iframe
                              title={`map-${selectedProduct.itemId}`}
                              src={`https://www.google.com/maps?q=${encodeURIComponent(selectedProduct.location)}&output=embed`}
                              className="w-full h-full"
                              loading="lazy"
                            />
                          </div>

                          <div className="flex items-center text-gray-700 gap-2">
                            <MapPin className="h-4 w-4" />
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedProduct.location)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="underline hover:text-gray-900 text-sm"
                              title="Ver en Google Maps"
                            >
                              {selectedProduct.location}
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {selectedProduct.description && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700">Descripción</h4>
                      <p className="text-sm text-gray-600 mt-1">{selectedProduct.description}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-4">
                    <Link to={`/products/${selectedProduct.itemId}`}>
                      <Button variant="outline">Ir al producto</Button>
                    </Link>
                    <Button onClick={() => { if (productModalReportId) setCreateDialogOpenFor(productModalReportId); setSelectedProduct(null); }}>Crear Incidencia</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsPage;


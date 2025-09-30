import React, { useState, useEffect } from 'react';
import { incidentsService, type ReportFilters } from '../../services/incidents';
import type { Report } from '../../types';
import { ReportType } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Flag, 
  Search, 
  Filter, 
  Calendar,
  User,
  Package,
  MessageSquare,
  AlertTriangle,
  Trash,
  Ban,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({});

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await incidentsService.getReports(filters);
      setReports(data);
    } catch (error: any) {
      toast.error('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  const getReportTypeBadge = (type: ReportType) => {
    const typeMap = {
      [ReportType.SPAM]: { text: 'Spam', class: 'bg-orange-100 text-orange-800', icon: Trash },
      [ReportType.INAPPROPRIATE]: { text: 'Inapropiado', class: 'bg-red-100 text-red-800', icon: Ban },
      [ReportType.ILLEGAL]: { text: 'Ilegal', class: 'bg-red-100 text-red-800', icon: AlertTriangle },
      [ReportType.OTHER]: { text: 'Otro', class: 'bg-gray-100 text-gray-800', icon: Flag },
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
        <Flag className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Reportes</h1>
          <p className="text-gray-600 mt-2">
            Revisa y gestiona los reportes enviados por los usuarios
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Producto, comentario..."
                  className="pl-10"
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Reporte</Label>
              <Select 
                value={filters.type || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  type: value === 'all' ? undefined : value as ReportType 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value={ReportType.SPAM}>Spam</SelectItem>
                  <SelectItem value={ReportType.INAPPROPRIATE}>Inapropiado</SelectItem>
                  <SelectItem value={ReportType.ILLEGAL}>Ilegal</SelectItem>
                  <SelectItem value={ReportType.OTHER}>Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                        <p className="font-medium">Producto ID: {report.itemId}</p>
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
                      <span className="text-gray-400 text-sm">Sin comentario</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(report.reportedAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
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
                  {reports.filter(r => r.type === ReportType.SPAM).length}
                </div>
                <p className="text-sm text-gray-600">Spam</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {reports.filter(r => r.type === ReportType.INAPPROPRIATE).length}
                </div>
                <p className="text-sm text-gray-600">Inapropiado</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {reports.filter(r => r.type === ReportType.ILLEGAL).length}
                </div>
                <p className="text-sm text-gray-600">Ilegal</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {reports.filter(r => r.type === ReportType.OTHER).length}
                </div>
                <p className="text-sm text-gray-600">Otros</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
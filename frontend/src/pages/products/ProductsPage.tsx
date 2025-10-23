import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productsService } from "../../services/products";
import { API_BASE } from "../../services/api";
import type { Product, ProductFilters } from "../../types";
import { ItemType, UserRole } from "../../types";
import { useAuthStore } from "../../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MapPin, 
  DollarSign, 
  Search, 
  Filter, 
  MoreHorizontal,
  Package,
  Eye,
  EyeOff,
  AlertTriangle,
  Ban,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const { user } = useAuthStore();

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.MODERATOR;

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getAll(filters);
      setProducts(data);
    } catch (error: any) {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (productId: number) => {
    try {
      await productsService.toggleFavorite(productId);
      toast.success("Favorito actualizado");
    } catch (error: any) {
      toast.error("Error al actualizar favorito");
    }
  };

  const handleProductAction = async (productId: number, action: string, reason?: string) => {
    try {
      setActionLoading(productId);
      
      switch (action) {
        case 'hide':
          await productsService.hideProduct(productId, reason || 'Oculto por administrador');
          toast.success("Producto oculto");
          break;
        case 'suspend':
          await productsService.suspendProduct(productId, reason || 'Suspendido por administrador');
          toast.success("Producto suspendido");
          break;
        case 'ban':
          await productsService.banProduct(productId, reason || 'Baneado por administrador');
          toast.success("Producto baneado");
          break;
        case 'activate':
          await productsService.activateProduct(productId);
          toast.success("Producto activado");
          break;
      }
      
      loadProducts();
    } catch (error: any) {
      toast.error("Error al actualizar producto");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { text: "Activo", class: "bg-green-100 text-green-800" },
      pending: { text: "Pendiente", class: "bg-yellow-100 text-yellow-800" },
      suspended: { text: "Suspendido", class: "bg-red-100 text-red-800" },
      hidden: { text: "Oculto", class: "bg-gray-100 text-gray-800" },
      banned: { text: "Baneado", class: "bg-red-100 text-red-800" },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.active;
    return <Badge className={statusInfo.class}>{statusInfo.text}</Badge>;
  };

  const getTypeBadge = (type: ItemType) => {
    return type === ItemType.PRODUCT ? (
      <Badge variant="outline">Producto</Badge>
    ) : (
      <Badge variant="outline">Servicio</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Package className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? "Gestión de Productos" : "Productos"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdmin 
              ? "Administra productos y servicios en la plataforma"
              : "Explora nuestro catálogo de productos y servicios"
            }
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
              <Label htmlFor="search">Buscar Producto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nombre del producto..."
                  className="pl-10"
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    type: value === "all" ? undefined : (value as ItemType),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value={ItemType.PRODUCT}>Productos</SelectItem>
                  <SelectItem value={ItemType.SERVICE}>Servicios</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minPrice">Precio Mínimo</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="0"
                value={filters.minPrice || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    minPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                placeholder="Ciudad, región..."
                value={filters.location || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, location: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Productos ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.itemId}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                        {product.photos.length > 0 ? (
                          <img
                            src={`${API_BASE}${product.photos[0].url}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mr-1" />
                            {product.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(product.type)}</TableCell>
                  <TableCell>
                    {product.price ? (
                      <div className="flex items-center text-green-600 font-semibold">
                        <DollarSign className="h-4 w-4" />
                        {product.price.toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(product.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(product.publishedAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user?.role === UserRole.BUYER && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleFavorite(product.itemId)}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      )}
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/products/${product.itemId}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Link>
                      </Button>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoading === product.itemId}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {product.status === 'active' ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleProductAction(product.itemId, 'hide', 'Oculto por administrador')
                                  }
                                  className="text-orange-600"
                                >
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Ocultar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleProductAction(product.itemId, 'suspend', 'Suspendido por violación de términos')
                                  }
                                  className="text-red-600"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Suspender
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleProductAction(product.itemId, 'ban', 'Baneado por contenido inapropiado')
                                  }
                                  className="text-red-600"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Banear
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleProductAction(product.itemId, 'activate')
                                }
                                className="text-green-600"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Activar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {products.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron productos
              </h3>
              <p className="text-gray-600">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsPage;
import { useAuthStore } from "@/store/authStore";
import type { Product, ProductFilters } from "@/types";
import { ItemType, UserRole } from "@/types";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { ProductCard } from "@components/ui/product-card";
import { ReportProductModal } from "@components/ui/report-product-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { productsService } from "@services/products";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  AlertTriangle,
  Ban,
  Eye,
  EyeOff,
  Filter,
  Flag,
  MoreHorizontal,
  Package,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    productId: number;
    productName: string;
  }>({
    isOpen: false,
    productId: 0,
    productName: "",
  });
  const { user } = useAuthStore();

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.MODERATOR;

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProducts = async (customFilters?: ProductFilters) => {
    try {
      setLoading(true);
      const currentFilters = customFilters !== undefined ? customFilters : filters;
      const data = await productsService.getAll(currentFilters);
      setProducts(data);
    } catch (error: any) {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = async () => {
    setFilters({});
    await loadProducts({});
  };

  const handleToggleFavorite = async (productId: number) => {
    try {
      await productsService.toggleFavorite(productId);
      toast.success("Favorito actualizado");
    } catch (error: any) {
      toast.error("Error al actualizar favorito");
    }
  };

  const handleProductAction = async (
    productId: number,
    action: string,
    reason?: string,
  ) => {
    try {
      setActionLoading(productId);

      switch (action) {
        case "hide":
          await productsService.hideProduct(
            productId,
            reason || "Oculto por administrador",
          );
          toast.success("Producto oculto");
          break;
        case "suspend":
          await productsService.suspendProduct(
            productId,
            reason || "Suspendido por administrador",
          );
          toast.success("Producto suspendido");
          break;
        case "ban":
          await productsService.banProduct(
            productId,
            reason || "Baneado por administrador",
          );
          toast.success("Producto baneado");
          break;
        case "activate":
          await productsService.activateProduct(productId);
          toast.success("Producto activado");
          break;
      }

      await loadProducts();
    } catch (error: any) {
      toast.error("Error al actualizar producto");
    } finally {
      setActionLoading(null);
    }
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
              : "Explora nuestro catálogo de productos y servicios"}
          </p>
        </div>
      </div>

      {/* Unified filters: show status filter for admins inside the filters card */}
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
                <Input id="search" placeholder="Nombre del producto..." className="pl-10" value={filters.search || ""} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filters.type || "all"} onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value === "all" ? undefined : (value as ItemType) }))}>
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
              <Label htmlFor="category">Categoría</Label>
              <Input id="category" placeholder="Ej: Electrónicos, Ropa..." value={filters.category || ""} onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input id="location" placeholder="Ciudad, región..." value={filters.location || ""} onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {isAdmin && (
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={filters.status || "all"} onValueChange={(value) => {
                  const v = value === "all" ? undefined : value;
                  setFilters((prev) => ({ ...prev, status: v as any }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="suspended">Suspendidos</SelectItem>
                    <SelectItem value="hidden">Ocultos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="banned">Baneados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="minPrice">Precio Mínimo</Label>
              <Input id="minPrice" type="number" placeholder="0" value={filters.minPrice || ""} onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value ? parseFloat(e.target.value) : undefined }))} />
            </div>

            <div className="flex items-end justify-end">
              <div className="flex gap-2">
                <Button onClick={clearFilters} variant="outline" className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Limpiar
                </Button>
                <Button onClick={() => loadProducts()} className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Productos ({products.length})</h2>
          {isAdmin && <div className="text-sm text-gray-600">Vista de administrador - Acciones disponibles en cada producto</div>}
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron productos</h3>
              <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.filter((product) => product.availability).map((product) => (
              <div key={product.itemId} className="relative">
                <ProductCard product={product} onToggleFavorite={handleToggleFavorite} userRole={user?.role} showActions={!isAdmin} />

                {/* Admin actions overlay */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white shadow-sm" disabled={actionLoading === product.itemId}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/products/${product.itemId}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setReportModal({ isOpen: true, productId: product.itemId, productName: product.name })} className="text-blue-600">
                          <Flag className="h-4 w-4 mr-2" />
                          Reportar
                        </DropdownMenuItem>
                        {product.status === "active" ? (
                          <>
                            <DropdownMenuItem onClick={() => handleProductAction(product.itemId, "hide", "Oculto por administrador")} className="text-orange-600">
                              <EyeOff className="h-4 w-4 mr-2" />
                              Ocultar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleProductAction(product.itemId, "suspend", "Suspendido por violación de términos")} className="text-red-600">
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Suspender
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleProductAction(product.itemId, "ban", "Baneado por contenido inapropiado")} className="text-red-600">
                              <Ban className="h-4 w-4 mr-2" />
                              Banear
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => handleProductAction(product.itemId, "activate")} className="text-green-600">
                            <Eye className="h-4 w-4 mr-2" />
                            Activar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportProductModal isOpen={reportModal.isOpen} onClose={() => setReportModal({ isOpen: false, productId: 0, productName: "" })} productId={reportModal.productId} productName={reportModal.productName} />
    </div>
  );
};

export default ProductsPage;


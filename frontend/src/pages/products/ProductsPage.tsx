import { useAuthStore } from "@/store/authStore";
import type { Product, ProductFilters } from "@/types";
import { ItemType, UserRole, ItemStatus } from "@/types";
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
  ArrowUp,
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

  const isAdmin =
    user?.role === UserRole.ADMIN || user?.role === UserRole.MODERATOR;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (customFilters?: ProductFilters) => {
    try {
      setLoading(true);
      const currentFilters =
        customFilters !== undefined ? customFilters : filters;
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
      <div className="min-h-[70vh] flex justify-center items-center">
        <div className="text-center space-y-4 animate-fadeInUp">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto shadow-glow-sm"></div>
            <Package className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">Cargando productos...</p>
            <p className="text-sm text-muted-foreground">Esto solo tomará un momento</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-fadeInUp">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl glass-effect p-8 shadow-glow">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-slate-50/50 dark:from-blue-950/20 dark:to-slate-950/20"></div>
        <div className="relative flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-blue-500 text-white shadow-lg">
            <Package className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
              {isAdmin ? "🛡️ Gestión de Productos" : "🛍️ Productos"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isAdmin
                ? "Administra productos y servicios en la plataforma"
                : "Explora nuestro catálogo de productos y servicios"}
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <Card className="glass-effect shadow-glow border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 p-1">
          <CardHeader className="bg-background/80 backdrop-blur-sm rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="space-y-3 group">
              <Label htmlFor="search" className="text-sm font-medium group-hover:text-blue-600 transition-colors">Buscar Producto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                <Input
                  id="search"
                  placeholder="Nombre del producto..."
                  className="pl-10 hover:border-blue-300 focus:border-blue-500 transition-colors"
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3 group">
              <Label className="text-sm font-medium group-hover:text-blue-600 transition-colors">Tipo</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    type: value === "all" ? undefined : (value as ItemType),
                  }))
                }
              >
                <SelectTrigger className="hover:border-blue-300 focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent className="glass-effect">
                  <SelectItem value="all">📦 Todos</SelectItem>
                  <SelectItem value={ItemType.PRODUCT}>🎁 Productos</SelectItem>
                  <SelectItem value={ItemType.SERVICE}>🔧 Servicios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isAdmin && (
              <div className="space-y-3 group">
                <Label className="text-sm font-medium group-hover:text-blue-600 transition-colors">Estado</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value === "all" ? undefined : (value as ItemStatus),
                    }))
                  }
                >
                  <SelectTrigger className="hover:border-blue-300 focus:border-blue-500 transition-colors">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent className="glass-effect">
                    <SelectItem value="all">📋 Todos</SelectItem>
                    <SelectItem value={ItemStatus.ACTIVE}>✅ Activo</SelectItem>
                    <SelectItem value={ItemStatus.SUSPENDED}>⏸️ Suspendido</SelectItem>
                    <SelectItem value={ItemStatus.HIDDEN}>👁️ Oculto</SelectItem>
                    <SelectItem value={ItemStatus.PENDING}>⏳ Pendiente</SelectItem>
                    <SelectItem value={ItemStatus.BANNED}>❌ Baneado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3 group">
              <Label htmlFor="category" className="text-sm font-medium group-hover:text-blue-600 transition-colors">Categoría</Label>
              <Input
                id="category"
                placeholder="Ej: Electrónicos, Ropa..."
                className="hover:border-blue-300 focus:border-blue-500 transition-colors"
                value={filters.category || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
              />
            </div>

            <div className="space-y-3 group">
              <Label htmlFor="minPrice" className="text-sm font-medium group-hover:text-blue-600 transition-colors">Precio Mínimo</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="0"
                  className="pl-8 hover:border-blue-300 focus:border-blue-500 transition-colors"
                  value={filters.minPrice || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minPrice: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3 group">
              <Label htmlFor="location" className="text-sm font-medium group-hover:text-blue-600 transition-colors">Ubicación</Label>
              <Input
                id="location"
                placeholder="Ciudad, región..."
                className="hover:border-blue-300 focus:border-blue-500 transition-colors"
                value={filters.location || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, location: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border/50">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/20 transition-all duration-200"
            >
              <X className="h-4 w-4" />
              Limpiar Filtros
            </Button>
            <Button
              onClick={() => loadProducts()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transition-all duration-200"
            >
              <Search className="h-4 w-4" />
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Products Grid */}
      <div className="space-y-6">
        {/* Products Header */}
        <div className="glass-effect rounded-xl p-6 shadow-glow border-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  Productos Disponibles
                </h2>
                <p className="text-sm text-muted-foreground">
                  {products.length} {products.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                </p>
              </div>
            </div>
            {isAdmin && (
              <div className="glass-effect rounded-lg p-3 border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 animate-fadeInRight">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-sm font-medium">🛡️ Vista de Administrador</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Acciones disponibles en cada producto
                </p>
              </div>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          /* Enhanced Empty State */
          <Card className="glass-effect border-0 shadow-glow animate-fadeInScale">
            <CardContent className="text-center py-16 px-8">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative p-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto w-fit">
                  <Package className="h-16 w-16 text-blue-500" />
                </div>
              </div>
              <div className="space-y-4 animate-fadeInUp">
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  🔍 No se encontraron productos
                </h3>
                <div className="max-w-md mx-auto space-y-2">
                  <p className="text-muted-foreground">
                    No hay productos que coincidan con tus criterios de búsqueda.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Intenta ajustar los filtros o explorar otras categorías.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-6">
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="glass-effect hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/20"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpiar Filtros
                  </Button>
                  <Button
                    onClick={() => loadProducts({})}
                    className="bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transition-all duration-200"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Ver Todos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Products Grid with enhanced styling */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeInUp">
              {products
                .filter((product) => product.availability)
                .map((product, index) => (
                  <div 
                    key={product.itemId} 
                    className="relative animate-fadeInScale hover-lift group"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <ProductCard
                      product={product}
                      onToggleFavorite={handleToggleFavorite}
                      userRole={user?.role}
                      showActions={!isAdmin}
                    />

                    {/* Enhanced Admin actions overlay */}
                    {isAdmin && (
                      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="glass-effect bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-800 shadow-glow border-0 hover:scale-110 transition-all duration-200"
                              disabled={actionLoading === product.itemId}
                            >
                              {actionLoading === product.itemId ? (
                                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-effect border-0 shadow-glow animate-fadeInScale">
                            <DropdownMenuItem asChild className="hover:bg-blue-50 dark:hover:bg-blue-950/20">
                              <Link to={`/products/${product.itemId}`} className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setReportModal({
                                  isOpen: true,
                                  productId: product.itemId,
                                  productName: product.name,
                                })
                              }
                              className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer"
                            >
                              <Flag className="h-4 w-4 mr-2" />
                              Reportar
                            </DropdownMenuItem>
                            {product.status === "active" ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleProductAction(
                                      product.itemId,
                                      "hide",
                                      "Oculto por administrador",
                                    )
                                  }
                                  className="text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 cursor-pointer"
                                >
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Ocultar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleProductAction(
                                      product.itemId,
                                      "suspend",
                                      "Suspendido por violación de términos",
                                    )
                                  }
                                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Suspender
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleProductAction(
                                      product.itemId,
                                      "ban",
                                      "Baneado por contenido inapropiado",
                                    )
                                  }
                                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Banear
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleProductAction(
                                    product.itemId,
                                    "activate",
                                  )
                                }
                                className="text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 cursor-pointer"
                              >
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
          </>
        )}
      </div>

      {/* Report Modal */}
      <ReportProductModal
        isOpen={reportModal.isOpen}
        onClose={() =>
          setReportModal({ isOpen: false, productId: 0, productName: "" })
        }
        productId={reportModal.productId}
        productName={reportModal.productName}
      />

      {/* Enhanced Fixed bottom button: Volver al inicio */}
      <div className="fixed bottom-6 right-6 z-50 animate-fadeInScale">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full p-4 shadow-lg glass-effect bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-800 border-0 hover:scale-110 transition-all duration-300 group"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Ir al inicio"
        >
          <ArrowUp className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
        </Button>
      </div>
    </div>
  );
};

export default ProductsPage;


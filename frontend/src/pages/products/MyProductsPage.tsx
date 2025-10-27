import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import {
  Calendar,
  DollarSign,
  Edit,
  Eye,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { API_BASE } from "@services/api";
import { productsService } from "@services/products";
import type { Product } from "@/types";

const MyProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyProducts();
  }, []);

  const loadMyProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getMyProducts();
      setProducts(data);
    } catch (error: any) {
      toast.error("Error al cargar tus productos");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      return;
    }

    try {
      await productsService.delete(productId);
      toast.success("Producto eliminado correctamente");
      loadMyProducts();
    } catch (error: any) {
      toast.error("Error al eliminar el producto");
    }
  };

  const toggleProductAvailability = async (
    productId: number,
    available: boolean,
  ) => {
    try {
      await productsService.updateAvailability(productId, !available);
      toast.success(
        `Producto marcado como ${available ? "vendido" : "disponible"}`,
      );
      loadMyProducts();
    } catch (error: any) {
      toast.error("Error al actualizar la disponibilidad del producto");
    }
  };

  const getAvailabilityBadge = (available: boolean) => {
    const statusMap = {
      available: { text: "Disponible", class: "bg-green-100 text-green-800" },
      sold: { text: "Vendido", class: "bg-yellow-100 text-yellow-800" },
    };
    const statusInfo = available ? statusMap.available : statusMap.sold;
    return <Badge className={statusInfo.class}>{statusInfo.text}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { text: "Activo", class: "bg-green-100 text-green-800" },
      pending: { text: "Pendiente", class: "bg-yellow-100 text-yellow-800" },
      suspended: { text: "Suspendido", class: "bg-red-100 text-red-800" },
      hidden: { text: "Oculto", class: "bg-gray-100 text-gray-800" },
      banned: { text: "Prohibido", class: "bg-red-100 text-red-800" },
    };
    const statusInfo =
      statusMap[status as keyof typeof statusMap] || statusMap.active;
    return <Badge className={statusInfo.class}>{statusInfo.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tus productos...</p>
        </div>
      </div>
    );
  }

  const activeProducts = products.filter(p => p.status === 'active');
  const flaggedProducts = products.filter(p => p.status !== 'active');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Productos</h1>
          <p className="text-gray-600 mt-2">
            Gestiona todos tus productos y servicios publicados
          </p>
        </div>
        <Button asChild>
          <Link to="/products/create">
            <Plus className="h-4 w-4 mr-2" />
            Crear Producto
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes productos publicados
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza creando tu primer producto o servicio para vender en la
              plataforma
            </p>
            <Button asChild>
              <Link to="/products/create">
                <Plus className="h-4 w-4 mr-2" />
                Crear mi primer producto
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Mis Productos ({activeProducts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeProducts.length === 0 ? (
                    <div className="text-center py-8">No tienes productos activos</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Fecha de publicación</TableHead>
                          <TableHead>Disponibilidad</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeProducts.map((product) => (
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
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                      Sin imagen
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {product.price ? (
                                <div className="flex items-center text-green-600 font-medium">
                                  <DollarSign className="h-4 w-4" />
                                  {product.price.toLocaleString()}
                                </div>
                              ) : (
                                <span className="text-gray-400">Sin precio</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-gray-600">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(product.publishedAt).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getAvailabilityBadge(product.availability)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-4 justify-end items-center">
                                <Button
                                  onClick={() =>
                                    toggleProductAvailability(
                                      product.itemId,
                                      product.availability,
                                    )
                                  }
                                >
                                  {product.availability
                                    ? "Marcar como vendido"
                                    : "Marcar como disponible"}
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
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
                                    <DropdownMenuItem asChild>
                                      <Link to={`/products/${product.itemId}/edit`}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDeleteProduct(product.itemId)
                                      }
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Flagged / Reported / Inactive products */}
              <Card>
                <CardHeader>
                  <CardTitle>Productos reportados / inactivos ({flaggedProducts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {flaggedProducts.length === 0 ? (
                    <div className="text-center py-8">No hay productos reportados o inactivos</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha de publicación</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {flaggedProducts.map((product) => (
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
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                      Sin imagen
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                </div>
                              </div>
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
                                <Button variant="secondary">Apelar</Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
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
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
      )}
    </div>
  );
};

export default MyProductsPage;

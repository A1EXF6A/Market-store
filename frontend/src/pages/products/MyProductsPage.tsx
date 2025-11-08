// src/pages/MyProductsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { API_BASE } from "@services/api";
import { productsService } from "@services/products";
import type { Product } from "@/types";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
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
  ShoppingBag,
} from "lucide-react";

/* ============ helpers de precio ============ */
const currency = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

/** Devuelve number | undefined para respetar el tipo del backend */
const coercePrice = (p: unknown): number | undefined => {
  if (p === null || p === undefined || p === "") return undefined;
  const n = typeof p === "string" ? Number(p) : (p as number);
  return Number.isFinite(n) ? n : undefined;
};

/** Mantiene la misma forma de Product, solo que normalizamos price a number | undefined */
type ProductWithCoercedPrice = Omit<Product, "price"> & { price?: number };

const MyProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ProductWithCoercedPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  const countActive = useMemo(
    () => products.filter((p) => p.availability).length,
    [products]
  );

  useEffect(() => {
    void loadMyProducts();
  }, []);

  const loadMyProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getMyProducts();
      const normalized: ProductWithCoercedPrice[] = data.map((p) => ({
        ...p,
        price: coercePrice((p as any).price),
      }));
      setProducts(normalized);
    } catch {
      toast.error("Error al cargar tus productos");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      setActionBusyId(productId);
      await productsService.delete(productId);
      toast.success("Producto eliminado");
      await loadMyProducts();
    } catch {
      toast.error("Error al eliminar el producto");
    } finally {
      setActionBusyId(null);
    }
  };

  const toggleProductAvailability = async (productId: number, available: boolean) => {
    try {
      setActionBusyId(productId);
      await productsService.updateAvailability(productId, !available);
      toast.success(`Producto marcado como ${available ? "vendido" : "disponible"}`);
      await loadMyProducts();
    } catch {
      toast.error("Error al actualizar la disponibilidad");
    } finally {
      setActionBusyId(null);
    }
  };

  const AvailabilityBadge = ({ available }: { available: boolean }) => (
    <Badge className={available ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}>
      {available ? "Disponible" : "Vendido"}
    </Badge>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { text: string; cls: string }> = {
      active: { text: "Activo", cls: "bg-emerald-100 text-emerald-800" },
      pending: { text: "Pendiente", cls: "bg-amber-100 text-amber-800" },
      suspended: { text: "Suspendido", cls: "bg-rose-100 text-rose-800" },
      hidden:    { text: "Oculto", cls: "bg-slate-100 text-slate-800" },
      banned:    { text: "Prohibido", cls: "bg-rose-100 text-rose-800" },
    };
    const s = map[status] ?? map.active;
    return <Badge className={s.cls}>{s.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 p-[1px]">
          <div className="rounded-2xl bg-white dark:bg-neutral-950 p-5">
            <div className="flex items-center justify-between">
              <div className="h-8 w-56 rounded-md bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              <div className="h-10 w-36 rounded-md bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-3 items-center border-b py-3 last:border-b-0"
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                    <div className="h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                  </div>
                  <div className="col-span-2 h-4 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                  <div className="col-span-2 h-4 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                  <div className="col-span-1 h-6 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                  <div className="col-span-2 h-8 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con borde degradado */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-[1px] shadow">
        <div className="rounded-2xl bg-white dark:bg-neutral-950 px-5 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 grid place-items-center rounded-xl bg-indigo-600/10 text-indigo-600">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Mis Productos</h1>
                <p className="text-sm text-muted-foreground">
                  {products.length} publicados • {countActive} disponibles
                </p>
              </div>
            </div>
            <Button asChild className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:opacity-90">
              <Link to="/products/create">
                <Plus className="h-4 w-4 mr-2" />
                Crear Producto
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-indigo-600/10 text-indigo-600 grid place-items-center">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Aún no tienes productos</h3>
            <p className="text-muted-foreground mb-6">
              Publica tu primer producto o servicio para empezar a vender.
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
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle>Lista de Productos ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="w-[140px]">Precio</TableHead>
                  <TableHead className="w-[180px]">Publicado</TableHead>
                  <TableHead className="w-[130px]">Disponibilidad</TableHead>
                  <TableHead className="w-[130px]">Estado</TableHead>
                  <TableHead className="text-right w-[160px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.itemId} className="align-middle">
                    {/* Producto */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-neutral-100 dark:bg-neutral-900 overflow-hidden ring-1 ring-black/5">
                          {product.photos.length > 0 ? (
                            <img
                              src={`${API_BASE}${product.photos[0].url}`}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full grid place-items-center text-xs text-neutral-400">
                              Sin imagen
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          {product.category && (
                            <p className="text-xs text-muted-foreground truncate">
                              {product.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Precio (normalizado; muestra también 0) */}
                    <TableCell>
                      {typeof product.price === "number" ? (
                        <div className="inline-flex items-center gap-1 font-medium text-emerald-600">
                          <DollarSign className="h-4 w-4" />
                          {currency.format(product.price)}
                        </div>
                      ) : (
                        <span className="text-neutral-400">Sin precio</span>
                      )}
                    </TableCell>

                    {/* Fecha */}
                    <TableCell>
                      <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-300">
                        <Calendar className="h-4 w-4 mr-1.5" />
                        {new Date(product.publishedAt).toLocaleDateString()}
                      </div>
                    </TableCell>

                    {/* Disponibilidad */}
                    <TableCell>
                      <AvailabilityBadge available={product.availability} />
                    </TableCell>

                    {/* Estado (moderación) */}
                    <TableCell>
                      <StatusBadge status={product.status} />
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          size="sm"
                          variant={product.availability ? "secondary" : "default"}
                          className={
                            product.availability
                              ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
                              : "bg-emerald-600 hover:bg-emerald-600/90"
                          }
                          disabled={actionBusyId === product.itemId}
                          onClick={() =>
                            toggleProductAvailability(product.itemId, product.availability)
                          }
                        >
                          {product.availability ? "Marcar vendido" : "Marcar disponible"}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link to={`/products/${product.itemId}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/products/${product.itemId}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteProduct(product.itemId)}
                              className="text-rose-600"
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyProductsPage;

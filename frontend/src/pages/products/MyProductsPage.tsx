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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@components/ui/dialog";
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
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@components/ui/select";

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
  const [productsPage, setProductsPage] = useState<number>(0);
  const [productsPerPage] = useState<number>(6);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [appliedStatus, setAppliedStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [appliedDateFrom, setAppliedDateFrom] = useState<string>("");
  const [appliedDateTo, setAppliedDateTo] = useState<string>("");

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
      setProductsPage(0);
    } catch {
      toast.error("Error al cargar tus productos");
    } finally {
      setLoading(false);
    }
  };

  // Reset page when applied filters change
  React.useEffect(() => {
    setProductsPage(0);
  }, [appliedSearch, appliedStatus, appliedDateFrom, appliedDateTo]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (appliedStatus !== "all" && p.status !== appliedStatus) return false;
      if (appliedSearch.trim()) {
        const s = appliedSearch.trim().toLowerCase();
        const nameMatch = p.name?.toLowerCase().includes(s);
        if (!nameMatch) return false;
      }
      // Filter by published date range (if applied)
      if (appliedDateFrom) {
        const from = new Date(appliedDateFrom);
        const pd = new Date(p.publishedAt);
        if (isNaN(from.getTime()) || isNaN(pd.getTime()) || pd < from) return false;
      }
      if (appliedDateTo) {
        // include whole day for the 'to' date
        const to = new Date(appliedDateTo);
        to.setHours(23, 59, 59, 999);
        const pd = new Date(p.publishedAt);
        if (isNaN(to.getTime()) || isNaN(pd.getTime()) || pd > to) return false;
      }
      return true;
    });
  }, [products, appliedSearch, appliedStatus, appliedDateFrom, appliedDateTo]);

  const handleDeleteProduct = async (productId: number) => {
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

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductWithCoercedPrice | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.itemId;
    await handleDeleteProduct(id);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle>Lista de Productos ({filteredProducts.length})</CardTitle>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Nombre</Label>
                    <Input
                      placeholder="Nombre del producto..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-48"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Estado</Label>
                    <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="suspended">Suspendido</SelectItem>
                        <SelectItem value="hidden">Oculto</SelectItem>
                        <SelectItem value="banned">Prohibido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Desde</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-40"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Hasta</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-40"
                    />
                  </div>

                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      onClick={() => {
                        setAppliedSearch(search);
                        setAppliedStatus(statusFilter);
                        setAppliedDateFrom(dateFrom);
                        setAppliedDateTo(dateTo);
                      }}
                      disabled={
                        appliedSearch === search &&
                        appliedStatus === statusFilter &&
                        appliedDateFrom === dateFrom &&
                        appliedDateTo === dateTo
                      }
                    >
                      Buscar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("all");
                        setDateFrom("");
                        setDateTo("");
                        setAppliedSearch("");
                        setAppliedStatus("all");
                        setAppliedDateFrom("");
                        setAppliedDateTo("");
                      }}
                    >
                      Limpiar
                    </Button>
                  </div>
                </div>
            </div>
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
                {filteredProducts.slice(productsPage * productsPerPage, (productsPage + 1) * productsPerPage).map((product) => (
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {product.status === 'active' && (
                              <DropdownMenuItem
                                onClick={() => toggleProductAvailability(product.itemId, product.availability)}
                                disabled={actionBusyId === product.itemId}
                                className={actionBusyId === product.itemId ? 'text-neutral-400' : ''}
                              >
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                {product.availability ? 'Marcar vendido' : 'Marcar disponible'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <Link to={`/products/${product.itemId}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </Link>
                            </DropdownMenuItem>
                            {product.status === 'active' ? (
                              <DropdownMenuItem asChild>
                                <Link to={`/products/${product.itemId}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="text-neutral-400" title="Solo se puede editar productos con estado Activo">
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {
                              // Disable delete for products that are not 'active'
                            }
                            <DropdownMenuItem
                              onClick={() => {
                                if (product.status !== 'active') return;
                                setDeleteTarget(product);
                                setDeleteDialogOpen(true);
                              }}
                              disabled={product.status !== 'active'}
                              className={product.status !== 'active' ? 'text-neutral-400' : 'text-rose-600'}
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
            {/* Delete confirmation dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar eliminación</DialogTitle>
                  <DialogDescription>
                    {deleteTarget ? (
                      <>
                        Vas a eliminar <strong>"{deleteTarget.name}"</strong> de forma permanente. Esta acción es irreversible y se eliminarán todas las fotos y datos asociados al anuncio.
                      </>
                    ) : (
                      "Vas a eliminar este producto de forma permanente. Esta acción es irreversible."
                    )}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}>
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDelete}
                    disabled={!deleteTarget || actionBusyId === deleteTarget?.itemId}
                  >
                    {actionBusyId === deleteTarget?.itemId ? 'Eliminando...' : 'Eliminar producto'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
              <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                  Mostrando {productsPage * productsPerPage + 1} - {Math.min((productsPage + 1) * productsPerPage, filteredProducts.length)} de {filteredProducts.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProductsPage((p) => Math.max(0, p - 1))}
                    disabled={productsPage === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProductsPage((p) => Math.min(p + 1, Math.floor((filteredProducts.length - 1) / productsPerPage)))}
                    disabled={(productsPage + 1) * productsPerPage >= filteredProducts.length}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyProductsPage;

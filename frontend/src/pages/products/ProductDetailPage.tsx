import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productsService } from "@services/products";
import { API_BASE } from "@services/api";
import type { Product } from "@/types";
import { UserRole } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import {
  Heart,
  MapPin,
  DollarSign,
  Calendar,
  User,
  MessageCircle,
  Flag,
  ArrowLeft,
  Clock,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { chatService } from "@services/chat";
import { ReportProductModal } from "@components/ui/report-product-modal";

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) void loadProduct(parseInt(id, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProduct = async (productId: number) => {
    try {
      setLoading(true);
      const data = await productsService.getById(productId);
      setProduct(data);
      setCurrentImageIndex(0);
    } catch (_error) {
      toast.error("Error al cargar el producto");
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const googleMapsHref = useMemo(() => {
    if (!product?.location) return undefined;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      product.location,
    )}`;
  }, [product?.location]);

  const staticMapUrl = useMemo(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (!product?.location || !key) return undefined;
    const base = "https://maps.googleapis.com/maps/api/staticmap";
    const qs = new URLSearchParams({
      size: "800x280",
      scale: "2",
      zoom: "14",
      markers: product.location,
      key,
    });
    return `${base}?${qs.toString()}`;
  }, [product?.location]);

  const handleToggleFavorite = async () => {
    if (!product || !user || user.role !== UserRole.BUYER) return;
    try {
      setIsFavLoading(true);
      // UI optimista (si en tu API devuelves isFavorite, puedes usarlo aquí)
      await productsService.toggleFavorite(product.itemId);
      toast.success("Favorito actualizado");
    } catch (_error) {
      toast.error("Error al actualizar favorito");
    } finally {
      setIsFavLoading(false);
    }
  };

  const handleContactSeller = async () => {
    if (!product?.seller) return;
    try {
      const chat = await chatService.findOrCreateChat(product.seller.userId);
      navigate(`/chat/${chat.chatId}`);
    } catch (error: any) {
      toast.error("Error al iniciar chat con el vendedor");
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      suspended: "bg-red-100 text-red-800",
      hidden: "bg-gray-100 text-gray-800",
      banned: "bg-red-100 text-red-800",
    };
    return statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          <p className="text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Producto no encontrado</p>
        <Button asChild className="mt-4">
          <Link to="/products">Volver a Productos</Link>
        </Button>
      </div>
    );
  }

  const mainImage =
    product.photos.length > 0
      ? `${API_BASE}${product.photos[currentImageIndex]?.url || product.photos[0].url}`
      : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-[1px] shadow">
        <div className="rounded-2xl bg-white dark:bg-neutral-950 p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{product.name}</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">
              {product.type === "product" ? "Producto" : "Servicio"}
            </Badge>
            <Badge className={getStatusBadge(product.status)}>{product.status}</Badge>
            {!product.availability ? (
              <Badge variant="secondary" className="gap-1">
                <ShieldAlert className="h-3.5 w-3.5" />
                No disponible
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Disponible
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Gallery */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {mainImage ? (
                  <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Sin imagen disponible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {product.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.photos.map((photo, index) => (
                <button
                  key={photo.photoId}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                    currentImageIndex === index ? "border-indigo-500" : "border-transparent"
                  }`}
                  title={`Imagen ${index + 1}`}
                >
                  <img
                    src={`${API_BASE}${photo.url}`}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Map preview (embedded) */}
          {product.location && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ubicación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="block rounded-lg overflow-hidden">
                  <iframe
                    title={`map-${product.itemId}`}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(product.location)}&output=embed`}
                    className="w-full h-40 md:h-48"
                    loading="lazy"
                  />
                </div>

                <div className="flex items-center text-gray-700 gap-2">
                  <MapPin className="h-4 w-4" />
                  <a
                    href={googleMapsHref}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-gray-900"
                    title="Ver en Google Maps"
                  >
                    {product.location}
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-2xl">{product.name}</CardTitle>
                {typeof product.price === "number" && (
                  <div className="text-right">
                    <div className="text-3xl font-bold text-emerald-600 flex items-center justify-end">
                      <DollarSign className="h-6 w-6" />
                      {currency.format(product.price)}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {product.description && (
                <div>
                  <h3 className="font-semibold mb-2">Descripción</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.location && !staticMapUrl && (
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-4 w-4 mr-2" />
                    <a
                      href={googleMapsHref}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-gray-900"
                      title="Ver en Google Maps"
                    >
                      {product.location}
                    </a>
                  </div>
                )}

                <div className="flex items-center text-gray-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Publicado: {new Date(product.publishedAt).toLocaleDateString()}
                  </span>
                </div>

                {product.service?.workingHours && (
                  <div className="flex items-center text-gray-700">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Horario: {product.service.workingHours}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex gap-3">
                {user?.role === UserRole.BUYER && (
                  <>
                    <Button
                      onClick={handleToggleFavorite}
                      variant="outline"
                      className="flex-1"
                      disabled={isFavLoading}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      {isFavLoading ? "Actualizando..." : "Favorito"}
                    </Button>
                    <Button className="flex-1" onClick={handleContactSeller}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contactar Vendedor
                    </Button>
                  </>
                )}

                {user?.role === UserRole.BUYER && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReportModalOpen(true)}
                    title="Reportar producto"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {product.seller && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Vendedor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {product.seller.firstName} {product.seller.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{product.seller.email}</p>
                    {product.seller.phone && (
                      <p className="text-sm text-gray-600">{product.seller.phone}</p>
                    )}
                  </div>
                  {user?.role === UserRole.BUYER && (
                    <Button size="sm" onClick={handleContactSeller}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Enviar Mensaje
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {product && (
        <ReportProductModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          productId={product.itemId}
          productName={product.name}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;

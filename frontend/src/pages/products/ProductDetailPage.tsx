import React, { useState, useEffect } from "react";
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
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { chatService } from "@services/chat";
import { ReportProductModal } from "@components/ui/report-product-modal";

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadProduct(parseInt(id));
    }
  }, [id]);

  const loadProduct = async (productId: number) => {
    try {
      setLoading(true);
      const data = await productsService.getById(productId);
      setProduct(data);
    } catch (error: any) {
      toast.error("Error al cargar el producto");
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;

    try {
      await productsService.toggleFavorite(product.itemId);
      toast.success("Favorito actualizado");
    } catch (error: any) {
      toast.error("Error al actualizar favorito");
    }
  };
  const handleContactSeller = async () => {
    if (!product || !product.seller) return;
    try {
      const chat = await chatService.findOrCreateChat(product.seller.userId);
      toast.success("Chat iniciado exitosamente");
      navigate(`/chat/${chat.chatId}`);
    } catch (error: any) {
      toast.error("Error al iniciar chat con el vendedor");
      console.error(error);
    }
  };

  const handleViewLocation = () => {
    if (!product || !product.latitude || !product.longitude) return;
    
    const googleMapsUrl = `https://www.google.com/maps?q=${product.latitude},${product.longitude}`;
    window.open(googleMapsUrl, '_blank');
  };
  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      suspended: "bg-red-100 text-red-800",
      hidden: "bg-gray-100 text-gray-800",
      banned: "bg-red-100 text-red-800",
    };
    return (
      statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-gray-800"
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando producto...</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                {product.photos.length > 0 ? (
                  <img
                    src={`${API_BASE}${product.photos[currentImageIndex]?.url || product.photos[0].url}`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
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
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    currentImageIndex === index
                      ? "border-blue-500"
                      : "border-gray-200"
                  }`}
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {product.type === "product" ? "Producto" : "Servicio"}
                    </Badge>
                    <Badge className={getStatusBadge(product.status)}>
                      {product.status}
                    </Badge>
                    {!product.availability && (
                      <Badge variant="secondary">No disponible</Badge>
                    )}
                  </div>
                </div>
                {product.price && (
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600 flex items-center">
                      <DollarSign className="h-6 w-6" />
                      {product.price.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.description && (
                <div>
                  <h3 className="font-semibold mb-2">Descripción</h3>
                  <p className="text-gray-700">{product.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.location && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{product.location}</span>
                    </div>
                    {product.latitude && product.longitude && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewLocation}
                        className="ml-2"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ver en Mapa
                      </Button>
                    )}
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Publicado:{" "}
                    {new Date(product.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                {product.service?.workingHours && (
                  <div className="flex items-center text-gray-600">
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
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Favorito
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
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {product.seller && (
            <Card>
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
                    <p className="text-sm text-gray-600">
                      {product.seller.email}
                    </p>
                    {product.seller.phone && (
                      <p className="text-sm text-gray-600">
                        {product.seller.phone}
                      </p>
                    )}
                  </div>
                  {user?.role === UserRole.BUYER && (
                    <Button size="sm">
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


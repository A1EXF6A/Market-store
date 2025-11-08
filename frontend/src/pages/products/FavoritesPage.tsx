import { useAuthStore } from "@/store/authStore";
import type { Product } from "@/types";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { API_BASE } from "@services/api";
import { productsService } from "@services/products";
import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Calendar,
  DollarSign,
  Eye,
  Heart,
  HeartOff,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      console.log(Cookies.get("access_token"));

      const data = await productsService.getFavorites(Number(user?.userId));

      setFavorites(data);
    } catch (error: any) {
      toast.error("Error al cargar tus favoritos");
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (productId: number) => {
    try {
      await productsService.toggleFavorite(productId);
      toast.success("Producto removido de favoritos");
      setFavorites((prev) =>
        prev.filter((product) => product.itemId !== productId),
      );
    } catch (error: any) {
      toast.error("Error al actualizar favoritos");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tus favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Heart className="h-8 w-8 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Favoritos</h1>
          <p className="text-gray-600 mt-2">
            Productos y servicios que has marcado como favoritos
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes favoritos guardados
            </h3>
            <p className="text-gray-600 mb-6">
              Explora productos y servicios, y marca como favoritos los que te
              interesen
            </p>
            <Button asChild>
              <Link to="/products">Explorar Productos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((product) => (
            <Card
              key={product.itemId}
              className="group hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="relative">
                  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-3">
                    {product.photos.length > 0 ? (
                      <img
                        src={`${API_BASE}${product.photos[0].url}`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={() => handleToggleFavorite(product.itemId)}
                  >
                    <HeartOff className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">
                      {product.name}
                    </CardTitle>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {product.type === "product" ? "Producto" : "Servicio"}
                    </Badge>
                  </div>
                  {product.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {product.price && (
                    <div className="flex items-center text-green-600 font-semibold text-lg">
                      <DollarSign className="h-5 w-5" />
                      {product.price.toLocaleString()}
                    </div>
                  )}

                  {product.location && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      {product.location}
                    </div>
                  )}

                  <div className="flex items-center text-gray-500 text-xs">
                    <Calendar className="h-4 w-4 mr-1" />
                    Publicado{" "}
                    {new Date(product.publishedAt).toLocaleDateString()}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">
                        {product.seller?.firstName} {product.seller?.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" asChild>
                        <Link to={`/products/${product.itemId}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {favorites.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            {favorites.length} producto{favorites.length !== 1 ? "s" : ""} en
            favoritos
          </p>
          <Button variant="outline" asChild>
            <Link to="/products">Explorar más productos</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;


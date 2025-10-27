import type { Product } from "@/types";
import { ItemType, UserRole } from "@/types";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { API_BASE } from "@services/api";
import {
  Calendar,
  DollarSign,
  Eye,
  Heart,
  MapPin,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: Product;
  onToggleFavorite?: (productId: number) => void;
  userRole?: string;
  showActions?: boolean;
}

export function ProductCard({
  product,
  onToggleFavorite,
  userRole,
  showActions = true,
}: ProductCardProps) {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { text: "Activo", class: "bg-green-100 text-green-800" },
      pending: { text: "Pendiente", class: "bg-yellow-100 text-yellow-800" },
      suspended: { text: "Suspendido", class: "bg-red-100 text-red-800" },
      hidden: { text: "Oculto", class: "bg-gray-100 text-gray-800" },
      banned: { text: "Baneado", class: "bg-red-100 text-red-800" },
    };
    const statusInfo =
      statusMap[status as keyof typeof statusMap] || statusMap.active;
    return <Badge className={statusInfo.class}>{statusInfo.text}</Badge>;
  };

  const getTypeBadge = (type: ItemType) => {
    return type === ItemType.PRODUCT ? (
      <Badge variant="outline">Producto</Badge>
    ) : (
      <Badge variant="outline">Servicio</Badge>
    );
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300">
      <div className="relative">
        {/* Image */}
        <div className="w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
          {product.photos.length > 0 ? (
            <img
              src={`${API_BASE}${product.photos[0].url}`}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <Package className="h-16 w-16" />
            </div>
          )}
        </div>

        {/* Status and Type badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {getStatusBadge(product.status)}
          {getTypeBadge(product.type)}
        </div>

        {/* Favorite button for buyers */}
        {userRole === UserRole.BUYER && onToggleFavorite && (
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-3 right-3 bg-white/80 hover:bg-white text-gray-600 hover:text-red-500"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(product.itemId);
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CardContent className="p-4">
        {/* Product name and description */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
            {product.name}
          </h3>
        </div>

        {/* Price */}
        <div className="mb-3">
          {product.price ? (
            <div className="flex items-center text-green-600 font-bold text-xl">
              <DollarSign className="h-5 w-5" />
              {product.price.toLocaleString()}
            </div>
          ) : (
            <span className="text-gray-400 text-sm">
              Precio no especificado
            </span>
          )}
        </div>

        {/* Location and Date */}
        <div className="space-y-2 mb-4">
          {product.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              {product.location}
            </div>
          )}
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date(product.publishedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Action button */}
        {showActions && (
          <Button asChild className="w-full" variant="outline">
            <Link to={`/products/${product.itemId}`}>
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalles
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

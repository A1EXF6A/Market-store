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
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, DollarSign, Search, Filter } from "lucide-react";
import { toast } from "sonner";

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductFilters>({});
  const { user } = useAuthStore();

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

  const applyFilters = (filters: ProductFilters): void => {
    setFilters(filters);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Header onChangeFilters={() => {}} />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Header onChangeFilters={applyFilters} />
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">
                No se encontraron productos
              </p>
              <p className="text-gray-400 mt-2">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          ) : (
            products.map((product) => (
              <Card
                key={product.itemId}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-0">
                  <div className="aspect-video bg-gray-200 rounded-t-lg relative">
                    {product.photos.length > 0 ? (
                      <img
                        src={`${API_BASE}${product.photos[0].url}`}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        Sin imagen
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge className={getStatusBadge(product.status)}>
                        {product.status}
                      </Badge>
                      {user?.role === UserRole.BUYER && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1 h-8 w-8 bg-white/80 hover:bg-white"
                          onClick={() => handleToggleFavorite(product.itemId)}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg truncate">
                        {product.name}
                      </h3>
                      <Badge variant="outline">
                        {product.type === ItemType.PRODUCT
                          ? "Producto"
                          : "Servicio"}
                      </Badge>
                    </div>

                    {product.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      {product.price && (
                        <div className="flex items-center text-green-600 font-semibold">
                          <DollarSign className="h-4 w-4" />
                          {product.price.toLocaleString()}
                        </div>
                      )}
                      {product.location && (
                        <div className="flex items-center text-gray-500 text-sm">
                          <MapPin className="h-3 w-3 mr-1" />
                          {product.location}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link to={`/products/${product.itemId}`}>
                          Ver Detalles
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const Header: React.FC<{
  onChangeFilters: (filters: ProductFilters) => void;
}> = ({ onChangeFilters }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-2">
            Explora nuestro catálogo de productos y servicios
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>
      {showFilters && <FiltersSection onChangeFilters={onChangeFilters} />}
    </>
  );
};

const FiltersSection: React.FC<{
  onChangeFilters: (filters: ProductFilters) => void;
}> = ({ onChangeFilters }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [type, setType] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [location, setLocation] = useState<string>("");

  const applyFilters = () => {
    const filters: ProductFilters = {};
    if (searchTerm) filters.search = searchTerm;
    if (type !== "all") filters.type = type as ItemType;
    if (minPrice > 0) filters.minPrice = minPrice;
    if (maxPrice > 0) filters.maxPrice = maxPrice;
    if (location) filters.location = location;

    onChangeFilters(filters);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setType("all");
    setMinPrice(0);
    setMaxPrice(0);
    setLocation("");

    onChangeFilters({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2" />
          Filtros de Búsqueda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Nombre del producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select onValueChange={(value) => setType(value)}>
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
              value={minPrice || ""}
              onChange={(e) =>
                setMinPrice(e.target.value ? parseFloat(e.target.value) : 0)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPrice">Precio Máximo</Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="1000"
              value={maxPrice || ""}
              onChange={(e) =>
                setMaxPrice(e.target.value ? parseFloat(e.target.value) : 0)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              placeholder="Ciudad, región..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="flex items-end gap-4">
            <Button onClick={applyFilters} className="w-full">
              Buscar
            </Button>
            <Button variant="outline" onClick={clearFilters} className="w-full">
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductsPage;


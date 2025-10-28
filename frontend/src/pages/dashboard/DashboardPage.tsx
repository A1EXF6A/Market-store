import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import {
  AlertTriangle,
  Flag,
  Heart,
  MessageCircle,
  Plus,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService, BuyerStats, SellerStats, AdminStats } from "@/services/dashboard";
import { toast } from "sonner";

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [buyerStats, setBuyerStats] = useState<BuyerStats | null>(null);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        switch (user.role) {
          case UserRole.BUYER:
            const buyerData = await dashboardService.getBuyerStats();
            setBuyerStats(buyerData);
            break;
          case UserRole.SELLER:
            const sellerData = await dashboardService.getSellerStats();
            setSellerStats(sellerData);
            break;
          case UserRole.ADMIN:
          case UserRole.MODERATOR:
            const adminData = await dashboardService.getAdminStats();
            setAdminStats(adminData);
            break;
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error("Error al cargar las estadísticas del dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const getDashboardContent = () => {
    switch (user?.role) {
      case UserRole.BUYER:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Explorar Productos
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : buyerStats?.activeProductsCount ?? "+1,000"}</div>
                  <p className="text-xs text-muted-foreground">
                    productos disponibles
                  </p>
                  <Button asChild className="w-full mt-4">
                    <Link to="/products">Ver Productos</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Mis Favoritos
                  </CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : buyerStats?.favoritesCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    productos guardados
                  </p>
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link to="/favorites">Ver Favoritos</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Conversaciones
                  </CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : buyerStats?.activeChatsCount || 0}</div>
                  <p className="text-xs text-muted-foreground">chats activos</p>
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link to="/chat">Ver Chats</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">
                Productos Recomendados
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    Explora nuestro catálogo para descubrir productos que te
                    puedan interesar
                  </p>
                  <div className="flex justify-center mt-4">
                    <Button asChild>
                      <Link to="/products">Explorar Productos</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        );

      case UserRole.SELLER:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Mis Productos
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : sellerStats?.productsCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    productos publicados
                  </p>
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link to="/my-products">Ver Productos</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
                   <TrendingUp className="h-4 w-4 text-muted-foreground" />
                 </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : sellerStats?.totalSales || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    productos vendidos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Calificación
                  </CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : sellerStats?.averageRating || "5.0"}</div>
                  <p className="text-xs text-muted-foreground">
                    promedio de calificaciones
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Mensajes
                  </CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : sellerStats?.activeChatsCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    mensajes pendientes
                  </p>
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link to="/chat">Ver Chats</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Acciones Rápidas</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Crear Producto</CardTitle>
                    <CardDescription>
                      Publica un nuevo producto o servicio en la plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link to="/products/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Producto
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gestionar Productos</CardTitle>
                    <CardDescription>
                      Ve y administra todos tus productos publicados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/my-products">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Mis Productos
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        );

      case UserRole.MODERATOR:
      case UserRole.ADMIN:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Usuarios Activos
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : adminStats?.usersCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    usuarios registrados
                  </p>
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link to="/users">Gestionar Usuarios</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Incidencias
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : adminStats?.incidentsCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    incidencias pendientes
                  </p>
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link to="/incidents">Ver Incidencias</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Reportes
                  </CardTitle>
                  <Flag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : adminStats?.reportsCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    reportes pendientes
                  </p>
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link to="/reports">Ver Reportes</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Productos
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : adminStats?.productsCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    productos activos
                  </p>
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link to="/products">Ver Productos</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">
                Panel de Moderación
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                      Incidencias Pendientes
                    </CardTitle>
                    <CardDescription>
                      Productos que requieren revisión por parte del sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      No hay incidencias pendientes de revisión
                    </p>
                    <Button asChild className="w-full">
                      <Link to="/incidents">Ver Todas las Incidencias</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Flag className="h-5 w-5 mr-2 text-red-500" />
                      Reportes de Usuarios
                    </CardTitle>
                    <CardDescription>
                      Reportes realizados por compradores sobre productos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      No hay reportes pendientes de revisión
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/reports">Ver Todos los Reportes</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.firstName}
          </h1>
          <p className="text-gray-600 flex items-center mt-2">
            <Badge className="mr-2">
              {user?.role === UserRole.BUYER && "Comprador"}
              {user?.role === UserRole.SELLER && "Vendedor"}
              {user?.role === UserRole.MODERATOR && "Moderador"}
              {user?.role === UserRole.ADMIN && "Administrador"}
            </Badge>
            {!user?.verified && (
              <Badge variant="secondary">Cuenta no verificada</Badge>
            )}
          </p>
        </div>
      </div>

      {getDashboardContent()}
    </div>
  );
};

export default DashboardPage;


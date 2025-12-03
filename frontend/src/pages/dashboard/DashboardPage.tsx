// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";

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
  Sparkles,
  Shield,
} from "lucide-react";

import { dashboardService } from "@/services/dashboard";
import type { BuyerStats, SellerStats, AdminStats } from "@/services/dashboard";

import PageBackground from "@/components/PageBackground";
import ThemeToggle from "@/components/ThemeToggle";

/* ========= Variants (tipados) ========= */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 * i,
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

/* ========= Tarjeta métrica reutilizable ========= */
const StatCard: React.FC<{
  i?: number;
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  hint?: string;
  cta?: React.ReactNode;
}> = ({ i = 0, icon, title, value, hint, cta }) => {
  return (
    <motion.div custom={i} variants={fadeUp} initial="hidden" animate="visible">
      <Card className="glass-effect hover:shadow-glow transition-all duration-300 hover-lift group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-200">{title}</CardTitle>
          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 grid place-items-center transition-transform duration-200 group-hover:scale-110">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{value}</div>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          {cta && <div className="mt-4">{cta}</div>}
        </CardContent>
        <div className="mx-4 mb-4 rounded-xl ring-2 ring-blue-200 dark:ring-blue-800 transition-all duration-200 group-hover:ring-4" />
      </Card>
    </motion.div>
  );
};

/* ========= Componente principal ========= */
const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const [buyerStats, setBuyerStats] = useState<BuyerStats | null>(null);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user?.role]);

  const loadStats = async () => {
    if (!user?.role) return;

    try {
      setLoading(true);
      if (user.role === UserRole.BUYER) {
        const data = await dashboardService.getBuyerStats();
        setBuyerStats(data);
      } else if (user.role === UserRole.SELLER) {
        const data = await dashboardService.getSellerStats();
        setSellerStats(data);
      } else if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
        const data = await dashboardService.getAdminStats();
        setAdminStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <Shield className="h-3 w-3 mr-1" />
            Administrador
          </Badge>
        );
      case UserRole.MODERATOR:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <Shield className="h-3 w-3 mr-1" />
            Moderador
          </Badge>
        );
      case UserRole.SELLER:
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <ShoppingBag className="h-3 w-3 mr-1" />
            Vendedor
          </Badge>
        );
      case UserRole.BUYER:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <Heart className="h-3 w-3 mr-1" />
            Comprador
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold">Acceso denegado</h2>
              <p className="text-muted-foreground mt-2">
                Debes iniciar sesión para ver el dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <PageBackground />

      <div className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* ========= Hero Section ========= */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-center space-y-6 py-12"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-xl animate-pulse"></div>
            <h1 className="relative text-4xl md:text-6xl font-bold text-blue-600 dark:text-blue-400">
              ¡Bienvenido{user.firstName ? `, ${user.firstName} ${user.lastName}` : ""}! 👋
            </h1>
          </div>
          
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {getRoleBadge(user.role)}
            <ThemeToggle />
          </div>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Este es tu panel de control personalizado donde puedes gestionar tu actividad y acceder a las herramientas principales.
          </p>
        </motion.div>

        {/* ========= Comprador (BUYER) ========= */}
        {user?.role === UserRole.BUYER && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                i={0}
                icon={<ShoppingBag className="h-4 w-4" />}
                title="Productos Disponibles"
                value={loading ? "…" : "Muchos"}
                hint="productos disponibles"
                cta={
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200">
                    <Link to="/products">Ver Productos</Link>
                  </Button>
                }
              />
              <StatCard
                i={1}
                icon={<Heart className="h-4 w-4" />}
                title="Mis Favoritos"
                value={loading ? "…" : buyerStats?.favoritesCount ?? 0}
                hint="productos guardados"
                cta={
                  <Button asChild variant="outline" className="w-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
                    <Link to="/favorites">Ver Favoritos</Link>
                  </Button>
                }
              />
              <StatCard
                i={2}
                icon={<MessageCircle className="h-4 w-4" />}
                title="Conversaciones"
                value={loading ? "…" : buyerStats?.activeChatsCount ?? 0}
                hint="chats activos"
                cta={
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/chat">Ver Chats</Link>
                  </Button>
                }
              />
            </div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <Card className="mt-8 glass-effect shadow-glow hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Productos Recomendados</h2>
                      <p className="text-muted-foreground">
                        Explora nuestro catálogo para descubrir productos que te puedan interesar.
                      </p>
                    </div>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 whitespace-nowrap">
                      <Link to="/products">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Explorar Productos
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* ========= Vendedor (SELLER) ========= */}
        {user?.role === UserRole.SELLER && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                i={0}
                icon={<ShoppingBag className="h-4 w-4" />}
                title="Mis Productos"
                value={loading ? "…" : sellerStats?.productsCount ?? 0}
                hint="productos publicados"
                cta={
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/my-products">Ver Mis Productos</Link>
                  </Button>
                }
              />
              <StatCard
                i={1}
                icon={<TrendingUp className="h-4 w-4" />}
                title="Ventas"
                value={`$${loading ? "…" : sellerStats?.totalSales ?? 0}`}
                hint="ingresos totales"
              />
              <StatCard
                i={2}
                icon={<Star className="h-4 w-4" />}
                title="Calificación"
                value={loading ? "…" : (sellerStats?.averageRating ?? 5.0)}
                hint="promedio de calificaciones"
              />
              <StatCard
                i={3}
                icon={<MessageCircle className="h-4 w-4" />}
                title="Mensajes"
                value={loading ? "…" : sellerStats?.activeChatsCount ?? 0}
                hint="mensajes pendientes"
                cta={
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/chat">Ver Chats</Link>
                  </Button>
                }
              />
            </div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card className="glass-effect shadow-glow hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <CardTitle className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">Crear Producto</CardTitle>
                  <CardDescription>
                    Publica un nuevo producto o servicio en la plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                  >
                    <Link to="/products/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Producto
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-effect shadow-glow hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <CardTitle className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">Gestionar Productos</CardTitle>
                  <CardDescription>
                    Ve y administra todos tus productos publicados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200">
                    <Link to="/my-products">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Mis Productos
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* ========= Administrador/Moderador ========= */}
        {(user?.role === UserRole.ADMIN || user?.role === UserRole.MODERATOR) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              i={0}
              icon={<Users className="h-4 w-4" />}
              title="Usuarios Activos"
              value={loading ? "…" : adminStats?.usersCount ?? 0}
              hint="usuarios registrados"
              cta={
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link to="/users">Gestionar Usuarios</Link>
                </Button>
              }
            />
            <StatCard
              i={1}
              icon={<AlertTriangle className="h-4 w-4" />}
              title="Incidencias"
              value={loading ? "…" : adminStats?.incidentsCount ?? 0}
              hint="incidencias pendientes"
              cta={
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link to="/incidents">Ver Incidencias</Link>
                </Button>
              }
            />
            <StatCard
              i={2}
              icon={<Flag className="h-4 w-4" />}
              title="Reportes"
              value={loading ? "…" : adminStats?.reportsCount ?? 0}
              hint="reportes pendientes"
              cta={
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link to="/reports">Ver Reportes</Link>
                </Button>
              }
            />
            <StatCard
              i={3}
              icon={<ShoppingBag className="h-4 w-4" />}
              title="Productos"
              value={loading ? "…" : adminStats?.productsCount ?? 0}
              hint="productos activos"
              cta={
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link to="/products">Ver Productos</Link>
                </Button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
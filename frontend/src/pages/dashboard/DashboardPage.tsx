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
  accent?: "indigo" | "emerald" | "amber" | "pink";
}> = ({ i = 0, icon, title, value, hint, cta, accent = "indigo" }) => {
  const ring =
    accent === "emerald"
      ? "ring-emerald-200/70"
      : accent === "amber"
      ? "ring-amber-200/70"
      : accent === "pink"
      ? "ring-pink-200/70"
      : "ring-indigo-200/70";

  const iconBg =
    accent === "emerald"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
      : accent === "amber"
      ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
      : accent === "pink"
      ? "bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-300"
      : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300";

  return (
    <motion.div custom={i} variants={fadeUp} initial="hidden" animate="visible">
      <Card className="hover:shadow-lg transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={`h-8 w-8 rounded-lg ${iconBg} grid place-items-center`}>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          {cta && <div className="mt-4">{cta}</div>}
        </CardContent>
        <div className={`mx-4 mb-4 rounded-xl ring-2 ${ring}`} />
      </Card>
    </motion.div>
  );
};

/* ========= Hero ========= */
const Hero: React.FC<{ name?: string; badge: React.ReactNode; verified?: boolean }> = ({
  name,
  badge,
  verified,
}) => (
  <motion.div
    variants={fadeUp}
    initial="hidden"
    animate="visible"
    className="relative overflow-hidden rounded-2xl border shadow-lg"
  >
    <div className="bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-emerald-500 p-[1px]">
      <div className="relative rounded-2xl bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {badge}
              {verified ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-600">
                  <Shield className="h-3.5 w-3.5 mr-1" /> Verificada
                </Badge>
              ) : (
                <Badge variant="secondary">Cuenta no verificada</Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Bienvenido, {name ?? "usuario"}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Panel inteligente
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

/* ================== Página ================== */
const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const [buyerStats, setBuyerStats] = useState<BuyerStats | null>(null);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      try {
        setLoading(true);
        switch (user.role) {
          case UserRole.BUYER: {
            const data = await dashboardService.getBuyerStats();
            setBuyerStats(data);
            break;
          }
          case UserRole.SELLER: {
            const data = await dashboardService.getSellerStats();
            setSellerStats(data);
            break;
          }
          case UserRole.ADMIN:
          case UserRole.MODERATOR: {
            const data = await dashboardService.getAdminStats();
            setAdminStats(data);
            break;
          }
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

  const roleBadge = (
    <Badge className="bg-black text-white hover:bg-black/90">
      {user?.role === UserRole.BUYER && "Comprador"}
      {user?.role === UserRole.SELLER && "Vendedor"}
      {user?.role === UserRole.MODERATOR && "Moderador"}
      {user?.role === UserRole.ADMIN && "Administrador"}
    </Badge>
  );

  return (
    <div className="relative min-h-[100dvh]">
      {/* Fondo global en TODA la vista */}
      <PageBackground />

      {/* Contenido por delante del fondo */}
      <div className="relative z-10 space-y-6 pb-16">
        <Hero name={user?.firstName} badge={roleBadge} verified={user?.verified} />

        {user?.role === UserRole.BUYER && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                i={0}
                icon={<ShoppingBag className="h-4 w-4" />}
                title="Explorar Productos"
                value="+1,000"
                hint="productos disponibles"
                accent="indigo"
                cta={
                  <Button asChild className="w-full">
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
                accent="pink"
                cta={
                  <Button asChild variant="outline" className="w-full">
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
                accent="emerald"
                cta={
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/chat">Ver Chats</Link>
                  </Button>
                }
              />
            </div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <Card className="mt-8 border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">Productos Recomendados</h2>
                      <p className="text-muted-foreground">
                        Explora nuestro catálogo para descubrir productos que te puedan interesar.
                      </p>
                    </div>
                    <Button asChild className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:opacity-90">
                      <Link to="/products">Explorar Productos</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {user?.role === UserRole.SELLER && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                i={0}
                icon={<ShoppingBag className="h-4 w-4" />}
                title="Mis Productos"
                value={loading ? "…" : sellerStats?.productsCount ?? 0}
                hint="productos publicados"
                accent="indigo"
                cta={
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/my-products">Ver Productos</Link>
                  </Button>
                }
              />
              <StatCard
                i={1}
                icon={<TrendingUp className="h-4 w-4" />}
                title="Ventas"
                value={`$${loading ? "…" : sellerStats?.totalSales ?? 0}`}
                hint="ingresos totales"
                accent="emerald"
              />
              <StatCard
                i={2}
                icon={<Star className="h-4 w-4" />}
                title="Calificación"
                value={loading ? "…" : (sellerStats?.averageRating ?? 5.0)}
                hint="promedio de calificaciones"
                accent="amber"
              />
              <StatCard
                i={3}
                icon={<MessageCircle className="h-4 w-4" />}
                title="Mensajes"
                value={loading ? "…" : sellerStats?.activeChatsCount ?? 0}
                hint="mensajes pendientes"
                accent="pink"
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
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Crear Producto</CardTitle>
                  <CardDescription>
                    Publica un nuevo producto o servicio en la plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:opacity-90"
                  >
                    <Link to="/products/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Producto
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
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
            </motion.div>
          </>
        )}

        {(user?.role === UserRole.ADMIN || user?.role === UserRole.MODERATOR) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              i={0}
              icon={<Users className="h-4 w-4" />}
              title="Usuarios Activos"
              value={loading ? "…" : adminStats?.usersCount ?? 0}
              hint="usuarios registrados"
              accent="indigo"
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
              accent="amber"
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
              accent="pink"
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
              accent="emerald"
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

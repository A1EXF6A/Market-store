import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";

import {
  AlertTriangle,
  Flag,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  Plus,
  Settings,
  ShoppingBag,
  User,
  Users,
} from "lucide-react";

import PageBackground from "@/components/PageBackground";
import ThemeToggle from "@/components/ThemeToggle";

const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleBadgeClass: Record<UserRole, string> = {
    [UserRole.BUYER]: "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300",
    [UserRole.SELLER]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
    [UserRole.MODERATOR]: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
    [UserRole.ADMIN]: "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300",
  };

  const navigationItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: Home,
      roles: [UserRole.BUYER, UserRole.SELLER, UserRole.MODERATOR, UserRole.ADMIN],
    },
    {
      path: "/products",
      label: "Productos",
      icon: ShoppingBag,
      roles: [UserRole.BUYER, UserRole.SELLER, UserRole.MODERATOR, UserRole.ADMIN],
    },
    { path: "/favorites", label: "Favoritos", icon: Heart, roles: [UserRole.BUYER] },
    { path: "/my-products", label: "Mis Productos", icon: ShoppingBag, roles: [UserRole.SELLER] },
    { path: "/my-incidents", label: "Mis Incidencias", icon: AlertTriangle, roles: [UserRole.SELLER] },
    { path: "/users", label: "Usuarios", icon: Users, roles: [UserRole.ADMIN, UserRole.MODERATOR] },
    { path: "/incidents", label: "Incidencias", icon: AlertTriangle, roles: [UserRole.ADMIN, UserRole.MODERATOR] },
    { path: "/reports", label: "Reportes", icon: Flag, roles: [UserRole.ADMIN, UserRole.MODERATOR] },
    { path: "/chat", label: "Chat", icon: MessageCircle, roles: [UserRole.BUYER, UserRole.SELLER] },
  ];

  const filteredNavItems = navigationItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const isActivePath = (path: string) =>
    location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(path));

  return (
    <div className="relative min-h-[100dvh]">
      {/* Fondo global animado (debajo de todo el contenido) */}
      <PageBackground />

      {/* NAV: sticky, glass, con blur y soporte dark */}
      <nav className="sticky top-0 z-40 w-full border-b border-black/5 bg-white/70 backdrop-blur-md dark:bg-neutral-900/40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo + Rol */}
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"
            >
              CommerceHub
            </Link>

            {user && (
              <Badge className={`${roleBadgeClass[user.role]} hidden sm:inline-flex`}>
                {user.role === UserRole.BUYER && "Comprador"}
                {user.role === UserRole.SELLER && "Vendedor"}
                {user.role === UserRole.MODERATOR && "Moderador"}
                {user.role === UserRole.ADMIN && "Administrador"}
              </Badge>
            )}

            {/* Nav links (desktop) */}
            <div className="ml-6 hidden items-center gap-1 md:flex">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={[
                      "group relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "text-neutral-900 dark:text-white"
                        : "text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {/* underline gradiente solo si activo */}
                    {active && (
                      <span className="pointer-events-none absolute inset-x-2 -bottom-[2px] h-[2px] rounded bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600" />
                    )}
                  </Link>
<<<<<<< HEAD
                );
              })}
=======
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden md:block">{user?.firstName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
  <Settings className="mr-2 h-4 w-4" />
  Configuración
</DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
>>>>>>> 0cda334 (Cambios antes de pasar a rama cambios)
            </div>
          </div>

          {/* Acciones: Crear, Theme, Usuario */}
          <div className="flex items-center gap-2">
            {user?.role === UserRole.SELLER && (
              <Button
                asChild
                size="sm"
                className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 hover:opacity-90 text-white shadow-[0_0_12px_rgba(0,255,255,.25)]"
              >
                <Link to="/products/create">
                  <Plus className="mr-1 h-4 w-4" />
                  Crear Producto
                </Link>
              </Button>
            )}

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:block">{user?.firstName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-neutral-500">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-rose-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Contenedor principal
          - max-w para páginas normales
          - si alguna sección necesita full-bleed, usa `full-bleed` en ese bloque */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

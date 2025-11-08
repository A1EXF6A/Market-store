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
import React from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";

const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleColors = {
    [UserRole.BUYER]: "bg-blue-100 text-blue-800",
    [UserRole.SELLER]: "bg-green-100 text-green-800",
    [UserRole.MODERATOR]: "bg-orange-100 text-orange-800",
    [UserRole.ADMIN]: "bg-red-100 text-red-800",
  };

  const navigationItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: Home,
      roles: [
        UserRole.BUYER,
        UserRole.SELLER,
        UserRole.MODERATOR,
        UserRole.ADMIN,
      ],
    },
    {
      path: "/products",
      label: "Productos",
      icon: ShoppingBag,
      roles: [
        UserRole.BUYER,
        UserRole.SELLER,
        UserRole.MODERATOR,
        UserRole.ADMIN,
      ],
    },
    {
      path: "/favorites",
      label: "Favoritos",
      icon: Heart,
      roles: [UserRole.BUYER],
    },
    {
      path: "/my-products",
      label: "Mis Productos",
      icon: ShoppingBag,
      roles: [UserRole.SELLER],
    },
    {
      path: "/my-incidents",
      label: "Mis Incidencias",
      icon: AlertTriangle,
      roles: [UserRole.SELLER],
    },
    {
      path: "/users",
      label: "Usuarios",
      icon: Users,
      roles: [UserRole.ADMIN, UserRole.MODERATOR],
    },
    {
      path: "/incidents",
      label: "Incidencias",
      icon: AlertTriangle,
      roles: [UserRole.ADMIN, UserRole.MODERATOR],
    },
    {
      path: "/reports",
      label: "Reportes",
      icon: Flag,
      roles: [UserRole.ADMIN, UserRole.MODERATOR],
    },
    {
      path: "/chat",
      label: "Chat",
      icon: MessageCircle,
      roles: [UserRole.BUYER, UserRole.SELLER],
    },
  ];

  const filteredNavItems = navigationItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  const isActivePath = (path: string) => {
    return (
      location.pathname === path ||
      (path !== "/dashboard" && location.pathname.startsWith(path))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-xl font-bold text-gray-900">
                CommerceHub
              </Link>

              <div className="hidden md:flex items-center space-x-4">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-gray-900 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user?.role === UserRole.SELLER && (
                <Button asChild size="sm">
                  <Link to="/products/create">
                    <Plus className="h-4 w-4 mr-1" />
                    Crear Producto
                  </Link>
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
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
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
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

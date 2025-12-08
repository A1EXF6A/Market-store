// src/pages/Layout.tsx
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
  Users,
  Trash,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { usersService } from "@/services/users";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import PageBackground from "@/components/PageBackground";
import ThemeToggle from "@/components/ThemeToggle";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  gender: "male" | "female" | "other";
};

const normalizeGender = (g: any): FormState["gender"] => {
  if (!g) return "other";
  const s = String(g).trim().toLowerCase();
  if (s === "male" || s === "m" || s === "hombre" || s === "masculino") return "male";
  if (s === "female" || s === "f" || s === "mujer" || s === "femenino") return "female";
  return "other";
};

const readUserFromLocalStorage = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("localStorage 'user' parse error:", e);
    return null;
  }
};

const writeUserToLocalStorage = (u: any) => {
  try {
    if (u === null || u === undefined) {
      localStorage.removeItem("user");
      return;
    }
    localStorage.setItem("user", JSON.stringify(u));
  } catch (e) {
    console.warn("Failed to write user to localStorage:", e);
  }
};

const removeUserFromLocalStorage = () => {
  try {
    localStorage.removeItem("user");
  } catch (e) {
    console.warn("Failed to remove user from localStorage:", e);
  }
};

const Layout: React.FC = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [localUser, setLocalUser] = useState<any>(() => readUserFromLocalStorage());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const writeTimer = useRef<number | null>(null);
  const debouncedWriteUser = useCallback((u: any) => {
    if (writeTimer.current) {
      window.clearTimeout(writeTimer.current);
    }
    writeTimer.current = window.setTimeout(() => {
      writeUserToLocalStorage(u);
      writeTimer.current = null;
    }, 150);
  }, []);

  const initialUser = localUser ?? null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    firstName: initialUser?.firstName ?? "",
    lastName: initialUser?.lastName ?? "",
    email: initialUser?.email ?? "",
    phone: initialUser?.phone ?? "",
    address: initialUser?.address ?? "",
    gender: normalizeGender(initialUser?.gender),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (localUser) {
      setForm({
        firstName: localUser.firstName ?? "",
        lastName: localUser.lastName ?? "",
        email: localUser.email ?? "",
        phone: localUser.phone ?? "",
        address: localUser.address ?? "",
        gender: normalizeGender(localUser.gender),
      });
    } else {
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        gender: "other",
      });
    }
  }, [localUser]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "user") {
        const latest = readUserFromLocalStorage();
        setLocalUser(latest);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setUserLocal = useCallback((u: any | null) => {
    setLocalUser(u);
    debouncedWriteUser(u);
  }, [debouncedWriteUser]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const logoutLocal = async () => {
    try {
      // Use logout from authStore instead of authService
      logout();
    } catch (e) {
      console.warn("logout failed:", e);
    }

    setUserLocal(null);
    removeUserFromLocalStorage();
    try {
      localStorage.removeItem("token");
    } catch {}

    navigate("/login");
  };

  const handleLogout = () => {
    logoutLocal();
  };

  const handleSettings = () => {
    setIsModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const closeModal = () => {
    setError(null);
    setIsModalOpen(false);
    const latest = readUserFromLocalStorage() ?? localUser ?? {};
    setForm({
      firstName: latest?.firstName ?? "",
      lastName: latest?.lastName ?? "",
      email: latest?.email ?? "",
      phone: latest?.phone ?? "",
      address: latest?.address ?? "",
      gender: normalizeGender(latest?.gender),
    });
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    if (!localUser) {
      setError("Usuario no encontrado.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const genderToSend = normalizeGender(form.gender);

    const payload: {
      userId?: number | string;
      email?: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      address?: string;
      gender?: string;
    } = {
      email: localUser.email,
      firstName: form.firstName,
      lastName: form.lastName,
      phoneNumber: form.phone,
      address: form.address,
      gender: genderToSend,
    };

    if ((localUser as any).userId !== undefined) {
      payload.userId = (localUser as any).userId;
    } else if ((localUser as any).id !== undefined) {
      payload.userId = (localUser as any).id;
    }

    try {
      const res = await usersService.updateMe(payload);
     
      const updatedUser = {
        ...(localUser ?? {}),
        ...(res || {}),
        firstName: payload.firstName ?? (localUser as any).firstName,
        lastName: payload.lastName ?? (localUser as any).lastName,
        phone: payload.phoneNumber ?? (localUser as any).phone,
        address: payload.address ?? (localUser as any).address,
        gender: payload.gender ?? (localUser as any).gender,
      };

      setUserLocal(updatedUser);

      setSaving(false);
      setSuccessMessage("Datos guardados exitosamente.");

      setForm({
        firstName: updatedUser.firstName ?? "",
        lastName: updatedUser.lastName ?? "",
        email: updatedUser.email ?? "",
        phone: updatedUser.phone ?? "",
        address: updatedUser.address ?? "",
        gender: normalizeGender(updatedUser.gender),
      });

      setTimeout(() => setIsModalOpen(false), 1000);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Error al actualizar el usuario",
      );
      setSaving(false);
    }
  };

  const roleColors: { [key: string]: string } = {
    [UserRole.BUYER]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    [UserRole.SELLER]: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
    [UserRole.MODERATOR]: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    [UserRole.ADMIN]: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  };

  const navigationItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home, roles: [UserRole.BUYER, UserRole.SELLER, UserRole.MODERATOR, UserRole.ADMIN] },
    { path: "/products", label: "Productos", icon: ShoppingBag, roles: [UserRole.BUYER, UserRole.SELLER, UserRole.MODERATOR, UserRole.ADMIN] },
    { path: "/favorites", label: "Favoritos", icon: Heart, roles: [UserRole.BUYER] },
    { path: "/my-products", label: "Mis Productos", icon: ShoppingBag, roles: [UserRole.SELLER] },
    { path: "/my-incidents", label: "Mis Incidencias", icon: AlertTriangle, roles: [UserRole.SELLER] },
    { path: "/users", label: "Usuarios", icon: Users, roles: [UserRole.ADMIN, UserRole.MODERATOR] },
    { path: "/incidents", label: "Incidencias", icon: AlertTriangle, roles: [UserRole.ADMIN, UserRole.MODERATOR] },
    { path: "/reports", label: "Reportes", icon: Flag, roles: [UserRole.ADMIN, UserRole.MODERATOR] },
    { path: "/chat", label: "Chat", icon: MessageCircle, roles: [UserRole.BUYER, UserRole.SELLER] },
  ];

  const filteredNavItems = navigationItems.filter((item) => localUser && item.roles.includes(localUser.role));

  const isActivePath = (path: string) => (
    location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(path))
  );

  const displayedUser = localUser;

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.BUYER: return "Comprador";
      case UserRole.SELLER: return "Vendedor";
      case UserRole.MODERATOR: return "Moderador";
      case UserRole.ADMIN: return "Administrador";
      default: return "Usuario";
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <PageBackground />
      
      {/* Enhanced navigation with improved animations */}
      <nav className="relative z-20 glass-effect backdrop-blur-md border-b border-border/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link 
                to="/dashboard" 
                className="text-xl font-bold text-gradient-cyan hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <Sparkles className="h-6 w-6 animate-pulse-glow" />
                MarketPlace
              </Link>

              <div className="hidden lg:flex items-center space-x-1">
                {filteredNavItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.path);
                  return (
                    <Link 
                      key={item.path} 
                      to={item.path} 
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-glow ${
                        isActive 
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-glow scale-105" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:scale-102"
                      }`}
                      style={{
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="animate-fadeInScale" style={{ animationDelay: "0.3s" }}>
                <ThemeToggle />
              </div>
              
              {displayedUser?.role === UserRole.SELLER && (
                <Button asChild size="sm" className="hidden md:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-glow text-white hover:scale-105 transition-all duration-200 animate-fadeInScale" style={{ animationDelay: "0.4s" }}>
                  <Link to="/products/create">
                    <Plus className="h-4 w-4 mr-1" />
                    Crear Producto
                  </Link>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-accent/50 animate-fadeInScale" style={{ animationDelay: "0.5s" }}>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-glow">
                      {displayedUser?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden md:block font-medium">{displayedUser?.firstName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 glass-effect animate-fadeInScale">
                  <div className="px-2 py-2">
                    <p className="text-sm font-semibold">{displayedUser?.firstName} {displayedUser?.lastName}</p>
                    <p className="text-xs text-muted-foreground mb-2">{displayedUser?.email}</p>
                    <Badge className={roleColors[displayedUser?.role] || "bg-gray-100 text-gray-800"}>
                      {getRoleLabel(displayedUser?.role)}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSettings} className="cursor-pointer hover:bg-accent/50">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20">
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteModalOpen(true)} className="text-red-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20">
                    <Trash className="h-4 w-4 mr-2" />
                    Eliminar cuenta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden animate-fadeInScale"
                style={{ animationDelay: "0.6s" }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          {/* Enhanced mobile menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-border/50 py-4 animate-slideInFromTop">
              <div className="flex flex-col space-y-2">
                {filteredNavItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-glow" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                      style={{
                        animationDelay: `${index * 0.05}s`
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                
                {displayedUser?.role === UserRole.SELLER && (
                  <Link
                    to="/products/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white mt-2 shadow-glow"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Crear Producto</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
        <Outlet />
      </main>

      {/* Settings Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} aria-hidden />
          <div className="relative glass-effect rounded-xl shadow-2xl w-full max-w-lg mx-4 z-10 animate-fadeInScale">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Editar Perfil</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Cerrar">✕</button>
            </div>

            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Nombre</label>
                  <input 
                    type="text" 
                    value={form.firstName} 
                    onChange={(e) => updateField("firstName", e.target.value)} 
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">Apellido</label>
                  <input 
                    type="text" 
                    value={form.lastName} 
                    onChange={(e) => updateField("lastName", e.target.value)} 
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">Correo</label>
                  <input 
                    type="email" 
                    value={form.email} 
                    disabled 
                    className="mt-1 block w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">El correo no puede ser modificado desde aquí.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">Teléfono</label>
                  <input 
                    type="text" 
                    value={form.phone ?? ""} 
                    onChange={(e) => updateField("phone", e.target.value)} 
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">Dirección</label>
                  <input 
                    type="text" 
                    value={form.address ?? ""} 
                    onChange={(e) => updateField("address", e.target.value)} 
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">Género</label>
                  <select 
                    value={form.gender} 
                    onChange={(e) => updateField("gender", e.target.value as FormState["gender"])} 
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="male">Hombre</option>
                    <option value="female">Mujer</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-md">{error}</div>}
                {successMessage && <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded-md">{successMessage}</div>}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border/50 flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="glass-effect">
          <DialogHeader>
            <DialogTitle>Eliminar cuenta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que quieres eliminar tu cuenta? Esta acción marcará
              tu cuenta como eliminada. Podrás volver a registrarte con el mismo correo,
              pero algunos datos podrían conservarse según la política de la plataforma.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deletingAccount}>
                Cancelar
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={async () => {
                  if (!localUser) return;
                  try {
                    setDeletingAccount(true);
                    await usersService.deleteAccount(localUser.userId);
                    await logoutLocal();
                  } catch (err) {
                    console.error(err);
                    alert("Error al eliminar la cuenta");
                  } finally {
                    setDeletingAccount(false);
                    setDeleteModalOpen(false);
                  }
                }}
                disabled={deletingAccount}
              >
                {deletingAccount ? "Eliminando..." : "Eliminar cuenta"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Layout;
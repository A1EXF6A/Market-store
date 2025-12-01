// src/pages/Layout.tsx
import { useAuthStore } from "@/store/authStore"; // <-- solo para logout
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
  Trash,
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
import { authService } from "@/services/auth"; // optional remote logout

type FormState = {
  firstName: string;
  lastName: string;
  email: string; // readonly in UI
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
  // reintroducimos solo logout de la store para que haga lo que hacía antes
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Estado local que representa el usuario (lee de localStorage al montar)
  const [localUser, setLocalUser] = useState<any>(() => readUserFromLocalStorage());

  // Debounce para escritura en localStorage (usado solo cuando guardamos/cerramos sesión)
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

  // Cuando cambie localUser (por ejemplo después de handleSave o por storage event), sincronizamos el form
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

  // Escuchar cambios en localStorage desde otras pestañas y sincronizar
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

  // setter local que también escribe en localStorage debounced
  const setUserLocal = useCallback((u: any | null) => {
    setLocalUser(u);
    debouncedWriteUser(u);
  }, [debouncedWriteUser]);

  // ---------- << IMPORTANTE >> ----------
  // updateField ahora SOLO actualiza el form (no toca localUser ni localStorage)
  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  // --------------------------------------

  // Logout que *usa* el logout que te funcionó antes y además limpia localStorage
  const logoutLocal = async () => {
    try {
      if (logout && typeof logout === "function") {
        try {
          await logout();
        } catch (e) {
          console.warn("store logout failed (continuando):", e);
        }
      } else if (authService && typeof authService.logout === "function") {
        try {
          await authService.logout();
        } catch (e) {
          console.warn("authService.logout failed (continuando):", e);
        }
      }
    } catch {
      // ignore
    }

    // limpiar estado y localStorage
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
    // abrir modal; el form ya contiene los datos actuales de localUser (por useEffect)
    setIsModalOpen(true);
     console.log("User update response:", localUser);
    setError(null);
    setSuccessMessage(null);
  };

  const closeModal = () => {
    setError(null);
    setIsModalOpen(false);
    // restaurar el form desde localUser (descartar cambios)
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
        firstName: payload.firstName ?? (localUser as any).firstName,
        lastName: payload.lastName ?? (localUser as any).lastName,
        phoneNumber: payload.phoneNumber ?? (localUser as any).phone,
        address: payload.address ?? (localUser as any).address,
        gender: payload.gender ?? (localUser as any).gender,
        ...(res?.data || {}),
      };

      // Aquí SÍ actualizamos localUser y localStorage (porque el usuario ACEPTÓ)
      setUserLocal(updatedUser);

      setSaving(false);
      setSuccessMessage("Datos guardados exitosamente.");

      // actualizar el formulario con la respuesta final
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

  const roleColors = {
    [UserRole.BUYER]: "bg-blue-100 text-blue-800",
    [UserRole.SELLER]: "bg-green-100 text-green-800",
    [UserRole.MODERATOR]: "bg-orange-100 text-orange-800",
    [UserRole.ADMIN]: "bg-red-100 text-red-800",
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-xl font-bold text-gray-900">CommerceHub</Link>

              <div className="hidden md:flex items-center space-x-4">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.path);
                  return (
                    <Link key={item.path} to={item.path} className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"}`}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {displayedUser?.role === UserRole.SELLER && (
                <Button asChild size="sm">
                  <Link to="/products/create"><Plus className="h-4 w-4 mr-1" />Crear Producto</Link>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:block">{displayedUser?.firstName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{displayedUser?.firstName} {displayedUser?.lastName}</p>
                    <p className="text-xs text-gray-500">{displayedUser?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSettings}><Settings className="h-4 w-4 mr-2" />Configuración</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600"><LogOut className="h-4 w-4 mr-2" />Cerrar Sesión</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteModalOpen(true)} className="text-red-600"><Trash className="h-4 w-4 mr-2" />Eliminar cuenta</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8"><Outlet /></main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
          <div className="fixed inset-0 bg-black/40" onClick={closeModal} aria-hidden />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 z-10">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">Editar Perfil</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700" aria-label="Cerrar">✕</button>
            </div>

            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input type="text" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Apellido</label>
                  <input type="text" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Correo</label>
                  <input type="email" value={form.email} disabled className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-600 shadow-sm" />
                  <p className="text-xs text-gray-400 mt-1">El correo no puede ser modificado desde aquí.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input type="text" value={form.phone ?? ""} onChange={(e) => updateField("phone", e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <input type="text" value={form.address ?? ""} onChange={(e) => updateField("address", e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Género</label>
                  <select value={form.gender} onChange={(e) => updateField("gender", e.target.value as FormState["gender"])} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="male">Hombre</option>
                    <option value="female">Mujer</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}
                {successMessage && <div className="text-sm text-green-600">{successMessage}</div>}
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 rounded-md border hover:bg-gray-50" disabled={saving}>Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete account modal (Dialog) */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cuenta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que quieres eliminar tu cuenta? Esta acción marcará
              tu cuenta como eliminada. Podrás volver a registrarte con el mismo correo,
              pero algunos datos podrían conservarse según la política de la plataforma.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deletingAccount}>
                Cancelar
              </Button>
              <Button
                className="bg-red-600"
                onClick={async () => {
                  if (!localUser) return;
                  try {
                    setDeletingAccount(true);
                    await usersService.deleteAccount(localUser.userId);
                    // logout locally after deletion
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

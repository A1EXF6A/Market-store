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
import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { usersService } from "@/services/users";

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

const Layout: React.FC = () => {
  const { user, logout, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
    gender: normalizeGender(user?.gender),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? "",
      gender: normalizeGender(user?.gender),
    });
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSettings = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setError(null);
    setIsModalOpen(false);
    setForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? "",
      gender: normalizeGender(user?.gender),
    });
    setSuccessMessage(null);
  };

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    const newForm = { ...form, [field]: value };
    setForm(newForm);

    if (typeof setUser === "function" && user) {
      try {
        setUser({ ...user, ...newForm });
      } catch (e) {
        // do nothing, don't block UI
      }
    }
  };

  const handleSave = async () => {
    if (!user) {
      setError("Usuario no encontrado.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    console.log("Form data to save:", form);

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
      email: user.email,
      firstName: form.firstName,
      lastName: form.lastName,
      phoneNumber: form.phone,
      address: form.address,
      gender: genderToSend,
    };

    if ((user as any).userId !== undefined) {
      payload.userId = (user as any).userId;
    } else if ((user as any).id !== undefined) {
      payload.userId = (user as any).id;
    }

    try {
      const res = await usersService.updateMe(payload);

      // actualizar la store con la respuesta (si viene) o con payload
      const updatedUser = {
        ...user,
        firstName: payload.firstName ?? user.firstName,
        lastName: payload.lastName ?? user.lastName,
        phone: payload.phoneNumber ?? (user as any).phone,
        address: payload.address ?? (user as any).address,
        gender: payload.gender ?? (user as any).gender,
        // si la respuesta incluye campos extra, mezclar:
        ...(res?.data || {}),
      };

      if (typeof setUser === "function") {
        try {
          setUser(updatedUser);
        } catch (e) {
          // ignore
        }
      }

      setSaving(false);
      setSuccessMessage("Datos guardados exitosamente.");
      // cerrar el modal opcionalmente después de 1.5s o dejarlo abierto — aquí lo cerramos después de 1s
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);

      // limpiar mensaje después de 3s
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Error al actualizar el usuario",
      );
      setSaving(false);
      // no cerramos el modal para que el usuario pueda corregir
    }
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
                  <DropdownMenuItem onClick={handleSettings}>
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

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          {/* backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={closeModal}
            aria-hidden
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 z-10">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">Editar Perfil</h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Correo
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-600 shadow-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    El correo no puede ser modificado desde aquí.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={form.phone ?? ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={form.address ?? ""}
                    onChange={(e) => updateField("address", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Género
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      updateField("gender", e.target.value as FormState["gender"])
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="male">Hombre</option>
                    <option value="female">Mujer</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}
                {successMessage && (
                  <div className="text-sm text-green-600">{successMessage}</div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-md border hover:bg-gray-50"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;

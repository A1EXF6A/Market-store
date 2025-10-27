import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types";
import { UserRole, UserStatus } from "@/types";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { usersService, type UserFilters } from "@services/users";
import {
  AlertTriangle,
  Calendar,
  Filter,
  Mail,
  MoreHorizontal,
  Search,
  Settings,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const isManager =
    currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MODERATOR;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (customFilters?: UserFilters) => {
    try {
      setLoading(true);
      const currentFilters = customFilters !== undefined ? customFilters : filters;
      const data = await usersService.getAll(currentFilters);
      setUsers(data);
    } catch (error: any) {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = async () => {
    setFilters({});
    await loadUsers({});
  };

  const handleSuspendUser = async (userId: number, suspend: boolean) => {
    try {
      setActionLoading(userId);
      if (suspend) {
        // Ask admin for suspension duration
        const input = prompt("Duración de la suspensión. Ingresa número de horas (ej: 48), o 'perm' para suspensión permanente:");
        let suspendedUntil: string | undefined = undefined;
        if (input && input.trim().toLowerCase() !== "perm") {
          const hours = parseFloat(input);
          if (!isNaN(hours) && hours > 0) {
            const until = new Date();
            until.setHours(until.getHours() + hours);
            suspendedUntil = until.toISOString();
          }
        }
        await usersService.suspendWithUntil(userId, suspendedUntil);
        toast.success("Usuario suspendido");
      } else {
        await usersService.unsuspend(userId);
        toast.success("Suspensión removida");
      }
      loadUsers();
    } catch (error: any) {
      toast.error("Error al actualizar usuario");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    try {
      setActionLoading(userId);
      await usersService.delete(userId);
      toast.success("Usuario eliminado");
      loadUsers();
    } catch (error: any) {
      toast.error("Error al eliminar usuario");
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId: number, newRole: UserRole) => {
    try {
      setActionLoading(userId);
      await usersService.changeRole(userId, newRole);
      toast.success("Rol actualizado correctamente");
      loadUsers();
    } catch (error: any) {
      toast.error("Error al cambiar el rol del usuario");
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const roleMap = {
      [UserRole.ADMIN]: {
        text: "Administrador",
        class: "bg-purple-100 text-purple-800",
      },
      [UserRole.MODERATOR]: {
        text: "Moderador",
        class: "bg-blue-100 text-blue-800",
      },
      [UserRole.SELLER]: {
        text: "Vendedor",
        class: "bg-green-100 text-green-800",
      },
      [UserRole.BUYER]: {
        text: "Comprador",
        class: "bg-gray-100 text-gray-800",
      },
    };
    const roleInfo = roleMap[role];
    return <Badge className={roleInfo.class}>{roleInfo.text}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return status === "suspended" ? (
      <Badge className="bg-red-100 text-red-800">Suspendido</Badge>
    ) : (
      <Badge className="bg-green-100 text-green-800">Activo</Badge>
    );
  };

  const statuses = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Activos" },
    { key: "suspended", label: "Suspendidos" },
  ];

  const canManageUser = (user: User) => {
    if (currentUser?.role === UserRole.ADMIN) return true;
    if (
      currentUser?.role === UserRole.MODERATOR &&
      user.role !== UserRole.ADMIN
    )
      return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Users className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-2">
            Administra usuarios y sus permisos en la plataforma
          </p>
        </div>
      </div>

      <div>
        {/* Filters (status integrated) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar Usuario</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Nombre, email..."
                    className="pl-10"
                    value={filters.search || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, search: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={filters.role || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      role: value === "all" ? undefined : (value as UserRole),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                    <SelectItem value={UserRole.MODERATOR}>Moderador</SelectItem>
                    <SelectItem value={UserRole.SELLER}>Vendedor</SelectItem>
                    <SelectItem value={UserRole.BUYER}>Comprador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value === "all" ? undefined : (value as UserStatus),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="suspended">Suspendidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={clearFilters} variant="outline" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Limpiar
              </Button>
              <Button onClick={() => loadUsers(filters)} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {canManageUser(user) &&
                      user.userId !== currentUser?.userId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoading === user.userId}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.status === "suspended" ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSuspendUser(user.userId, false)
                                }
                                className="text-green-600"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Reactivar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSuspendUser(user.userId, true)
                                }
                                className="text-orange-600"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Suspender
                              </DropdownMenuItem>
                            )}

                            {currentUser?.role === UserRole.ADMIN && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Cambiar Rol
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {Object.values(UserRole).map((role) => (
                                      <DropdownMenuItem
                                        key={role}
                                        onClick={() =>
                                          handleChangeRole(user.userId, role)
                                        }
                                        disabled={user.role === role}
                                        className={
                                          user.role === role ? "opacity-50" : ""
                                        }
                                      >
                                        {role === UserRole.ADMIN &&
                                          "Administrador"}
                                        {role === UserRole.MODERATOR &&
                                          "Moderador"}
                                        {role === UserRole.SELLER && "Vendedor"}
                                        {role === UserRole.BUYER && "Comprador"}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user.userId)}
                                  className="text-red-600"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron usuarios
              </h3>
              <p className="text-gray-600">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;

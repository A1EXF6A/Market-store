import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { usersService } from "@/services/users";
import { UserRole } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { toast } from "sonner";

const SettingsPage: React.FC = () => {
  const { user, initializeAuth } = useAuthStore();

  const [saving, setSaving] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // ========================= FORM DATA =========================
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    gender: "other" as "male" | "female" | "other",
  });

  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ========================= INIT =========================
  useEffect(() => {
    if (!user) return;

    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      gender: (user.gender as any) || "other",
    });
  }, [user]);

  const onChange = (k: string, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const onPwdChange = (k: string, v: string) =>
    setPwdForm((prev) => ({ ...prev, [k]: v }));

  // ========================= SAVE PROFILE =========================
  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setSaving(true);

      await usersService.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phone,
        address: form.address,
        gender: form.gender,
      });

      toast.success("Perfil actualizado");
      initializeAuth();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  // ========================= SWITCH ROLE =========================
  const handleSwitchRole = async () => {
    if (!user) return;
    try {
      setSwitchingRole(true);
      const nextRole =
        user.role === UserRole.SELLER ? UserRole.BUYER : UserRole.SELLER;

      await usersService.switchMyRole(nextRole);
      toast.success(
        nextRole === UserRole.BUYER
          ? "Ahora eres Comprador"
          : "Ahora eres Vendedor",
      );

      initializeAuth();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error al cambiar rol");
    } finally {
      setSwitchingRole(false);
    }
  };

  // ========================= CHANGE PASSWORD =========================
  const handleChangePassword = async () => {
    if (!pwdForm.currentPassword || !pwdForm.newPassword) {
      toast.error("Completa todos los campos");
      return;
    }

    if (pwdForm.newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error("La confirmación no coincide");
      return;
    }

    try {
      setPwdLoading(true);
      await usersService.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });

      toast.success("Contraseña actualizada");
      setPwdForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error al cambiar contraseña");
    } finally {
      setPwdLoading(false);
    }
  };

  if (!user) return null;

  // ========================= UI =========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 py-16 px-4">
      
      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg">
          Configuración
        </h1>
        <p className="text-blue-100 mt-2 text-lg">
          Administra tus datos personales, accesos y preferencias.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-10">

        {/* ========================= PROFILE ========================= */}
        <Card className="border-none shadow-xl rounded-2xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-700">
              Datos personales
            </CardTitle>
            <p className="text-sm text-gray-500">
              Actualiza tu información básica y de contacto.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  className="focus-visible:ring-blue-500"
                  value={form.firstName}
                  onChange={(e) => onChange("firstName", e.target.value)}
                />
              </div>

              <div>
                <Label>Apellido</Label>
                <Input
                  className="focus-visible:ring-blue-500"
                  value={form.lastName}
                  onChange={(e) => onChange("lastName", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                className="focus-visible:ring-blue-500"
                type="email"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input
                  className="focus-visible:ring-blue-500"
                  value={form.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                />
              </div>

              <div>
                <Label>Dirección</Label>
                <Input
                  className="focus-visible:ring-blue-500"
                  value={form.address}
                  onChange={(e) => onChange("address", e.target.value)}
                />
              </div>
            </div>

            <div className="w-72">
              <Label>Género</Label>
              <Select value={form.gender} onValueChange={(v) => onChange("gender", v)}>
                <SelectTrigger className="focus-visible:ring-blue-500">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Femenino</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg hover:shadow-xl"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>

          </CardContent>
        </Card>

        {/* ========================= PASSWORD ========================= */}
        <Card className="border-none shadow-xl rounded-2xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-700">
              Seguridad
            </CardTitle>
            <p className="text-sm text-gray-500">
              Cambia tu contraseña regularmente para mantener tu cuenta segura.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">

            <div>
              <Label>Contraseña actual</Label>
              <Input
                className="focus-visible:ring-blue-500"
                type="password"
                value={pwdForm.currentPassword}
                onChange={(e) => onPwdChange("currentPassword", e.target.value)}
              />
            </div>

            <div>
              <Label>Nueva contraseña</Label>
              <Input
                className="focus-visible:ring-blue-500"
                type="password"
                value={pwdForm.newPassword}
                onChange={(e) => onPwdChange("newPassword", e.target.value)}
              />
            </div>

            <div>
              <Label>Confirmar nueva contraseña</Label>
              <Input
                className="focus-visible:ring-blue-500"
                type="password"
                value={pwdForm.confirmPassword}
                onChange={(e) => onPwdChange("confirmPassword", e.target.value)}
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={pwdLoading}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg hover:shadow-xl"
            >
              {pwdLoading ? "Actualizando..." : "Cambiar contraseña"}
            </Button>
          </CardContent>
        </Card>

        {/* ========================= ROLE ========================= */}
        {(user.role === UserRole.BUYER || user.role === UserRole.SELLER) && (
          <Card className="border-none shadow-xl rounded-2xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-blue-700">
                Rol de tu cuenta
              </CardTitle>
              <p className="text-sm text-gray-500">
                Cambia entre comprador y vendedor según tus necesidades.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">

              <p className="text-sm text-gray-700">
                Rol actual:{" "}
                <strong>
                  {user.role === UserRole.SELLER ? "Vendedor" : "Comprador"}
                </strong>
              </p>

              <Button
                variant="outline"
                onClick={handleSwitchRole}
                disabled={switchingRole}
                className="w-full md:w-auto border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold shadow-lg hover:shadow-xl"
              >
                {switchingRole
                  ? "Cambiando..."
                  : user.role === UserRole.SELLER
                  ? "Cambiar a Comprador"
                  : "Cambiar a Vendedor"}
              </Button>

            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { usersService } from "@/services/users";
import { UserRole } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
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

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    gender: "other" as "male" | "female" | "other",
  });

  const [saving, setSaving] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  // ✅ NUEVO: formulario contraseña
  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdLoading, setPwdLoading] = useState(false);

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

  // ============================
  // GUARDAR PERFIL
  // ============================
  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setSaving(true);

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phone, // backend espera phoneNumber
        address: form.address,
        gender: form.gender,
      };

      await usersService.updateProfile(payload);
      toast.success("Perfil actualizado");
      await initializeAuth();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // CAMBIAR ROL BUYER/SELLER
  // ============================
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

      await initializeAuth();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error al cambiar rol");
    } finally {
      setSwitchingRole(false);
    }
  };

  // ============================
  // ✅ CAMBIAR CONTRASEÑA
  // ============================
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración</h1>

      {/* ================= PERFIL ================= */}
      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={form.firstName}
                onChange={(e) => onChange("firstName", e.target.value)}
              />
            </div>

            <div>
              <Label>Apellido</Label>
              <Input
                value={form.lastName}
                onChange={(e) => onChange("lastName", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
          </div>

          <div>
            <Label>Teléfono</Label>
            <Input
              value={form.phone}
              onChange={(e) => onChange("phone", e.target.value)}
            />
          </div>

          <div>
            <Label>Dirección</Label>
            <Input
              value={form.address}
              onChange={(e) => onChange("address", e.target.value)}
            />
          </div>

          <div>
            <Label>Género</Label>
            <Select
              value={form.gender}
              onValueChange={(v) => onChange("gender", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Femenino</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </CardContent>
      </Card>

      {/* ================= SEGURIDAD ================= */}
      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Contraseña actual</Label>
            <Input
              type="password"
              value={pwdForm.currentPassword}
              onChange={(e) => onPwdChange("currentPassword", e.target.value)}
            />
          </div>

          <div>
            <Label>Nueva contraseña</Label>
            <Input
              type="password"
              value={pwdForm.newPassword}
              onChange={(e) => onPwdChange("newPassword", e.target.value)}
            />
          </div>

          <div>
            <Label>Confirmar nueva contraseña</Label>
            <Input
              type="password"
              value={pwdForm.confirmPassword}
              onChange={(e) => onPwdChange("confirmPassword", e.target.value)}
            />
          </div>

          <Button onClick={handleChangePassword} disabled={pwdLoading}>
            {pwdLoading ? "Actualizando..." : "Cambiar contraseña"}
          </Button>
        </CardContent>
      </Card>

      {/* ================= ROL ================= */}
      {(user.role === UserRole.BUYER || user.role === UserRole.SELLER) && (
        <Card>
          <CardHeader>
            <CardTitle>Rol de tu cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Tu rol actual es:{" "}
              <strong>
                {user.role === UserRole.SELLER ? "Vendedor" : "Comprador"}
              </strong>
            </p>

            <Button
              variant="outline"
              onClick={handleSwitchRole}
              disabled={switchingRole}
            >
              {switchingRole
                ? "Cambiando..."
                : user.role === UserRole.SELLER
                ? "Cambiar a Comprador"
                : "Cambiar a Vendedor"}
            </Button>

            <p className="text-xs text-gray-500">
              * Esto te permite usar la plataforma con el otro rol también.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

import AuthLayout from "@/components/AuthLayout";
import { UserPlus, IdCard, Mail, Lock, MapPin, Phone, User, Eye, EyeOff } from "lucide-react";

/* ========= Validación ========= */
const registerSchema = z
  .object({
    nationalId: z.string().min(1, "Cédula requerida"),
    firstName: z.string().min(1, "Nombre requerido"),
    lastName: z.string().min(1, "Apellido requerido"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    address: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    role: z.nativeEnum(UserRole),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: UserRole.BUYER,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      toast.success("Registro exitoso");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al registrarse");
    }
  };

  return (
    <AuthLayout
      title="Marketplace"
      subtitle="Crea tu cuenta y comienza a vender o comprar"
      badge="Centro de registro"
    >
      <div className="rounded-2xl bg-gradient-to-r from-cyan-500/30 to-blue-500/30 p-[1px] shadow-[0_0_25px_rgba(0,255,255,0.25)] backdrop-blur-xl">
        <Card className="rounded-2xl border-0 bg-slate-900/70 shadow-2xl backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-cyan-100">
              <UserPlus className="h-5 w-5 text-cyan-400" />
              Crear Cuenta
            </CardTitle>
            <CardDescription className="text-gray-400">
              Completa tus datos para registrarte
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-cyan-100">
                    Nombre
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                    <Input
                      id="firstName"
                      placeholder="Tu nombre"
                      className="pl-9 bg-slate-800/50 border-cyan-800 text-cyan-100 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                      {...register("firstName")}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-cyan-100">
                    Apellido
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Tu apellido"
                    className="bg-slate-800/50 border-cyan-800 text-cyan-100 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Cédula */}
              <div className="space-y-2">
                <Label htmlFor="nationalId" className="text-cyan-100">Cédula</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                  <Input
                    id="nationalId"
                    placeholder="1234567890"
                    className="pl-9 bg-slate-800/50 border-cyan-800 text-cyan-100 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                    {...register("nationalId")}
                  />
                </div>
                {errors.nationalId && (
                  <p className="text-sm text-red-500">{errors.nationalId.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-cyan-100">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@correo.com"
                    className="pl-9 bg-slate-800/50 border-cyan-800 text-cyan-100 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              {/* Teléfono y Dirección */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-cyan-100">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                    <Input
                      id="phone"
                      placeholder="+593987654321"
                      className="pl-9 bg-slate-800/50 border-cyan-800 text-cyan-100 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                      {...register("phone")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-cyan-100">Dirección</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                    <Input
                      id="address"
                      placeholder="Tu dirección"
                      className="pl-9 bg-slate-800/50 border-cyan-800 text-cyan-100 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                      {...register("address")}
                    />
                  </div>
                </div>
              </div>

              {/* Tipo de cuenta */}
              <div className="space-y-2">
                <Label className="text-cyan-100">Tipo de cuenta</Label>
                <Select onValueChange={(v) => setValue("role", v as UserRole)}>
                  <SelectTrigger className="bg-slate-800/50 border-cyan-800 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500">
                    <SelectValue placeholder="Selecciona tu rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.BUYER}>Comprador</SelectItem>
                    <SelectItem value={UserRole.SELLER}>Vendedor</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
              </div>

              {/* Contraseñas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-cyan-100">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-10 bg-slate-800/50 border-cyan-800 text-cyan-100 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-cyan-300 hover:text-white hover:bg-cyan-600/20 rounded-md"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-cyan-100">Confirmar</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-10 bg-slate-800/50 border-cyan-800 text-cyan-100 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-cyan-300 hover:text-white hover:bg-cyan-600/20 rounded-md"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="group w-full justify-center bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 hover:opacity-90 shadow-[0_0_15px_rgba(0,255,255,0.2)] text-white font-semibold"
              >
                <UserPlus className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                {isLoading ? "Registrando..." : "Crear Cuenta"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300">
                Inicia sesión aquí
              </Link>
              <br />
              ¿No recibiste el correo de verificación?{" "}
              <Link to="/resend-verification" className="font-semibold text-cyan-400 hover:text-cyan-300">
                Reenviar verificación
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;

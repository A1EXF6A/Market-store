// src/pages/LoginPage.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAuthStore } from "@/store/authStore";
import getErrorMessage from "@/i18n/errorMessages";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";

import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Zap,
} from "lucide-react";

/* ============ Validación ============ */
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});
type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  /* ============ Envío ============ */
 const onSubmit = async (data: LoginFormData) => {
  try {
    await login(data.email, data.password);
    toast.success("Inicio de sesión exitoso");
    navigate("/dashboard");
  } catch (error: any) {
    const code = error?.response?.data?.message;

    if (code === "EMAIL_NOT_VERIFIED") {
      toast.error("Tu cuenta no está verificada. Revisa tu correo o reenvía el enlace.");
      navigate(`/resend-verification?email=${encodeURIComponent(data.email)}`);
      return;
    }

    const errorMessage = getErrorMessage(code, "es") || "Error al iniciar sesión";
    console.log(errorMessage);

    toast.error(errorMessage);
  }
};


  /* ============ UI ============ */
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* ==== Fondo animado ==== */}
      <div className="pointer-events-none absolute inset-0 animate-bgFlow bg-[length:400%_400%] bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800" />

      {/* Luces difusas de fondo */}
      <div className="absolute top-1/3 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-[150px]" />
      <div className="absolute -bottom-40 right-1/4 h-[24rem] w-[24rem] rounded-full bg-blue-600/20 blur-[130px]" />
      <div className="absolute -top-32 left-1/4 h-[20rem] w-[20rem] rounded-full bg-indigo-500/15 blur-[120px]" />

      {/* Patrón de cuadrícula */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ==== Contenido principal ==== */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-600/20 px-3 py-1 text-xs text-cyan-200 backdrop-blur-md shadow-sm ring-1 ring-cyan-500/30">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-medium">Bienvenido a</span>
            </div>
            <h2 className="bg-gradient-to-r from-cyan-200 via-blue-200 to-white bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-[0_2px_10px_rgba(0,255,255,0.25)]">
              Marketplace
            </h2>
            <p className="mt-2 text-cyan-100 text-sm font-light tracking-wide">
              Inicia sesión en tu cuenta
            </p>
          </div>

          {/* Tarjeta principal */}
          <div className="rounded-2xl bg-gradient-to-r from-cyan-500/30 to-blue-500/30 p-[1px] shadow-[0_0_25px_rgba(0,255,255,0.25)] backdrop-blur-xl">
            <Card className="rounded-2xl border-0 bg-slate-900/70 shadow-2xl backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-cyan-100">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  Iniciar Sesión
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Ingresa tus credenciales para acceder a tu cuenta
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-cyan-100">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="usuario@correo.com"
                        className="pl-9 bg-slate-800/50 border-cyan-800 text-cyan-100 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                        {...register("email")}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Contraseña */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-cyan-100">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-cyan-300 hover:text-white hover:bg-cyan-600/20"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="group w-full justify-center bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 hover:opacity-90 shadow-[0_0_15px_rgba(0,255,255,0.2)] text-white font-semibold"
                  >
                    <LogIn className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </form>

                <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-cyan-700/50 to-transparent" />
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-400">
                    ¿No tienes cuenta?{" "}
                    <Link
                      to="/register"
                      className="font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      Regístrate aquí
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="mt-6 text-center text-xs text-cyan-100/80">
            Sistema protegido con cifrado avanzado y autenticación segura
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

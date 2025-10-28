import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import getErrorMessage from "@/i18n/errorMessages";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [suspensionInfo, setSuspensionInfo] = useState<{
    suspendedUntil: string | null;
  } | null>(null);

  const getSuspensionMessage = () => {
    if (!suspensionInfo) return "";
    
    if (suspensionInfo.suspendedUntil) {
      const suspendedUntil = new Date(suspensionInfo.suspendedUntil);
      const formattedDate = format(suspendedUntil, "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { 
        locale: es 
      });
      return `Tu cuenta está suspendida hasta el ${formattedDate}. No podrás acceder hasta que se complete el período de suspensión.`;
    } else {
      return "Tu cuenta está suspendida indefinidamente. Contacta al soporte para más información.";
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setFormError("");
      setSuspensionInfo(null);
      await login(data.email, data.password);
      toast.success("Inicio de sesión exitoso");
      navigate("/dashboard");
    } catch (error: any) {
      const errorData = error.response?.data;
      
      console.log("Error completo:", error.response?.data); // Para debug
      
      if (errorData?.message === "ACCOUNT_SUSPENDED") {
        // Manejar suspensión - buscar suspendedUntil en errorData
        const suspendedUntil = errorData?.suspendedUntil || null;
        console.log("suspendedUntil recibido:", suspendedUntil, "type:", typeof suspendedUntil); // Para debug
        setSuspensionInfo({
          suspendedUntil: suspendedUntil
        });
        setFormError(""); // Clear general error since we're showing suspension specific message
      } else if (errorData?.message === "ACCOUNT_BANNED") {
        setFormError("Tu cuenta ha sido baneada permanentemente. Contacta al soporte para más información.");
      } else {
        const code = errorData?.message;
        const errorMessage = getErrorMessage(code, "es");
        setFormError(errorMessage);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Marketplace</h2>
          <p className="mt-2 text-gray-600">Inicia sesión en tu cuenta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Mensaje de error general */}
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              {/* Mensaje de suspensión */}
              {suspensionInfo && (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-orange-800">
                        Cuenta Suspendida
                      </h3>
                      <p className="text-sm text-orange-700 mt-1">
                        {getSuspensionMessage()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{" "}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;

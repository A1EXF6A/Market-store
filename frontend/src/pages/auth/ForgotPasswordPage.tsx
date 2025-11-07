import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { authService } from "@services/auth";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";

import { Mail, SendHorizonal, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      await authService.forgotPassword(data.email);
      toast.success("Se ha enviado un enlace de recuperación a tu email");
      navigate("/login");
    } catch {
      toast.error("Error al enviar el email de recuperación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Marketplace"
      subtitle="Recupera tu contraseña"
      badge="Centro de seguridad"
    >
      {/* Borde degradado + glass */}
      <div className="rounded-2xl bg-gradient-to-r from-cyan-500/30 to-blue-500/30 p-[1px] shadow-[0_0_25px_rgba(0,255,255,0.25)] backdrop-blur-xl">
        <Card className="rounded-2xl border-0 bg-slate-900/70 shadow-2xl backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-cyan-100">Recuperar contraseña</CardTitle>
            <CardDescription className="text-gray-400">
              Ingresa tu email y te enviaremos un enlace para restablecerla
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-cyan-100">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-9 bg-slate-800/50 border-cyan-800 text-cyan-100 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm font-medium text-cyan-300 hover:text-cyan-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio de sesión
                </Link>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="group inline-flex items-center bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 hover:opacity-90 shadow-[0_0_15px_rgba(0,255,255,0.2)] text-white font-semibold"
                >
                  <SendHorizonal className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                  {isLoading ? "Enviando..." : "Enviar enlace"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;

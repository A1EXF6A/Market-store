import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowLeft,
  Lock,
  KeyRound,
  Sparkles,
} from "lucide-react";

import { authService } from "@services/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";

/* ---------------- SCHEMA ---------------- */
const resetPasswordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/* ===================================================== */

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  /* ------------------- VALIDATE TOKEN ------------------- */
  React.useEffect(() => {
    if (!token) {
      toast.error("Token de recuperación inválido");
      navigate("/login");
    }
  }, [token, navigate]);

  /* ------------------- SUBMIT ------------------- */
  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    try {
      setIsLoading(true);
      await authService.resetPassword(token, data.password);

      toast.success("Contraseña restablecida con éxito");
      navigate("/login");
    } catch (error) {
      toast.error("Error, el token puede haber expirado");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return null;

  /* ===================================================== */

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-10">

      {/* ====== BACKGROUND ====== */}
      <div
        className="pointer-events-none absolute inset-0 -z-20 animate-[bgshift_20s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(1600px at 10% -10%, rgba(59,130,246,0.45), transparent 55%)," +
            "radial-gradient(1400px at 110% 10%, rgba(6,182,212,0.42), transparent 55%)," +
            "radial-gradient(1200px at 50% 110%, rgba(147,197,253,0.30), transparent 65%)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22] mix-blend-overlay"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
          backgroundSize: "38px 38px, 38px 38px",
        }}
      />

      {/* BLOBS */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-[460px] w-[460px] -z-10 rounded-full blur-3xl opacity-50 animate-[blob_22s_infinite] bg-sky-400/40"></div>
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-[500px] w-[500px] -z-10 rounded-full blur-3xl opacity-50 animate-[blob_18s_infinite_alternate] bg-blue-500/40"></div>

      {/* ===================================================== */}

      <div className="w-full max-w-md space-y-8 relative z-10">

        {/* ----- HEADER ----- */}
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold tracking-tight text-blue-900 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-blue-500" />
            Marketplace
          </h2>
          <p className="text-blue-800/70 font-medium">
            Establece tu nueva contraseña
          </p>
        </div>

        {/* ====== CARD ====== */}
        <Card className="shadow-xl border-blue-200/20 backdrop-blur-md bg-white/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Lock className="h-5 w-5 text-blue-600" />
              Restablecer Contraseña
            </CardTitle>
            <p className="text-sm text-blue-800/70">
              Ingresa tu nueva contraseña para recuperar el acceso
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* PASSWORD */}
              <div className="space-y-2">
                <Label>Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 focus:ring-blue-500"
                    {...register("password")}
                  />
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-2">
                <Label>Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 focus:ring-blue-500"
                    {...register("confirmPassword")}
                  />
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* SUBMIT */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? "Restableciendo..." : "Guardar nueva contraseña"}
              </Button>
            </form>

            {/* LINK */}
            <div className="mt-6 text-center">
              <p className="text-sm text-blue-800/70">
                ¿Recordaste tu contraseña?{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 underline-offset-2 underline"
                >
                  Volver a inicio de sesión
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== ANIMATIONS ====== */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(25px,-20px) scale(1.08); }
        }
        @keyframes bgshift {
          0% { filter: hue-rotate(0deg) }
          50% { filter: hue-rotate(25deg) }
          100% { filter: hue-rotate(0deg) }
        }
      `}</style>
    </div>
  );
};

export default ResetPasswordPage;

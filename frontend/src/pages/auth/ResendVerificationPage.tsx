// src/pages/ResendVerificationPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import { authService } from "@/services/auth";
import { toast } from "sonner";
import { Mail, Zap } from "lucide-react";

const schema = z.object({ email: z.string().email("Email inválido") });
type FormData = z.infer<typeof schema>;

const ResendVerificationPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const onSubmit = async ({ email }: FormData) => {
    try {
      setLoading(true);
      await authService.resendVerification(email);
      setSent(true);
      toast.success("Te enviamos un nuevo correo de verificación.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "No se pudo reenviar el correo");
    } finally {
      setLoading(false);
    }
  };

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

      {/* Contenido principal */}
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
              Reenviar enlace de verificación
            </p>
          </div>

          {/* Tarjeta principal con gradient wrapper (coherencia con LoginPage) */}
          <div className="rounded-2xl bg-gradient-to-r from-cyan-500/30 to-blue-500/30 p-[1px] shadow-[0_0_25px_rgba(0,255,255,0.25)] backdrop-blur-xl">
            <Card className="rounded-2xl border-0 bg-slate-900/70 shadow-2xl backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-cyan-100">
                  <Mail className="h-5 w-5 text-cyan-400" />
                  Reenviar verificación
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Ingresa tu correo y te enviaremos un nuevo enlace.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {sent ? (
                  <div
                    className="space-y-4 text-center"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <div className="mx-auto h-12 w-12 rounded-full bg-sky-600/10 text-sky-600 grid place-items-center">
                      <Mail className="h-6 w-6" />
                    </div>
                    <p className="text-slate-300">
                      Revisa tu bandeja de entrada. Si no lo ves, revisa la carpeta de spam.
                    </p>
                    <Button
                      asChild
                      className="w-full justify-center bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 hover:opacity-90 text-white font-semibold"
                    >
                      <Link to="/login">Volver al login</Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-cyan-100">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
                        <Input
                          id="email"
                          placeholder="tu@email.com"
                          className="pl-9 bg-slate-800/50 border-cyan-800 text-cyan-100 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500"
                          autoComplete="email"
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? "email-error" : undefined}
                          {...register("email")}
                        />
                      </div>
                      {errors.email && (
                        <p id="email-error" className="text-sm text-rose-500">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <Link
                        to="/login"
                        className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
                      >
                        ¿Recordaste tu contraseña?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="group w-full justify-center bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 hover:opacity-90 shadow-[0_0_15px_rgba(0,255,255,0.2)] text-white font-semibold"
                      aria-busy={loading}
                    >
                      {loading ? "Enviando..." : "Enviar enlace de verificación"}
                    </Button>

                    <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-cyan-700/30 to-transparent" />

                    <p className="mt-4 text-center text-sm text-gray-400">
                      ¿Ya estás verificado?{" "}
                      <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300">
                        Inicia sesión
                      </Link>
                    </p>
                  </form>
                )}
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

export default ResendVerificationPage;

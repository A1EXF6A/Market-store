// src/pages/VerifyEmailPage.tsx
import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@components/ui/card";
import { Button } from "@components/ui/button";
import { authService } from "@/services/auth";
import { toast } from "sonner";
import { ShieldCheck, Loader2, Zap } from "lucide-react";

const VerifyEmailPage: React.FC = () => {
  const [search] = useSearchParams();
  // const navigate = useNavigate(); // Removed unused navigate
  const token = search.get("token");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState<null | "ok" | "fail">(null);

  const verify = async () => {
    if (!token) {
      toast.error("Token inválido o faltante.");
      setDone("fail");
      return;
    }
    try {
      setLoading(true);
      await authService.verifyEmail(token);
      setDone("ok");
      toast.success("Correo verificado con éxito");
      // si quieres redirigir automático luego de 2s:
      // setTimeout(() => navigate("/login"), 1800);
    } catch (e: any) {
      setDone("fail");
      toast.error(e?.response?.data?.message || "No se pudo verificar el correo");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              Verificación de correo
            </p>
          </div>

          {/* Tarjeta principal con gradient wrapper (coherencia con otras páginas) */}
          <div className="rounded-2xl bg-gradient-to-r from-cyan-500/30 to-blue-500/30 p-[1px] shadow-[0_0_25px_rgba(0,255,255,0.25)] backdrop-blur-xl">
            <Card className="rounded-2xl border-0 bg-slate-900/70 shadow-2xl backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-cyan-100">
                  <ShieldCheck className="h-5 w-5 text-cyan-400" />
                  Verificación de correo
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Estamos validando tu enlace…
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4" aria-live="polite" aria-atomic="true">
                {loading && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verificando…</span>
                  </div>
                )}
                {done === "ok" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <ShieldCheck className="h-5 w-5" />
                      <span>¡Tu correo fue verificado!</span>
                    </div>
                    <Button
                      asChild
                      className="w-full justify-center bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 hover:opacity-90 text-white font-semibold"
                    >
                      <Link to="/login">Ir a iniciar sesión</Link>
                    </Button>
                  </div>
                )}
                {done === "fail" && (
                  <div className="space-y-4">
                    <p className="text-rose-500">El enlace no es válido o expiró.</p>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full text-cyan-300 border-cyan-700 hover:bg-cyan-700/5"
                    >
                      <Link to="/resend-verification">Reenviar verificación</Link>
                    </Button>
                  </div>
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

export default VerifyEmailPage;

// src/pages/VerifyEmailPage.tsx
import React from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { authService } from "@/services/auth";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";

const VerifyEmailPage: React.FC = () => {
  const [search] = useSearchParams();
  const navigate = useNavigate();
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
    <div className="min-h-screen grid place-items-center bg-[radial-gradient(1200px_600px_at_10%_-10%,#1e293b_15%,transparent_60%),radial-gradient(900px_400px_at_90%_10%,#0f172a_15%,transparent_60%)]">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Verificación de correo</CardTitle>
          <CardDescription>Estamos validando tu enlace…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando…
            </div>
          )}
          {done === "ok" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
                <span>¡Tu correo fue verificado!</span>
              </div>
              <Button asChild className="w-full">
                <Link to="/login">Ir a iniciar sesión</Link>
              </Button>
            </div>
          )}
          {done === "fail" && (
            <div className="space-y-4">
              <p className="text-rose-600">El enlace no es válido o expiró.</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/resend-verification">Reenviar verificación</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;

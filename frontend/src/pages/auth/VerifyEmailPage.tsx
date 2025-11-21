import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@services/api"; // tu wrapper de fetch/axios

const VerifyEmailPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading"|"ok"|"error">("loading");

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus("error");
        return;
      }
      try {
        // GET /auth/verify-email?token=...
        await api.get(`/auth/verify-email`, { params: { token } });
        setStatus("ok");
        toast.success("Correo verificado correctamente");
        // Opcional: redirigir a login después de 1.5s
        setTimeout(() => navigate("/login"), 1500);
      } catch (e:any) {
        setStatus("error");
        toast.error(e?.response?.data?.message || "Token inválido o expirado");
      }
    };
    void run();
  }, [token, navigate]);

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Verificación de correo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p>Verificando tu correo…</p>
            </div>
          )}
          {status === "ok" && (
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="h-10 w-10 text-emerald-600" />
              <p>¡Todo listo! Redirigiendo al inicio de sesión…</p>
              <Button asChild>
                <Link to="/login">Ir al login</Link>
              </Button>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="h-10 w-10 text-rose-600" />
              <p>El enlace no es válido o expiró.</p>
              <Button asChild variant="outline">
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

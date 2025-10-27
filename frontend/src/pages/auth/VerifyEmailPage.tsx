import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { authService } from "@services/auth";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no encontrado");
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const data = await authService.verifyEmail(token);
      setStatus("success");
      setMessage(data.message || "Email verificado exitosamente");
      toast.success("¡Email verificado exitosamente!");
    } catch (error: any) {
      setStatus("error");
      setMessage(
        error.response?.data?.message || "Error al verificar el email",
      );
      toast.error("Error al verificar el email");
    }
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  const handleResendVerification = () => {
    navigate("/resend-verification");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {status === "error" && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Verificando email..."}
            {status === "success" && "¡Email verificado!"}
            {status === "error" && "Error de verificación"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <Button className="w-full" onClick={handleGoToLogin}>
              Ir a iniciar sesión
            </Button>
          )}
          {status === "error" && (
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={handleResendVerification}
                variant="outline"
              >
                Reenviar verificación
              </Button>
              <Button className="w-full" onClick={handleGoToLogin}>
                Ir a iniciar sesión
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


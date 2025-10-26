import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { authService } from "@services/auth";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Por favor ingresa tu email");
      return;
    }

    setIsLoading(true);

    try {
      await authService.resendVerification(email);
      setIsSuccess(true);
      toast.success(
        "Si el email existe, se ha enviado un enlace de verificación",
      );
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error al reenviar verificación",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Mail className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">¡Listo!</CardTitle>
            <CardDescription>
              Si el email existe en nuestro sistema, hemos enviado un nuevo
              enlace de verificación. Revisa tu bandeja de entrada y spam.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Mail className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Reenviar verificación
          </CardTitle>
          <CardDescription>
            Ingresa tu email para recibir un nuevo enlace de verificación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Reenviar verificación"}
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al login
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


// src/pages/ResendVerificationPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import { authService } from "@/services/auth";
import { toast } from "sonner";
import { Mail } from "lucide-react";

const schema = z.object({ email: z.string().email("Email inválido") });
type FormData = z.infer<typeof schema>;

const ResendVerificationPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
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
    <div className="min-h-screen grid place-items-center bg-[radial-gradient(1200px_600px_at_10%_-10%,#1e293b_15%,transparent_60%),radial-gradient(900px_400px_at_90%_10%,#0f172a_15%,transparent_60%)]">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Reenviar verificación</CardTitle>
          <CardDescription>Ingresa tu correo y te enviaremos un nuevo enlace.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-sky-600/10 text-sky-600 grid place-items-center">
                <Mail className="h-6 w-6" />
              </div>
              <p className="text-slate-600">Revisa tu bandeja de entrada.</p>
              <Button asChild className="w-full">
                <Link to="/login">Volver al login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="tu@email.com" {...register("email")} />
                {errors.email && <p className="text-sm text-rose-600">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya estás verificado?{" "}
                <Link to="/login" className="text-sky-600 hover:underline">Inicia sesión</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResendVerificationPage;

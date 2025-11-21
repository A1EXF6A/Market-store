import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Mail, ArrowRight } from "lucide-react";
import { Button } from "@components/ui/button";
import AuthLayout from "@/components/AuthLayout";

const VerifyEmailSentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Si el correo viene en la URL (ej. /verify-email-sent?email=usuario@gmail.com)
  const email = new URLSearchParams(location.search).get("email");

  return (
    <AuthLayout
      title="Marketplace"
      subtitle="Verifica tu cuenta para comenzar a usar la plataforma"
      badge="Verificación enviada"
    >
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Ícono grande */}
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-cyan-600/30 rounded-full w-32 h-32" />
          <div className="relative z-10 flex items-center justify-center w-32 h-32 rounded-full bg-cyan-600/20 border border-cyan-500/40 backdrop-blur-md">
            <Mail className="h-16 w-16 text-cyan-300" />
          </div>
        </div>

        {/* Mensaje principal */}
        <div>
          <h2 className="text-2xl font-bold text-cyan-100">
            ¡Verifica tu correo electrónico!
          </h2>
          <p className="mt-2 text-cyan-200/80 max-w-md mx-auto">
            {email
              ? `Te enviamos un enlace de verificación a ${email}.`
              : "Te enviamos un enlace de verificación a tu correo registrado."}{" "}
            Abre tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col items-center space-y-4">
          <Button
            onClick={() => navigate("/login")}
            className="group bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 hover:opacity-90 shadow-[0_0_15px_rgba(0,255,255,0.2)] text-white font-semibold"
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Ir al inicio de sesión
          </Button>

          <Link
            to="/resend-verification"
            className="flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200 transition"
          >
            <ArrowRight className="h-4 w-4" />
            Reenviar correo de verificación
          </Link>
        </div>

        {/* Nota */}
        <p className="text-xs text-gray-400 mt-6 max-w-sm mx-auto">
          Si no ves el correo, revisa tu carpeta de spam o espera unos minutos.  
          El enlace de verificación expira en 24 horas.
        </p>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailSentPage;

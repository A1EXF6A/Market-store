import React from "react";
import { Zap } from "lucide-react";

const AuthLayout: React.FC<{
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, badge = "Bienvenido", children }) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Fondo animado */}
      <div className="pointer-events-none absolute inset-0 animate-bgFlow bg-[length:400%_400%] bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800" />

      {/* Glows suaves */}
      <div className="absolute top-1/3 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-[150px]" />
      <div className="absolute -bottom-40 right-1/4 h-[24rem] w-[24rem] rounded-full bg-blue-600/20 blur-[130px]" />
      <div className="absolute -top-32 left-1/4 h-[20rem] w-[20rem] rounded-full bg-indigo-500/15 blur-[120px]" />

      {/* Grid finito */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Contenido */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-600/20 px-3 py-1 text-xs text-cyan-200 backdrop-blur-md shadow-sm ring-1 ring-cyan-500/30">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-medium">{badge}</span>
            </div>
            <h2 className="bg-gradient-to-r from-cyan-200 via-blue-200 to-white bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-[0_2px_10px_rgba(0,255,255,0.25)]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-cyan-100 text-sm font-light tracking-wide">
                {subtitle}
              </p>
            )}
          </div>

          {children}

          <p className="mt-6 text-center text-xs text-cyan-100/80">
            Sistema protegido con cifrado avanzado y autenticación segura
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

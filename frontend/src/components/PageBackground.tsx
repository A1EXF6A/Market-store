import React from "react";

/**
 * Fondo global fijo, en capas, que cubre TODA la página incluso al hacer scroll.
 * - Base: color claro/oscuro según tema
 * - Gradientes suaves arriba y abajo
 * - “glows” grandes con blur
 * - Textura/ruido muy sutil
 */
const PageBackground: React.FC = () => {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {/* Capa base (que no quede blanco nunca) */}
      <div className="absolute inset-0 bg-neutral-50 dark:bg-neutral-950" />

      {/* Degradado superior sutil */}
      <div className="absolute inset-x-0 top-0 h-[50svh] bg-gradient-to-b from-fuchsia-200/40 via-indigo-200/20 to-transparent dark:from-fuchsia-500/15 dark:via-indigo-500/10" />

      {/* Degradado inferior sutil (para que no quede “blanco” abajo) */}
      <div className="absolute inset-x-0 bottom-0 h-[60svh] bg-gradient-to-t from-emerald-200/35 via-indigo-200/15 to-transparent dark:from-emerald-500/12 dark:via-indigo-500/8" />

      {/* Glows grandes (arriba y abajo) */}
      <div className="absolute -top-64 left-1/2 h-[70rem] w-[70rem] -translate-x-1/2 rounded-full bg-fuchsia-400/20 blur-[120px] dark:bg-fuchsia-500/15" />
      <div className="absolute -bottom-72 left-1/3 h-[60rem] w-[60rem] -translate-x-1/2 rounded-full bg-indigo-400/15 blur-[140px] dark:bg-indigo-500/12" />
      <div className="absolute -bottom-56 right-1/4 h-[55rem] w-[55rem] translate-x-1/2 rounded-full bg-emerald-400/15 blur-[140px] dark:bg-emerald-500/12" />

      {/* Textura sutil (opcional) */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "22px 22px",
          color: "black",
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
};

export default PageBackground;

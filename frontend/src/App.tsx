import React from "react";
import AppRouter from "./AppRouter";
import PageBackground from "@/components/PageBackground";

function App() {
  return (
    <div className="relative min-h-[100dvh] bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50 transition-colors">
      {/* Fondo animado global (no interfiere con el contenido) */}
      <PageBackground />

      {/* Contenido principal de la app */}
      <div className="relative z-10">
        <AppRouter />
      </div>
    </div>
  );
}

export default App;

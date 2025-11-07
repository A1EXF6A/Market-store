import React from "react";
import { Moon, Sun } from "lucide-react";

const ThemeToggle: React.FC = () => {
  const [dark, setDark] = React.useState(
    () => document.documentElement.classList.contains("dark")
  );

  const toggle = () => {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  React.useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition"
      aria-label="Cambiar tema"
    >
      {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      {dark ? "Oscuro" : "Claro"}
    </button>
  );
};

export default ThemeToggle;

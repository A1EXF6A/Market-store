// src/components/dashboard/ui.tsx
import React from "react";
import { motion, type Variants } from "framer-motion";

import { Badge } from "@components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/ui/card";

import { Shield, Sparkles } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

/* ========= Variants (tipados) ========= */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 * i,
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

/* ========= Tarjeta métrica reutilizable ========= */
export const StatCard: React.FC<{
  i?: number;
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  hint?: string;
  cta?: React.ReactNode;
  accent?: "indigo" | "emerald" | "amber" | "pink" | "red";
}> = ({ i = 0, icon, title, value, hint, cta, accent = "indigo" }) => {
  const ring =
    accent === "emerald"
      ? "ring-emerald-200/70"
      : accent === "amber"
      ? "ring-amber-200/70"
      : accent === "pink"
      ? "ring-pink-200/70"
      : accent === "red"
      ? "ring-red-200/70"
      : "ring-indigo-200/70";

  const iconBg =
    accent === "emerald"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
      : accent === "amber"
      ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
      : accent === "pink"
      ? "bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-300"
      : accent === "red"
      ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
      : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300";

  return (
    <motion.div custom={i} variants={fadeUp} initial="hidden" animate="visible">
      <Card className="hover:shadow-lg transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={`h-8 w-8 rounded-lg ${iconBg} grid place-items-center`}>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          {cta && <div className="mt-4">{cta}</div>}
        </CardContent>
        <div className={`mx-4 mb-4 rounded-xl ring-2 ${ring}`} />
      </Card>
    </motion.div>
  );
};

/* ========= Hero ========= */
export const Hero: React.FC<{
  name?: string;
  badge: React.ReactNode;
  verified?: boolean;
}> = ({ name, badge, verified }) => (
  <motion.div
    variants={fadeUp}
    initial="hidden"
    animate="visible"
    className="relative overflow-hidden rounded-2xl border shadow-lg"
  >
    <div className="bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-emerald-500 p-[1px]">
      <div className="relative rounded-2xl bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {badge}
              {verified ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-600">
                  <Shield className="h-3.5 w-3.5 mr-1" /> Verificada
                </Badge>
              ) : (
                <Badge variant="secondary">Cuenta no verificada</Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Bienvenido, {name ?? "usuario"}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Panel inteligente
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

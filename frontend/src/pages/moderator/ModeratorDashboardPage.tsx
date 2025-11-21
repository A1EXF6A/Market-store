import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { incidentsService } from "@/services/incidents";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@components/ui/card";

import {
  AlertTriangle,
  ClipboardCheck,
  Shield,
  Flag,
  Eye,
} from "lucide-react";

import PageBackground from "@/components/PageBackground";
import { fadeUp, StatCard, Hero } from "@/components/dashboard/ui";

const ModeratorDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    reviewing: 0,
    reports: 0,
    blocked: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const incidents = await incidentsService.getIncidents();
      const reports = await incidentsService.getReports();

      const pending = incidents.filter((i) => i.status === "pending").length;
      const reviewing = incidents.filter((i) => i.status === "reviewing").length;
      const blocked = incidents.filter((i) => i.item?.status === "banned").length;

      setStats({
        pending,
        reviewing,
        reports: reports.length,
        blocked,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh]">
      <PageBackground />

      <div className="relative z-10 space-y-6 pb-16">
        <Hero
          name="Moderador"
          verified={true}
          badge={
            <Badge className="bg-blue-600 hover:bg-blue-700 flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              Moderador
            </Badge>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            i={0}
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Incidencias Pendientes"
            value={loading ? "…" : stats.pending}
            accent="amber"
            cta={
              <Button asChild className="w-full">
                <Link to="/incidents">Revisar Incidencias</Link>
              </Button>
            }
          />

          <StatCard
            i={1}
            icon={<ClipboardCheck className="h-4 w-4" />}
            title="En Revisión"
            value={loading ? "…" : stats.reviewing}
            accent="pink"
          />

          <StatCard
            i={2}
            icon={<Flag className="h-4 w-4" />}
            title="Reportes de Compradores"
            value={loading ? "…" : stats.reports}
            accent="indigo"
            cta={
              <Button asChild variant="outline" className="w-full">
                <Link to="/reports">Ver Reportes</Link>
              </Button>
            }
          />

          <StatCard
            i={3}
            icon={<Eye className="h-4 w-4" />}
            title="Productos Bloqueados"
            value={loading ? "…" : stats.blocked}
            accent="red"
          />
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Centro de Moderación</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-gray-600">
                Accede a todas las herramientas de revisión y control de la plataforma.
              </p>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Link to="/incidents">Ir a Incidencias</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ModeratorDashboardPage;

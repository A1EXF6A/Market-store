import { ReportType } from "@/types";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { incidentsService } from "@services/incidents";
import { useState } from "react";
import { toast } from "sonner";

interface ReportProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
}

export function ReportProductModal({
  isOpen,
  onClose,
  productId,
  productName,
}: ReportProductModalProps) {
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportTypes = [
    { value: ReportType.SPAM, label: "Spam" },
    { value: ReportType.INAPPROPRIATE, label: "Contenido inapropiado" },
    { value: ReportType.ILLEGAL, label: "Contenido ilegal" },
    { value: ReportType.OTHER, label: "Otro" },
  ];

  const handleSubmit = async () => {
    if (!reportType) {
      toast.error("Selecciona un tipo de reporte");
      return;
    }

    setIsSubmitting(true);
    try {
      await incidentsService.createReport({
        itemId: productId,
        type: reportType as ReportType,
        comment: comment || undefined,
      });

      toast.success("Reporte enviado correctamente");
      handleClose();
    } catch (error: any) {
      toast.error("Error al enviar el reporte");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReportType("");
    setComment("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reportar Producto</DialogTitle>
          <DialogDescription>
            Reportar "{productName}" por violación de las políticas de la
            plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reportType">Tipo de reporte *</Label>
            <Select
              value={reportType}
              onValueChange={(value) => setReportType(value as ReportType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de reporte" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentario (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Describe la razón del reporte..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reportType}>
            {isSubmitting ? "Enviando..." : "Enviar Reporte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { incidentsService } from '../../services/incidents';
import type { Incident } from '../../types';

interface CreateAppealModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateAppealModal({ 
  incident, 
  isOpen, 
  onClose, 
  onSuccess 
}: CreateAppealModalProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!incident || !reason.trim()) {
      toast.error('Por favor ingresa el motivo de la apelación');
      return;
    }

    setIsLoading(true);
    
    try {
      await incidentsService.createAppeal({
        incidentId: incident.incidentId,
        reason: reason.trim(),
      });

      toast.success('Apelación enviada exitosamente');
      setReason('');
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar la apelación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setReason('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Apelación</DialogTitle>
          <DialogDescription>
            Solicita una revisión de la decisión tomada sobre tu producto "{incident?.item?.name}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo de la apelación</Label>
            <Textarea
              id="reason"
              placeholder="Explica por qué consideras que la decisión debe ser revisada..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
              disabled={isLoading}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Describe claramente por qué crees que tu producto no debería estar suspendido o baneado.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !reason.trim()}
            >
              {isLoading ? 'Enviando...' : 'Enviar Apelación'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
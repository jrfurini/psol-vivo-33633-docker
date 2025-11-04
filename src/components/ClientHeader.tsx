import { Building2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';

interface ClientHeaderProps {
  client: Client | null;
}

export function ClientHeader({ client }: ClientHeaderProps) {
  const navigate = useNavigate();

  if (!client) {
    return (
      <div className="h-16 border-b border-border bg-card flex items-center px-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Building2 className="h-5 w-5" />
          <span className="text-sm">Nenhum cliente selecionado</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold text-foreground">{client.razaoSocial}</h2>
          <p className="text-sm text-muted-foreground">CNPJ: {client.cnpj}</p>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Trocar cliente
      </Button>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, XCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

export default function Home() {
  const navigate = useNavigate();
  const { 
    clients, 
    selectedClient, 
    setSelectedClient, 
    quotes, 
    createQuote,
    cancelQuote,
    setSelectedQuote
  } = useApp();
  
  const [searchRazao, setSearchRazao] = useState('');
  const [searchCNPJ, setSearchCNPJ] = useState('');
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isNewQuoteDialogOpen, setIsNewQuoteDialogOpen] = useState(false);
  const [newQuoteData, setNewQuoteData] = useState({
    salesforce: '',
    nomeProjeto: '',
  });

  const filteredClients = clients.filter(client => {
    const matchRazao = !searchRazao || 
      client.razaoSocial.toLowerCase().includes(searchRazao.toLowerCase());
    const matchCNPJ = !searchCNPJ || 
      client.cnpj.includes(searchCNPJ.replace(/\D/g, ''));
    return matchRazao && matchCNPJ;
  });

  const clientQuotes = selectedClient 
    ? quotes.filter(q => q.clientId === selectedClient.id)
    : [];

  const handleSelectClient = (client: typeof clients[0]) => {
    setSelectedClient(client);
    setIsClientDialogOpen(false);
    toast.success(`Cliente ${client.razaoSocial} selecionado`);
  };

  const handleCreateQuote = () => {
    if (!selectedClient) return;
    
    const newQuote = {
      clientId: selectedClient.id,
      codigo: `2024${String(quotes.length + 1).padStart(4, '0')}`,
      salesforce: newQuoteData.salesforce,
      nomeProjeto: newQuoteData.nomeProjeto,
      valor: 0,
      status: 'Aberta' as const,
      dataAbertura: new Date().toLocaleDateString('pt-BR'),
      versao: '1.0',
    };

    createQuote(newQuote);
    setIsNewQuoteDialogOpen(false);
    setNewQuoteData({ salesforce: '', nomeProjeto: '' });
    toast.success('Cotação criada com sucesso');
    navigate('/controle');
  };

  const handleEditQuote = (quote: typeof quotes[0]) => {
    setSelectedQuote(quote);
    navigate('/controle');
  };

  const handleCancelQuote = (quoteId: string) => {
    cancelQuote(quoteId);
    toast.success('Cotação cancelada');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Aberta': 'default',
      'Emitida': 'secondary',
      'Cancelada': 'destructive',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Simulador de Preços</h1>
              <p className="text-sm text-muted-foreground">Gestão de cotações Vivo</p>
            </div>
            <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Building2 className="mr-2 h-4 w-4" />
                  {selectedClient ? 'Trocar Cliente' : 'Selecionar Cliente'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Selecionar Cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Razão Social</label>
                      <Input
                        placeholder="Buscar por razão social..."
                        value={searchRazao}
                        onChange={(e) => setSearchRazao(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">CNPJ</label>
                      <Input
                        placeholder="00.000.000/0000-00"
                        value={searchCNPJ}
                        onChange={(e) => setSearchCNPJ(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    {filteredClients.map(client => (
                      <div
                        key={client.id}
                        className="p-4 hover:bg-accent cursor-pointer border-b last:border-b-0 transition-colors"
                        onClick={() => handleSelectClient(client)}
                      >
                        <div className="font-medium">{client.razaoSocial}</div>
                        <div className="text-sm text-muted-foreground">CNPJ: {client.cnpj}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Client Info */}
      {selectedClient && (
        <div className="border-b border-border bg-accent/50">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <span className="font-semibold">{selectedClient.razaoSocial}</span>
                <span className="text-muted-foreground ml-3">CNPJ: {selectedClient.cnpj}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Cotações</h2>
            <Dialog open={isNewQuoteDialogOpen} onOpenChange={setIsNewQuoteDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!selectedClient}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Cotação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Cotação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Número Salesforce</label>
                    <Input
                      placeholder="SF-2024-XXX"
                      value={newQuoteData.salesforce}
                      onChange={(e) => setNewQuoteData(prev => ({ ...prev, salesforce: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nome do Projeto</label>
                    <Input
                      placeholder="Nome do projeto..."
                      value={newQuoteData.nomeProjeto}
                      onChange={(e) => setNewQuoteData(prev => ({ ...prev, nomeProjeto: e.target.value }))}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateQuote}
                    disabled={!newQuoteData.salesforce || !newQuoteData.nomeProjeto}
                  >
                    Criar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {clientQuotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {selectedClient 
                ? 'Nenhuma cotação encontrada para este cliente'
                : 'Selecione um cliente para ver as cotações'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cotação</TableHead>
                  <TableHead>Salesforce</TableHead>
                  <TableHead>Nome do Projeto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Abertura</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientQuotes.map(quote => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.codigo}</TableCell>
                    <TableCell>{quote.salesforce}</TableCell>
                    <TableCell>{quote.nomeProjeto}</TableCell>
                    <TableCell>{formatCurrency(quote.valor)}</TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell>{quote.dataAbertura}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditQuote(quote)}
                          disabled={quote.status === 'Cancelada'}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancelQuote(quote.id)}
                          disabled={quote.status === 'Cancelada'}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';
import type { RateioService } from '@/types';

const SGI_TIS_OPTIONS = ['COMP', 'MODI', 'MOIN', 'Outros', 'Nenhum'] as const;
const SERVICO_OPTIONS = [
  'Instalação',
  'Logística',
  'Logística para Transferência entre Filiais Transferência',
  'Armazenagem',
  'Gerente de Projetos',
  'Líder Técnico',
  'Reserva Técnica e Miscelâneas'
] as const;
const DESCRICAO_OPTIONS = [
  'Instalação',
  'Logística',
  'Logística para Transferência entre Filiais Transferência',
  'Armazenagem',
  'Gerente de Projetos Interno',
  'Líder Técnico Interno',
  'Despesas diversas'
] as const;
const FORNECEDOR_OPTIONS = ['11 Paths', '2S', '3Corp', '5Dimensão', '5WI', '9Net'] as const;

export default function Rateio() {
  const { selectedQuote, rateioServices, addRateioService, updateRateioService, removeRateioService, quoteConfigs } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<RateioService | null>(null);
  const [formData, setFormData] = useState<Partial<RateioService>>({
    mesInicioMinimo: 1,
    sgiTis: 'Nenhum',
    importado: false,
    moedaReferencia: 'BRL',
    prazoCusto: 'À Vista',
    mensalidades: 1,
    valorComImpostos: 0,
  });

  const services = selectedQuote ? (rateioServices[selectedQuote.id] || []) : [];
  const valorTotal = services.reduce((sum, service) => sum + service.valorComImpostos, 0);

  const handleOpenDialog = (service?: RateioService) => {
    if (service) {
      setEditingService(service);
      setFormData(service);
    } else {
      setEditingService(null);
      setFormData({
        mesInicioMinimo: 1,
        sgiTis: 'Nenhum',
        importado: false,
        moedaReferencia: 'BRL',
        prazoCusto: 'À Vista',
        mensalidades: 1,
        valorComImpostos: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedQuote) return;

    if (!formData.servico || !formData.descricaoServico || !formData.fornecedor) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    // Se moeda for US$, multiplicar pelo Dólar PTAX
    let valorFinal = formData.valorComImpostos || 0;
    if (formData.moedaReferencia === 'USD') {
      const config = quoteConfigs[selectedQuote.id];
      const dolarPtax = config?.dolarPtax || 5.50;
      valorFinal = valorFinal * dolarPtax;
    }

    const dataToSave = {
      ...formData,
      valorComImpostos: valorFinal,
    };

    if (editingService) {
      updateRateioService(selectedQuote.id, editingService.id, dataToSave);
      toast({ title: 'Serviço atualizado com sucesso' });
    } else {
      addRateioService(selectedQuote.id, {
        ...dataToSave,
        quoteId: selectedQuote.id,
      } as Omit<RateioService, 'id' | 'item'>);
      toast({ title: 'Serviço adicionado com sucesso' });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (serviceId: string) => {
    if (!selectedQuote) return;
    removeRateioService(selectedQuote.id, serviceId);
    toast({ title: 'Serviço removido com sucesso' });
  };

  if (!selectedQuote) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Selecione uma cotação para gerenciar o rateio
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rateio</h1>
          <p className="text-muted-foreground mt-1">
            Os valores cadastrados aparecem no fluxo de caixa como CAPEX
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card">
            <DialogHeader>
              <DialogTitle>{editingService ? 'Editar' : 'Adicionar'} Serviço de Rateio</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>Mês Início Mínimo *</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.mesInicioMinimo}
                  onChange={(e) => setFormData({ ...formData, mesInicioMinimo: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>SGI TIS *</Label>
                <Select
                  value={formData.sgiTis}
                  onValueChange={(value: any) => setFormData({ ...formData, sgiTis: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {SGI_TIS_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Serviço *</Label>
                <Select
                  value={formData.servico}
                  onValueChange={(value: any) => setFormData({ ...formData, servico: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {SERVICO_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Descrição do Serviço *</Label>
                <Select
                  value={formData.descricaoServico}
                  onValueChange={(value: any) => setFormData({ ...formData, descricaoServico: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione a descrição" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {DESCRICAO_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Importado? *</Label>
                <Select
                  value={formData.importado ? 'sim' : 'nao'}
                  onValueChange={(value) => setFormData({ ...formData, importado: value === 'sim' })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fornecedor *</Label>
                <Select
                  value={formData.fornecedor}
                  onValueChange={(value: any) => setFormData({ ...formData, fornecedor: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {FORNECEDOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor com Impostos *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valorComImpostos}
                  onChange={(e) => setFormData({ ...formData, valorComImpostos: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Moeda de Referência *</Label>
                <Select
                  value={formData.moedaReferencia}
                  onValueChange={(value: any) => setFormData({ ...formData, moedaReferencia: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="BRL">R$</SelectItem>
                    <SelectItem value="USD">US$</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prazo do Custo</Label>
                <Input
                  value={formData.prazoCusto}
                  onChange={(e) => setFormData({ ...formData, prazoCusto: e.target.value })}
                />
              </div>
              <div>
                <Label>Mensalidades</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.mensalidades}
                  onChange={(e) => setFormData({ ...formData, mensalidades: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingService ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Item</TableHead>
                <TableHead className="w-24">Mês Início</TableHead>
                <TableHead>SGI TIS</TableHead>
                <TableHead className="min-w-[200px]">Serviço</TableHead>
                <TableHead className="min-w-[200px]">Descrição</TableHead>
                <TableHead>Import.</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Valor c/ Imp.</TableHead>
                <TableHead>Moeda</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="text-right">Mensalid.</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground">
                    Nenhum serviço cadastrado. Clique em "Adicionar" para começar.
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.item}</TableCell>
                    <TableCell>{service.mesInicioMinimo}</TableCell>
                    <TableCell>{service.sgiTis}</TableCell>
                    <TableCell className="text-sm">{service.servico}</TableCell>
                    <TableCell className="text-sm">{service.descricaoServico}</TableCell>
                    <TableCell>{service.importado ? 'Sim' : 'Não'}</TableCell>
                    <TableCell>{service.fornecedor}</TableCell>
                    <TableCell className="text-right">{formatCurrency(service.valorComImpostos)}</TableCell>
                    <TableCell>{service.moedaReferencia === 'BRL' ? 'R$' : 'US$'}</TableCell>
                    <TableCell>{service.prazoCusto}</TableCell>
                    <TableCell className="text-right">{service.mensalidades}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Valor Total */}
      <div className="mt-6 flex justify-end">
        <div className="p-4 bg-accent rounded-lg min-w-[300px]">
          <div className="text-sm text-muted-foreground mb-1">Valor Total</div>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(valorTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}

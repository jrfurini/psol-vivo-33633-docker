import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/formatters';
import { fetchDolarPtax } from '@/lib/bcbApi';
import { generateProposalPDF } from '@/lib/pdfGenerator';
import { updateCashFlowWithCalculations } from '@/lib/excelGenerator';
import { toast } from 'sonner';
import { FileText, Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Controle() {
  const navigate = useNavigate();
  const { selectedQuote, selectedClient, quoteConfigs, updateQuoteConfig } = useApp();
  const [isUpdatingDolar, setIsUpdatingDolar] = useState(false);
  const [vpl, setVpl] = useState<number>(0);
  const [margemExcel, setMargemExcel] = useState<number | null>(null);
  const [margemPercentualExcel, setMargemPercentualExcel] = useState<number | null>(null);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);
  const [updatedWorkbook, setUpdatedWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [canDownloadExcel, setCanDownloadExcel] = useState(false);

  useEffect(() => {
    if (!selectedQuote) {
      toast.error('Selecione uma cotação primeiro');
      navigate('/');
    }
  }, [selectedQuote, navigate]);

  if (!selectedQuote || !selectedClient) {
    return null;
  }

  const today = new Date();
  const validadeProposta = new Date(today);
  validadeProposta.setDate(validadeProposta.getDate() + 7);
  const inicioReceita = new Date(today);
  inicioReceita.setDate(inicioReceita.getDate() + 30);

  const config = quoteConfigs[selectedQuote.id] || {
    quoteId: selectedQuote.id,
    tipoRevenda: 'Cliente' as const,
    clienteConsumidorFinal: false,
    prv: 30 as const,
    insumosDolar: false,
    clausulaReajustePtax: false,
    validadeProposta: validadeProposta.toLocaleDateString('pt-BR'),
    inicioReceita: inicioReceita.toLocaleDateString('pt-BR'),
    classificacaoCliente: 'Normal' as const,
    aplicarBenchmarking: false,
    beneficiarioReidi: false,
    dataPtax: today.toLocaleDateString('pt-BR'),
    dolarPtax: 5.50,
    contribuicaoIcmsVenda: false,
  };

  const handleConfigChange = (updates: Partial<typeof config>) => {
    updateQuoteConfig(selectedQuote.id, updates);
    toast.success('Configuração atualizada');
  };

  const handleUpdateDolarPtax = async () => {
    setIsUpdatingDolar(true);
    try {
      const novaCotacao = await fetchDolarPtax();
      const today = new Date();
      handleConfigChange({ 
        dolarPtax: novaCotacao,
        dataPtax: today.toLocaleDateString('pt-BR')
      });
      toast.success(`Cotação atualizada: ${formatCurrency(novaCotacao)}`);
    } catch (error) {
      toast.error('Erro ao atualizar cotação');
    } finally {
      setIsUpdatingDolar(false);
    }
  };

  // Cálculos financeiros locais (usados como fallback antes do Excel ser processado)
  const { quoteProducts, rateioServices, clientContacts, adminSettings } = useApp();
  const products = quoteProducts[selectedQuote.id] || [];
  const services = rateioServices[selectedQuote.id] || [];
  
  const receitaBruta = products.reduce((sum, p) => sum + (p.precoVenda * p.quantidade), 0);
  const impostos = receitaBruta * 0.18;
  const receitaLiquida = receitaBruta - impostos;
  const custoProduto = products.reduce((sum, p) => sum + (p.custoUnitario * p.quantidade), 0);
  const custoRateado = services.reduce((sum, s) => sum + s.valorComImpostos, 0);
  const margemCalculada = receitaLiquida - custoProduto - custoRateado;
  const margemPercentualCalculada = receitaBruta > 0 ? (margemCalculada / receitaBruta) * 100 : 0;

  // Usar valores do Excel se disponíveis, senão usar valores calculados localmente
  const margem = margemExcel !== null ? margemExcel : margemCalculada;
  const margemPercentual = margemPercentualExcel !== null ? margemPercentualExcel : margemPercentualCalculada;

  // Calcular alçada de aprovação
  const getAlcadaAprovacao = () => {
    const { preVendas, diretor, cdg } = adminSettings.alcadas;
    
    if (margemPercentual >= preVendas) {
      return 'Pré Vendas';
    } else if (margemPercentual >= diretor) {
      return 'Diretor';
    } else {
      return 'CDG';
    }
  };

  const alcadaAprovacao = getAlcadaAprovacao();

  const handleGeneratePDF = () => {
    if (products.length === 0) {
      toast.error('Adicione produtos antes de gerar a proposta');
      return;
    }
    const contacts = clientContacts[selectedQuote.id];
    generateProposalPDF(selectedQuote.codigo, selectedClient.razaoSocial, selectedClient.cnpj, products, contacts);
    toast.success('PDF gerado com sucesso');
  };

  const handleUpdateExcelCalculations = async () => {
    if (products.length === 0 && services.length === 0) {
      toast.error('Adicione produtos ou serviços antes de atualizar os cálculos');
      return;
    }

    // Verificar se há arquivo de fluxo de caixa carregado
    const cashFlowFile = adminSettings.cashFlowFile;
    if (!cashFlowFile?.fileData) {
      toast.error('Por favor, faça upload do arquivo de Fluxo de Caixa na página Administração primeiro');
      return;
    }

    setIsProcessingExcel(true);
    try {
      // Processar Excel e obter cálculos
      const result = await updateCashFlowWithCalculations(
        selectedQuote.codigo,
        products,
        services,
        config.prv,
        receitaBruta,
        custoProduto,
        custoRateado,
        impostos,
        cashFlowFile.fileData
      );

      // Atualizar VPL, Margem e Margem % com valores do Excel
      setVpl(result.vpl);
      setMargemExcel(result.margem);
      setMargemPercentualExcel(result.margemPercentual);
      
      // Armazenar workbook atualizado e habilitar download
      setUpdatedWorkbook(result.workbook);
      setCanDownloadExcel(true);
      
      toast.success(`Cálculos atualizados - VPL: ${formatCurrency(result.vpl)} | Margem: ${formatCurrency(result.margem)} | Margem %: ${result.margemPercentual.toFixed(2)}%`);
    } catch (error) {
      toast.error('Erro ao processar fluxo de caixa. Tente novamente.');
      console.error('Erro:', error);
    } finally {
      setIsProcessingExcel(false);
    }
  };

  const handleGenerateExcel = async () => {
    if (!updatedWorkbook || !canDownloadExcel) {
      toast.error('Clique em "Atualizar Cálculos Excel" primeiro');
      return;
    }

    try {
      const cashFlowFile = adminSettings.cashFlowFile;
      if (!cashFlowFile) {
        toast.error('Arquivo de fluxo de caixa não encontrado');
        return;
      }
      
      XLSX.writeFile(updatedWorkbook, `${cashFlowFile.name.replace('.xlsx', '')}-atualizado.xlsx`);
      toast.success('Fluxo de caixa baixado com sucesso');
    } catch (error) {
      toast.error('Erro ao fazer download. Tente novamente.');
      console.error('Erro:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Controle</h1>
        <p className="text-muted-foreground">Configuração da cotação</p>
      </div>

      {/* Informações Básicas */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Número Salesforce</Label>
            <Input value={selectedQuote.salesforce} disabled className="mt-2" />
          </div>
          <div>
            <Label>Nome do Projeto</Label>
            <Input value={selectedQuote.nomeProjeto} disabled className="mt-2" />
          </div>
        </div>
      </Card>

      {/* Configurações */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Configurações</h2>
        <div className="space-y-6">
          {/* Tipo de Revenda */}
          <div>
            <Label className="mb-3 block">Tipo de Revenda</Label>
            <RadioGroup 
              value={config.tipoRevenda}
              onValueChange={(value) => handleConfigChange({ tipoRevenda: value as 'Cliente' | 'Banco' })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Cliente" id="cliente" />
                <Label htmlFor="cliente" className="font-normal cursor-pointer">Cliente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Banco" id="banco" />
                <Label htmlFor="banco" className="font-normal cursor-pointer">Banco</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Cliente Consumidor Final */}
          <div>
            <Label className="mb-3 block">Cliente Consumidor Final</Label>
            <RadioGroup 
              value={config.clienteConsumidorFinal ? 'sim' : 'nao'}
              onValueChange={(value) => handleConfigChange({ clienteConsumidorFinal: value === 'sim' })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="sim" />
                <Label htmlFor="sim" className="font-normal cursor-pointer">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="nao" />
                <Label htmlFor="nao" className="font-normal cursor-pointer">Não</Label>
              </div>
            </RadioGroup>
          </div>

          {/* PRV */}
          <div>
            <Label className="mb-3 block">Prazo de Recebimento de Vendas (PRV - dias)</Label>
            <RadioGroup 
              value={String(config.prv)}
              onValueChange={(value) => handleConfigChange({ prv: Number(value) as 30 | 45 | 60 | 75 | 90 })}
              className="flex gap-4"
            >
              {[30, 45, 60, 75, 90].map(days => (
                <div key={days} className="flex items-center space-x-2">
                  <RadioGroupItem value={String(days)} id={`prv-${days}`} />
                  <Label htmlFor={`prv-${days}`} className="font-normal cursor-pointer">
                    {days}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Insumos em Dólar */}
          <div>
            <Label className="mb-3 block">Proposta tem insumos em dólar</Label>
            <RadioGroup 
              value={config.insumosDolar ? 'sim' : 'nao'}
              onValueChange={(value) => handleConfigChange({ insumosDolar: value === 'sim' })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="insumos-sim" />
                <Label htmlFor="insumos-sim" className="font-normal cursor-pointer">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="insumos-nao" />
                <Label htmlFor="insumos-nao" className="font-normal cursor-pointer">Não</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Cláusula Reajuste PTAX */}
          <div>
            <Label className="mb-3 block">Proposta com cláusula de reajuste pela PTAX</Label>
            <RadioGroup 
              value={config.clausulaReajustePtax ? 'sim' : 'nao'}
              onValueChange={(value) => handleConfigChange({ clausulaReajustePtax: value === 'sim' })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="clausula-sim" />
                <Label htmlFor="clausula-sim" className="font-normal cursor-pointer">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="clausula-nao" />
                <Label htmlFor="clausula-nao" className="font-normal cursor-pointer">Não</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Validade da Proposta */}
          <div>
            <Label>Validade da proposta</Label>
            <Input 
              type="text" 
              value={config.validadeProposta} 
              disabled 
              className="mt-2" 
            />
          </div>

          {/* Início da Receita */}
          <div>
            <Label>Início da receita</Label>
            <Input 
              type="text" 
              value={config.inicioReceita} 
              disabled 
              className="mt-2" 
            />
          </div>

          {/* Classificação do Cliente */}
          <div>
            <Label className="mb-3 block">Classificação do cliente</Label>
            <RadioGroup 
              value={config.classificacaoCliente}
              onValueChange={(value) => handleConfigChange({ classificacaoCliente: value as 'Normal' | 'Microempresa' })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Normal" id="class-normal" />
                <Label htmlFor="class-normal" className="font-normal cursor-pointer">Normal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Microempresa" id="class-micro" />
                <Label htmlFor="class-micro" className="font-normal cursor-pointer">Microempresa</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Aplicar Benchmarking */}
          <div>
            <Label className="mb-3 block">Aplicar benchmarking</Label>
            <RadioGroup 
              value={config.aplicarBenchmarking ? 'sim' : 'nao'}
              onValueChange={(value) => handleConfigChange({ aplicarBenchmarking: value === 'sim' })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="bench-sim" />
                <Label htmlFor="bench-sim" className="font-normal cursor-pointer">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="bench-nao" />
                <Label htmlFor="bench-nao" className="font-normal cursor-pointer">Não</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Mês do Início do Benchmarking */}
          {config.aplicarBenchmarking && (
            <div>
              <Label>Mês do início do benchmarking</Label>
              <Input 
                type="month"
                value={config.mesInicioBenchmarking || ''}
                onChange={(e) => handleConfigChange({ mesInicioBenchmarking: e.target.value })}
                className="mt-2" 
              />
            </div>
          )}

          {/* Cliente é beneficiário do REIDI */}
          <div>
            <Label className="mb-3 block">Cliente é beneficiário do REIDI</Label>
            <RadioGroup 
              value={config.beneficiarioReidi ? 'sim' : 'nao'}
              onValueChange={(value) => handleConfigChange({ beneficiarioReidi: value === 'sim' })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="reidi-sim" />
                <Label htmlFor="reidi-sim" className="font-normal cursor-pointer">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="reidi-nao" />
                <Label htmlFor="reidi-nao" className="font-normal cursor-pointer">Não</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Data da PTAX */}
          <div>
            <Label>Data da PTAX</Label>
            <Input 
              type="text" 
              value={config.dataPtax} 
              disabled 
              className="mt-2" 
            />
          </div>

          {/* Dólar PTAX */}
          <div>
            <Label>Dólar PTAX (proposta)</Label>
            <div className="flex gap-2 mt-2">
              <Input 
                type="text" 
                value={formatCurrency(config.dolarPtax)} 
                disabled 
                className="flex-1" 
              />
              <Button 
                onClick={handleUpdateDolarPtax} 
                disabled={isUpdatingDolar}
              >
                {isUpdatingDolar ? 'Atualizando...' : 'Atualizar cotação do dólar'}
              </Button>
            </div>
          </div>

          {/* Contribuição ICMS na Venda */}
          <div>
            <Label className="mb-3 block">Contr. ICMS na venda</Label>
            <RadioGroup 
              value={config.contribuicaoIcmsVenda ? 'sim' : 'nao'}
              onValueChange={(value) => handleConfigChange({ contribuicaoIcmsVenda: value === 'sim' })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="icms-sim" />
                <Label htmlFor="icms-sim" className="font-normal cursor-pointer">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="icms-nao" />
                <Label htmlFor="icms-nao" className="font-normal cursor-pointer">Não</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </Card>

      {/* Resumo Financeiro */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Resumo Financeiro</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 bg-accent rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Receita Bruta</div>
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(receitaBruta)}
            </div>
          </div>
          <div className="p-4 bg-accent rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Impostos</div>
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(impostos)}
            </div>
          </div>
          <div className="p-4 bg-accent rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Receita Líquida</div>
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(receitaLiquida)}
            </div>
          </div>
          <div className="p-4 bg-accent rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Custo de Produto</div>
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(custoProduto)}
            </div>
          </div>
          <div className="p-4 bg-accent rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Custo Rateado</div>
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(custoRateado)}
            </div>
          </div>
          <div className="p-4 bg-accent rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Margem</div>
            <div className="text-xl font-bold text-success">
              {formatCurrency(margem)}
            </div>
          </div>
          <div className="p-4 bg-accent rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Margem %</div>
            <div className="text-xl font-bold text-success">
              {margemPercentual.toFixed(2)}%
            </div>
          </div>
          <div className="p-4 bg-accent rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">VPL</div>
            <div className="text-xl font-bold text-primary">
              {formatCurrency(vpl)}
            </div>
          </div>
        </div>

        {/* Alçada de Aprovação */}
        <div className="mt-6">
          <Label className="text-base font-semibold">Alçada de Aprovação</Label>
          <div className="mt-2 p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
            <div className="text-2xl font-bold text-primary">
              {alcadaAprovacao}
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="mt-6 space-y-3">
          <div className="flex gap-4">
            <Button 
              onClick={handleUpdateExcelCalculations} 
              variant="default" 
              className="flex-1"
              disabled={isProcessingExcel}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isProcessingExcel ? 'animate-spin' : ''}`} />
              {isProcessingExcel ? 'Processando...' : 'Atualizar Cálculos Excel'}
            </Button>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleGeneratePDF} variant="outline" className="flex-1">
              <FileText className="mr-2 h-4 w-4" />
              Visualizar proposta
            </Button>
            <Button 
              onClick={handleGenerateExcel} 
              variant="outline" 
              className="flex-1"
              disabled={!canDownloadExcel}
            >
              <Download className="mr-2 h-4 w-4" />
              Visualizar fluxo de caixa
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

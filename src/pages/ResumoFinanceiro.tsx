import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/formatters';
import { generateProposalPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Download, FileText } from 'lucide-react';

// Tabela de coeficientes baseada no PRV
const COEFICIENTES: Record<number, number> = {
  30: 1.01417439548488,
  45: 1.02854970445713,
  60: 1.02854970445713,
  75: 1.043128775,
  90: 1.043128775,
};

export default function ResumoFinanceiro() {
  const navigate = useNavigate();
  const { selectedQuote, quoteProducts, rateioServices, quoteConfigs, adminSettings, clientContacts, clients } = useApp();

  const [receitaBruta, setReceitaBruta] = useState(0);
  const [impostos, setImpostos] = useState(0);
  const [receitaLiquida, setReceitaLiquida] = useState(0);
  const [custoProduto, setCustoProduto] = useState(0);
  const [rateio, setRateio] = useState(0);
  const [custoTotal, setCustoTotal] = useState(0);
  const [margemDireta, setMargemDireta] = useState(0);
  const [inadimplencia, setInadimplencia] = useState(0);
  const [ebitda, setEbitda] = useState(0);
  const [margemEbitda, setMargemEbitda] = useState(0);
  const [irCsll, setIrCsll] = useState(0);
  const [lucroLiquido, setLucroLiquido] = useState(0);
  const [margemLiquida, setMargemLiquida] = useState(0);
  const [vpl, setVpl] = useState(0);
  const [alcada, setAlcada] = useState('');

  useEffect(() => {
    if (!selectedQuote) {
      toast.error('Selecione uma cotação primeiro');
      navigate('/');
    }
  }, [selectedQuote, navigate]);

  useEffect(() => {
    if (!selectedQuote) return;

    const products = quoteProducts[selectedQuote.id] || [];
    const services = rateioServices[selectedQuote.id] || [];
    const config = quoteConfigs[selectedQuote.id];

    // Receita Bruta = valor total da Máscara do Fornecedor
    const receitaBrutaCalc = products.reduce((sum, p) => sum + (p.precoVenda * p.quantidade), 0);
    setReceitaBruta(receitaBrutaCalc);

    // Impostos = Receita Bruta × 0,25
    const impostosCalc = receitaBrutaCalc * 0.25;
    setImpostos(impostosCalc);

    // Receita Líquida = Receita Bruta - Impostos
    const receitaLiquidaCalc = receitaBrutaCalc - impostosCalc;
    setReceitaLiquida(receitaLiquidaCalc);

    // Custo do Produto = soma da coluna "custo" (custoUnitario * quantidade)
    const custoProdutoCalc = products.reduce((sum, p) => sum + (p.custoUnitario * p.quantidade), 0);
    setCustoProduto(custoProdutoCalc);

    // Rateio = valor total da página Rateio
    const rateioCalc = services.reduce((sum, s) => sum + s.valorComImpostos, 0);
    setRateio(rateioCalc);

    // Custo Total = Custo do Produto + Rateio
    const custoTotalCalc = custoProdutoCalc + rateioCalc;
    setCustoTotal(custoTotalCalc);

    // Margem Direta = Receita Líquida - Custo Total
    const margemDiretaCalc = receitaLiquidaCalc - custoTotalCalc;
    setMargemDireta(margemDiretaCalc);

    // Inadimplência = 0 (fixo)
    const inadimplenciaCalc = 0;
    setInadimplencia(inadimplenciaCalc);

    // EBITDA = Margem Direta - Inadimplência
    const ebitdaCalc = margemDiretaCalc - inadimplenciaCalc;
    setEbitda(ebitdaCalc);

    // Margem EBITDA = (EBITDA ÷ Receita Líquida) × 100
    const margemEbitdaCalc = receitaLiquidaCalc > 0 ? (ebitdaCalc / receitaLiquidaCalc) * 100 : 0;
    setMargemEbitda(margemEbitdaCalc);

    // IR/CSLL (34%) = Margem Direta × 0,34
    const irCsllCalc = margemDiretaCalc * 0.34;
    setIrCsll(irCsllCalc);

    // Lucro Líquido = Margem Direta - IR/CSLL (34%)
    const lucroLiquidoCalc = margemDiretaCalc - irCsllCalc;
    setLucroLiquido(lucroLiquidoCalc);

    // Margem Líquida = (Lucro Líquido ÷ Receita Líquida) × 100
    const margemLiquidaCalc = receitaLiquidaCalc > 0 ? (lucroLiquidoCalc / receitaLiquidaCalc) * 100 : 0;
    setMargemLiquida(margemLiquidaCalc);

    // VPL = Lucro Líquido ÷ Coeficiente
    const prv = config?.prv || 30;
    const coeficiente = COEFICIENTES[prv] || COEFICIENTES[30];
    const vplCalc = lucroLiquidoCalc / coeficiente;
    setVpl(vplCalc);

    // Alçada de aprovação baseada na margem líquida
    const alcadas = adminSettings.alcadas;
    let alcadaCalc = '';
    
    if (margemLiquidaCalc >= alcadas.preVendas) {
      alcadaCalc = 'Pré Vendas';
    } else if (margemLiquidaCalc >= alcadas.diretor) {
      alcadaCalc = 'Diretor';
    } else {
      alcadaCalc = 'CDG';
    }
    setAlcada(alcadaCalc);

  }, [selectedQuote, quoteProducts, rateioServices, quoteConfigs, adminSettings]);

  if (!selectedQuote) {
    return null;
  }

  const client = clients.find(c => c.id === selectedQuote.clientId);

  const handleDownloadExcel = async () => {
    try {
      // Carregar o template ou arquivo da administração
      let arrayBuffer: ArrayBuffer;
      if (adminSettings.cashFlowFile?.fileData) {
        arrayBuffer = adminSettings.cashFlowFile.fileData;
      } else {
        const response = await fetch('/Template_FluxoCaixa.xlsx');
        arrayBuffer = await response.arrayBuffer();
      }

      const wb = XLSX.read(arrayBuffer, { type: 'array' });

      // Atualizar células na aba "FC"
      if (wb.SheetNames.includes('FC')) {
        const wsFC = wb.Sheets['FC'];
        
        const config = quoteConfigs[selectedQuote.id];
        const prv = config?.prv || 30;

        const fcUpdates = {
          'B13': receitaBruta,
          'B14': prv,
          'B15': custoProduto,
          'B16': rateio,
          'B18': impostos,
        };

        Object.entries(fcUpdates).forEach(([cellRef, value]) => {
          if (!wsFC[cellRef]) {
            wsFC[cellRef] = { t: 'n', v: value };
          } else {
            wsFC[cellRef].v = value;
            wsFC[cellRef].t = 'n';
          }
        });
      }

      // Download
      XLSX.writeFile(wb, `Fluxo de caixa-${selectedQuote.codigo}.xlsx`);
      toast.success('Excel gerado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      toast.error('Erro ao gerar Excel');
    }
  };

  const handleViewProposal = () => {
    const products = quoteProducts[selectedQuote.id] || [];
    const contacts = clientContacts[selectedQuote.id];
    
    if (products.length === 0) {
      toast.error('Adicione produtos antes de gerar a proposta');
      return;
    }

    if (!client) {
      toast.error('Cliente não encontrado');
      return;
    }

    generateProposalPDF(
      selectedQuote.codigo,
      client.razaoSocial,
      client.cnpj,
      products,
      contacts
    );
    
    toast.success('Proposta gerada com sucesso');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resumo Financeiro</h1>
        <p className="text-muted-foreground">Visão consolidada dos cálculos financeiros</p>
      </div>

      {/* Campos Principais */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Valores Financeiros</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="receitaBruta">Receita Bruta</Label>
            <Input
              id="receitaBruta"
              type="text"
              value={formatCurrency(receitaBruta)}
              placeholder="R$ 0,00"
              className="mt-2 bg-muted"
              readOnly
            />
          </div>

          <div>
            <Label htmlFor="impostos">Impostos</Label>
            <Input
              id="impostos"
              type="text"
              value={formatCurrency(impostos)}
              placeholder="R$ 0,00"
              className="mt-2 bg-muted"
              readOnly
            />
          </div>

          <div>
            <Label htmlFor="receitaLiquida">Receita Líquida</Label>
            <Input
              id="receitaLiquida"
              type="text"
              value={formatCurrency(receitaLiquida)}
              placeholder="R$ 0,00"
              className="mt-2 bg-muted"
              readOnly
            />
          </div>

          <div>
            <Label htmlFor="custoProduto">Custo do Produto</Label>
            <Input
              id="custoProduto"
              type="text"
              value={formatCurrency(custoProduto)}
              placeholder="R$ 0,00"
              className="mt-2 bg-muted"
              readOnly
            />
          </div>

          <div>
            <Label htmlFor="rateio">Rateio</Label>
            <Input
              id="rateio"
              type="text"
              value={formatCurrency(rateio)}
              placeholder="R$ 0,00"
              className="mt-2 bg-muted"
              readOnly
            />
          </div>

          <div>
            <Label htmlFor="custoTotal">Custo Total</Label>
            <Input
              id="custoTotal"
              type="text"
              value={formatCurrency(custoTotal)}
              placeholder="R$ 0,00"
              className="mt-2 bg-muted"
              readOnly
            />
          </div>

          <div>
            <Label htmlFor="margemDireta">Margem Direta</Label>
            <Input
              id="margemDireta"
              type="text"
              value={formatCurrency(margemDireta)}
              placeholder="R$ 0,00"
              className="mt-2 bg-muted"
              readOnly
            />
          </div>

          <div>
            <Label htmlFor="inadimplencia">Inadimplência</Label>
            <Input
              id="inadimplencia"
              type="text"
              value={formatCurrency(inadimplencia)}
              placeholder="R$ 0,00"
              className="mt-2 bg-muted"
              readOnly
            />
          </div>

          <div>
            <Label htmlFor="ebitda">EBITDA</Label>
            <Input
              id="ebitda"
              type="text"
              value={formatCurrency(ebitda)}
              placeholder="R$ 0,00"
              className="mt-2 bg-muted"
              readOnly
            />
          </div>

          <div>
            <Label htmlFor="irCsll">IR/CSLL (34%)</Label>
            <Input
              id="irCsll"
              type="text"
              value={formatCurrency(irCsll)}
              placeholder="R$ 0,00"
              className="mt-2 bg-muted"
              readOnly
            />
          </div>
        </div>
      </Card>

      {/* Campos de Destaque */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 border-2 border-primary">
          <Label className="text-sm text-muted-foreground">Lucro Líquido</Label>
          <div className="mt-2 text-3xl font-bold text-primary">
            {formatCurrency(lucroLiquido)}
          </div>
        </Card>

        <Card className="p-6 border-2 border-primary">
          <Label className="text-sm text-muted-foreground">Margem Líquida</Label>
          <div className="mt-2 text-3xl font-bold text-primary">
            {margemLiquida.toFixed(1)}%
          </div>
        </Card>

        <Card className="p-6 border-2 border-primary">
          <Label className="text-sm text-muted-foreground">VPL</Label>
          <div className="mt-2 text-3xl font-bold text-primary">
            {formatCurrency(vpl)}
          </div>
        </Card>
      </div>

      {/* Alçada de Aprovação */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Alçada de Aprovação</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="alcada">Alçada de Aprovação</Label>
            <Input
              id="alcada"
              type="text"
              value={alcada}
              placeholder="Não definida"
              className="mt-2 bg-muted font-semibold"
              readOnly
            />
          </div>
        </div>
      </Card>

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <Button onClick={handleDownloadExcel} className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Baixar Fluxo de Caixa
        </Button>
        <Button onClick={handleViewProposal} className="flex-1">
          <FileText className="mr-2 h-4 w-4" />
          Visualizar Proposta
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

// Constantes fixas
const CUSTO_CAPITAL_REAL_MES = 0.014174395484882085;
const TAXA_INADIMPLENCIA = 0.1;
const ALIQUOTA_IR_CSLL = 0.34;

interface InputData {
  receitasBrutas: number;
  prv: number;
  custoProduto: number;
  rateio: number;
  imposto: number;
}

interface OutputData {
  vplAcumulado: number;
  margemLiquida: number;
  lucroLiquido: number;
}

interface PeriodoCalculo {
  receitaBruta: number;
  impostos: number;
  receitaLiquida: number;
  custo: number;
  margemDireta: number;
  ebitda: number;
  depreciacaoIR: number;
  lucroLiquido: number;
  fluxoCaixa: number;
  taxaAcumulada: number;
  vplMensal: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

const AnaliseFinanceira = () => {
  const navigate = useNavigate();
  const { selectedQuote, quoteProducts, rateioServices, quoteConfigs } = useApp();

  const [inputs, setInputs] = useState<InputData>({
    receitasBrutas: 0,
    prv: 0,
    custoProduto: 0,
    rateio: 0,
    imposto: 0,
  });

  const [outputs, setOutputs] = useState<OutputData>({
    vplAcumulado: 0,
    margemLiquida: 0,
    lucroLiquido: 0,
  });

  // Check if quote is selected
  useEffect(() => {
    if (!selectedQuote) {
      toast.error('Selecione uma cotação primeiro');
      navigate('/');
    }
  }, [selectedQuote, navigate]);

  // Auto-fill inputs when data changes
  useEffect(() => {
    if (!selectedQuote) return;

    const products = quoteProducts[selectedQuote.id] || [];
    const services = rateioServices[selectedQuote.id] || [];
    const config = quoteConfigs[selectedQuote.id];

    // Receita Bruta: total from Máscara do Fornecedor
    const receitaBruta = products.reduce((sum, p) => sum + (p.precoVenda * p.quantidade), 0);

    // PRV: from Controle config
    const prv = config?.prv || 0;

    // Custo do produto: sum of cost column from Máscara do Fornecedor
    const custoProduto = products.reduce((sum, p) => sum + (p.custoUnitario * p.quantidade), 0);

    // Rateio: total from Rateio page
    const rateio = services.reduce((sum, s) => sum + s.valorComImpostos, 0);

    // Imposto: 25% of Receita Bruta
    const imposto = receitaBruta * 0.25;

    setInputs({
      receitasBrutas: receitaBruta,
      prv: prv,
      custoProduto: custoProduto,
      rateio: rateio,
      imposto: imposto,
    });
  }, [selectedQuote, quoteProducts, rateioServices, quoteConfigs]);

  if (!selectedQuote) {
    return null;
  }

  const calcularFluxoCaixa = (inputs: InputData): OutputData => {
    console.log('Iniciando cálculo com inputs:', inputs);
    
    // Cálculos intermediários
    const custoTotal = inputs.custoProduto + inputs.rateio;
    const referenciaCusto = inputs.receitasBrutas > 0 
      ? custoTotal / inputs.receitasBrutas 
      : 0;
    const taxa = ALIQUOTA_IR_CSLL * referenciaCusto;

    console.log('Valores intermediários:', { custoTotal, referenciaCusto, taxa });

    // Array para armazenar cálculos de cada período (0 a 6)
    const periodos: PeriodoCalculo[] = [];

    for (let periodo = 0; periodo <= 6; periodo++) {
      // Receita bruta do período
      let receitaBrutaPeriodo = 0;
      if (inputs.prv >= periodo && inputs.prv < periodo + 1) {
        receitaBrutaPeriodo = inputs.receitasBrutas;
      }

      // Impostos
      const impostosPeriodo = receitaBrutaPeriodo > 0 ? -inputs.imposto : 0;

      // Receita líquida
      const receitaLiquida = receitaBrutaPeriodo + impostosPeriodo;

      // Custo
      const custo = -referenciaCusto * receitaBrutaPeriodo;

      // Margem Direta
      const margemDireta = receitaLiquida + custo;

      // Ebitda
      const ebitda = margemDireta * (1 - TAXA_INADIMPLENCIA);

      // Depreciação/IR
      const depreciacaoIR = -taxa * receitaLiquida;

      // Lucro Líquido
      const lucroLiquido = ebitda + depreciacaoIR;

      // Fluxo de Caixa
      const fluxoCaixa = lucroLiquido;

      // Taxa acumulada
      const taxaAcumulada = Math.pow(1 + CUSTO_CAPITAL_REAL_MES, periodo);

      // VPL Mensal
      const vplMensal = taxaAcumulada !== 0 ? fluxoCaixa / taxaAcumulada : 0;

      periodos.push({
        receitaBruta: receitaBrutaPeriodo,
        impostos: impostosPeriodo,
        receitaLiquida,
        custo,
        margemDireta,
        ebitda,
        depreciacaoIR,
        lucroLiquido,
        fluxoCaixa,
        taxaAcumulada,
        vplMensal,
      });
      
      console.log(`Período ${periodo}:`, {
        receitaBrutaPeriodo,
        impostosPeriodo,
        receitaLiquida,
        lucroLiquido,
        vplMensal
      });
    }

    console.log('Todos os períodos:', periodos);

    // Calcular outputs finais
    const vplAcumulado = periodos.reduce((sum, p) => sum + p.vplMensal, 0);
    const lucroLiquidoTotal = periodos.reduce((sum, p) => sum + p.lucroLiquido, 0);
    
    // Margem líquida = soma(lucro líquido / receita bruta) * 100
    const margemLiquida = periodos.reduce((sum, p) => {
      if (p.receitaBruta > 0) {
        return sum + (p.lucroLiquido / p.receitaBruta);
      }
      return sum;
    }, 0) * 100;

    return {
      vplAcumulado,
      margemLiquida,
      lucroLiquido: lucroLiquidoTotal,
    };
  };

  const handleCalcular = () => {
    console.log('Inputs recebidos:', inputs);
    const result = calcularFluxoCaixa(inputs);
    console.log('Resultados calculados:', result);
    setOutputs(result);
  };

  const handleInputChange = (field: keyof InputData, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue)) {
      setInputs(prev => ({
        ...prev,
        [field]: numValue,
      }));
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Análise Financeira</h1>
          <p className="text-muted-foreground">
            Calculadora de fluxo de caixa com análise de VPL e margem líquida
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados de Entrada</CardTitle>
            <CardDescription>
              Preencha os campos abaixo e clique em "Atualizar Cálculos"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receitasBrutas">Receita Bruta</Label>
                <Input
                  id="receitasBrutas"
                  type="text"
                  value={formatCurrency(inputs.receitasBrutas)}
                  placeholder="R$ 0,00"
                  className="bg-muted"
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prv">PRV</Label>
                <Input
                  id="prv"
                  type="number"
                  step="0.01"
                  value={inputs.prv || ''}
                  onChange={(e) => handleInputChange('prv', e.target.value)}
                  placeholder="0.00"
                  className="bg-muted"
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custoProduto">Custo do produto</Label>
                <Input
                  id="custoProduto"
                  type="text"
                  value={formatCurrency(inputs.custoProduto)}
                  placeholder="R$ 0,00"
                  className="bg-muted"
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateio">Rateio</Label>
                <Input
                  id="rateio"
                  type="text"
                  value={formatCurrency(inputs.rateio)}
                  placeholder="R$ 0,00"
                  className="bg-muted"
                  readOnly
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="imposto">Imposto</Label>
                <Input
                  id="imposto"
                  type="text"
                  value={formatCurrency(inputs.imposto)}
                  placeholder="R$ 0,00"
                  className="bg-muted"
                  readOnly
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={handleCalcular} size="lg">
                Atualizar Cálculos
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
            <CardDescription>
              Clique em "Atualizar Cálculos" para ver os resultados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                <Label className="text-sm text-muted-foreground">
                  VPL R$ - Acumulado em 60 Meses
                </Label>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(outputs.vplAcumulado)}
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                <Label className="text-sm text-muted-foreground">
                  Margem Líquida
                </Label>
                <p className="text-2xl font-bold text-primary">
                  {formatPercent(outputs.margemLiquida)}
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                <Label className="text-sm text-muted-foreground">
                  Lucro Líquido
                </Label>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(outputs.lucroLiquido)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnaliseFinanceira;

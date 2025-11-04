import { useState } from 'react';
import * as XLSX from 'xlsx';
import { HyperFormula } from 'hyperformula';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Calculator, FileSpreadsheet, Download } from 'lucide-react';

const ResumoFinanceiro = () => {
  // Estados para inputs
  const [receitaBruta, setReceitaBruta] = useState<number>(0);
  const [prv, setPrv] = useState<number>(0);
  const [custoProduto, setCustoProduto] = useState<number>(0);
  const [rateio, setRateio] = useState<number>(0);
  const [imposto, setImposto] = useState<number>(0);

  // Estados para resultados
  const [vpl, setVPL] = useState<string>('');
  const [margem, setMargem] = useState<string>('');
  const [margemPercent, setMargemPercent] = useState<string>('');

  // Estados para Excel
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const wb = XLSX.read(data, { type: 'binary', cellFormula: true });
        setWorkbook(wb);
        setFileName(file.name);
        
        // Limpar resultados ao carregar nova planilha
        setVPL('');
        setMargem('');
        setMargemPercent('');
        
        toast.success(`Planilha "${file.name}" carregada com sucesso!`);
      } catch (error) {
        console.error('Erro ao ler arquivo:', error);
        toast.error('Erro ao processar o arquivo Excel');
      }
    };

    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo');
    };

    reader.readAsBinaryString(file);
  };

  const calculateWithHyperFormula = (worksheet: XLSX.WorkSheet): { vpl: number; margem: number; margemPercent: number } => {
    try {
      // Converter worksheet para array 2D
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const data: any[][] = [];
      
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const row: any[] = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = worksheet[cellAddress];
          
          if (cell && cell.f) {
            // Adicionar fórmula com sinal de igual
            row.push('=' + cell.f);
          } else if (cell && cell.v !== undefined) {
            row.push(cell.v);
          } else {
            row.push(null);
          }
        }
        data.push(row);
      }

      // Criar instância do HyperFormula
      const hfInstance = HyperFormula.buildFromArray(data);

      // Ler valores calculados (B7 = linha 6, coluna 1)
      const vplValue = hfInstance.getCellValue({ sheet: 0, col: 1, row: 6 });
      const margemPercentValue = hfInstance.getCellValue({ sheet: 0, col: 1, row: 7 });
      const margemValue = hfInstance.getCellValue({ sheet: 0, col: 1, row: 18 });

      return {
        vpl: typeof vplValue === 'number' ? vplValue : 0,
        margem: typeof margemValue === 'number' ? margemValue : 0,
        margemPercent: typeof margemPercentValue === 'number' ? margemPercentValue : 0,
      };
    } catch (error) {
      console.error('Erro ao calcular com HyperFormula:', error);
      return { vpl: 0, margem: 0, margemPercent: 0 };
    }
  };

  const handleCalculate = () => {
    // Validações
    if (!workbook) {
      toast.error('Por favor, carregue uma planilha Excel primeiro.');
      return;
    }

    if (!receitaBruta || !prv || !custoProduto || !rateio || !imposto) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsCalculating(true);

    try {
      // Obter primeira aba
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Escrever valores nas células usando XLSX.utils.sheet_add_aoa
      XLSX.utils.sheet_add_aoa(worksheet, [[receitaBruta]], { origin: 'B13' });
      XLSX.utils.sheet_add_aoa(worksheet, [[prv]], { origin: 'B14' });
      XLSX.utils.sheet_add_aoa(worksheet, [[custoProduto]], { origin: 'B15' });
      XLSX.utils.sheet_add_aoa(worksheet, [[rateio]], { origin: 'B16' });
      XLSX.utils.sheet_add_aoa(worksheet, [[imposto]], { origin: 'B18' });

      // Calcular com HyperFormula
      const { vpl: vplValue, margem: margemValue, margemPercent: margemPercentValue } = 
        calculateWithHyperFormula(worksheet);

      // Formatar e exibir
      setVPL(
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vplValue)
      );
      setMargem(
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(margemValue)
      );
      setMargemPercent(
        new Intl.NumberFormat('pt-BR', {
          style: 'percent',
          minimumFractionDigits: 2,
        }).format(margemPercentValue / 100)
      );

      toast.success('Cálculo realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao calcular:', error);
      toast.error('Erro ao processar a planilha.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleInputChange = () => {
    // Limpar resultados ao alterar inputs
    setVPL('');
    setMargem('');
    setMargemPercent('');
  };

  const handleDownloadExcel = () => {
    if (!workbook) {
      toast.error('Nenhuma planilha disponível para download');
      return;
    }

    try {
      // Gerar arquivo Excel
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
      
      // Converter para Blob
      const buf = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < wbout.length; i++) {
        view[i] = wbout.charCodeAt(i) & 0xff;
      }
      const blob = new Blob([buf], { type: 'application/octet-stream' });

      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resumo_financeiro_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      
      // Limpar URL
      window.URL.revokeObjectURL(url);
      
      toast.success('Arquivo Excel baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast.error('Erro ao baixar o arquivo Excel');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Resumo Financeiro</h1>
          <p className="text-muted-foreground">
            Carregue uma planilha Excel e calcule VPL, Margem e Margem %
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card de Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Planilha
            </CardTitle>
            <CardDescription>
              Carregue um arquivo Excel (.xlsx ou .xls) para realizar os cálculos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar um arquivo Excel
                  </p>
                </div>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            {fileName && (
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm font-medium">Arquivo carregado:</p>
                <p className="text-sm text-muted-foreground truncate">{fileName}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Dados de Entrada</CardTitle>
            <CardDescription>Preencha os valores para cálculo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receita-bruta">Receita Bruta-teste</Label>
              <Input
                id="receita-bruta"
                type="number"
                value={receitaBruta || ''}
                onChange={(e) => {
                  setReceitaBruta(parseFloat(e.target.value) || 0);
                  handleInputChange();
                }}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prv">PRV-teste</Label>
              <Input
                id="prv"
                type="number"
                value={prv || ''}
                onChange={(e) => {
                  setPrv(parseFloat(e.target.value) || 0);
                  handleInputChange();
                }}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custo-produto">Custo do produto-teste</Label>
              <Input
                id="custo-produto"
                type="number"
                value={custoProduto || ''}
                onChange={(e) => {
                  setCustoProduto(parseFloat(e.target.value) || 0);
                  handleInputChange();
                }}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rateio">Rateio-teste</Label>
              <Input
                id="rateio"
                type="number"
                value={rateio || ''}
                onChange={(e) => {
                  setRateio(parseFloat(e.target.value) || 0);
                  handleInputChange();
                }}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imposto">Imposto-teste</Label>
              <Input
                id="imposto"
                type="number"
                value={imposto || ''}
                onChange={(e) => {
                  setImposto(parseFloat(e.target.value) || 0);
                  handleInputChange();
                }}
                placeholder="R$ 0,00"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Resultados
          </CardTitle>
          <CardDescription>Valores calculados após processamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="vpl">VPL-teste</Label>
              <Input id="vpl" value={vpl} readOnly className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="margem">Margem-teste</Label>
              <Input id="margem" value={margem} readOnly className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="margem-percent">Margem %-teste</Label>
              <Input id="margem-percent" value={margemPercent} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Button
              onClick={handleCalculate}
              disabled={isCalculating || !workbook}
              className="w-full"
              size="lg"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {isCalculating ? 'Calculando...' : 'Calcular'}
            </Button>

            <Button
              onClick={handleDownloadExcel}
              disabled={!workbook || !vpl}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Excel Atualizado
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumoFinanceiro;

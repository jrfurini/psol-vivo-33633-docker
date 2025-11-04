import { useState, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle, Download } from 'lucide-react';

export default function Administracao() {
  const { adminSettings, updateAdminSettings } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cashFlowFileInputRef = useRef<HTMLInputElement>(null);
  
  const [alcadas, setAlcadas] = useState({
    preVendas: adminSettings.alcadas.preVendas,
    diretor: adminSettings.alcadas.diretor,
    cdg: adminSettings.alcadas.cdg,
  });

  const handleAlcadasSave = () => {
    updateAdminSettings({ alcadas });
    toast({ 
      title: 'Alçadas atualizadas com sucesso',
      description: 'As mudanças afetarão todas as cotações do sistema'
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, envie um arquivo Excel (.xlsx ou .xls)',
        variant: 'destructive',
      });
      return;
    }

    const today = new Date().toLocaleDateString('pt-BR');
    updateAdminSettings({
      lpuFile: {
        name: file.name,
        uploadDate: today,
      },
    });

    toast({ 
      title: 'LPU enviada com sucesso',
      description: `Arquivo "${file.name}" foi carregado`
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    toast({ 
      title: 'Download iniciado',
      description: 'O template da LPU será baixado em instantes'
    });
  };

  const handleCashFlowFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, envie um arquivo Excel (.xlsx ou .xls)',
        variant: 'destructive',
      });
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const today = new Date().toLocaleDateString('pt-BR');
      
      updateAdminSettings({
        cashFlowFile: {
          name: file.name,
          uploadDate: today,
          fileData: arrayBuffer,
        },
      });

      toast({ 
        title: 'Fluxo de Caixa enviado com sucesso',
        description: `Arquivo "${file.name}" será usado em todas as novas cotações e cotações abertas`
      });

      if (cashFlowFileInputRef.current) {
        cashFlowFileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar arquivo',
        description: 'Não foi possível processar o arquivo Excel',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Administração</h1>
        <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 dark:text-amber-100">
            <strong>Atenção:</strong> As alterações nesta tela impactam TODAS as cotações geradas pelo sistema, de qualquer cliente.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>LPU (Lista de Preços Unitários)</CardTitle>
            <CardDescription>
              Envie o arquivo com a lista de preços atualizada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminSettings.lpuFile && (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{adminSettings.lpuFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Enviado em: {adminSettings.lpuFile.uploadDate}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                {adminSettings.lpuFile ? 'Substituir LPU' : 'Enviar LPU'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <Button
              variant="link"
              onClick={handleDownloadTemplate}
              asChild
              className="w-full text-primary"
            >
              <a href="/Template_LPU.xlsx" download="Template_LPU.xlsx">
                Baixar template do arquivo que deve ser usado no upload da LPU
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ALÇADAS (Margem Mínima)</CardTitle>
            <CardDescription>
              Defina as margens mínimas para cada nível de aprovação. Estes valores determinarão automaticamente a alçada exibida na tela Controle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="alcada-pv">Pré Vendas (%)</Label>
                <Input
                  id="alcada-pv"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={alcadas.preVendas}
                  onChange={(e) => setAlcadas({ ...alcadas, preVendas: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="alcada-diretor">Diretor (%)</Label>
                <Input
                  id="alcada-diretor"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={alcadas.diretor}
                  onChange={(e) => setAlcadas({ ...alcadas, diretor: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="alcada-cdg">CDG (%)</Label>
                <Input
                  id="alcada-cdg"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={alcadas.cdg}
                  onChange={(e) => setAlcadas({ ...alcadas, cdg: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-md border">
              <h4 className="font-medium mb-2">Como funciona:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Margem ≥ {alcadas.preVendas.toFixed(2)}% → Alçada: Pré Vendas</li>
                <li>• Margem entre {alcadas.diretor.toFixed(2)}% e {alcadas.preVendas.toFixed(2)}% → Alçada: Diretor</li>
                <li>• Margem &lt; {alcadas.diretor.toFixed(2)}% → Alçada: CDG</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleAlcadasSave}>
                Salvar Alçadas
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>
              Template usado para gerar o fluxo de caixa de todas as cotações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminSettings.cashFlowFile && (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{adminSettings.cashFlowFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Enviado em: {adminSettings.cashFlowFile.uploadDate}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => cashFlowFileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                {adminSettings.cashFlowFile ? 'Substituir Fluxo de Caixa' : 'Subir Fluxo de Caixa'}
              </Button>
              <input
                ref={cashFlowFileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleCashFlowFileUpload}
                className="hidden"
              />
            </div>

            <Button
              variant="link"
              asChild
              className="w-full text-primary"
            >
              <a href="/Template_FluxoCaixa.xlsx" download="Template_FluxoCaixa.xlsx">
                <Download className="mr-2 h-4 w-4" />
                Baixar template do arquivo que deve ser usado no upload do Fluxo de Caixa
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

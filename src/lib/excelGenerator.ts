import * as XLSX from 'xlsx';
import { HyperFormula } from 'hyperformula';
import { QuoteProduct, RateioService } from '@/types';

// Função auxiliar para converter coluna Excel (ex: 'DZ') para índice numérico
function columnToIndex(col: string): number {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return index - 1; // Zero-based index
}

// Função auxiliar para obter referência de célula (ex: 'DZ20')
function getCellRef(col: string, row: number): string {
  return `${col}${row}`;
}

export const generateCashFlowExcel = (
  products: QuoteProduct[],
  rateioServices: RateioService[]
) => {
  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Planilha 1 - Produtos
  const productsData = products.map(product => ({
    'Fabricante': product.fabricante,
    'Part Number': product.partNumber,
    'Descrição': product.descricao,
    'ID Família/Range': product.idFamiliaRange,
    'Categoria': product.categoria,
    'Variação Cambial': product.variacaoCambial ? 'Sim' : 'Não',
    'Custo Unitário': product.custoUnitario,
    'Valor Unit. Venda': product.precoVenda,
    'Quantidade': product.quantidade,
    'Custo Total': product.custoUnitario * product.quantidade,
    'Valor de Venda': product.precoVenda * product.quantidade,
  }));

  const ws1 = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Produtos');

  // Planilha 2 - Rateio
  const rateioData = rateioServices.map(service => ({
    'Item': service.item,
    'Mês Início Mínimo': service.mesInicioMinimo,
    'SGI TIS': service.sgiTis,
    'Serviço': service.servico,
    'Descrição do Serviço': service.descricaoServico,
    'Importado': service.importado ? 'Sim' : 'Não',
    'Fornecedor': service.fornecedor,
    'Valor com Impostos': service.valorComImpostos,
    'Moeda de Referência': service.moedaReferencia,
    'Prazo do Custo': service.prazoCusto,
    'Mensalidades': service.mensalidades,
  }));

  const ws2 = XLSX.utils.json_to_sheet(rateioData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Rateio');

  // Download
  XLSX.writeFile(wb, 'fluxo-de-caixa.xlsx');
};

export const generateBulkProductTemplate = () => {
  const template = [
    {
      'Fabricante': '',
      'Part Number': '',
      'Descrição': '',
      'ID Família/Range': '',
      'Categoria': '',
      'Variação Cambial': '',
      'Custo Unitário': '',
      'Valor Unit. Venda': '',
      'Quantidade': '',
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(template);
  XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
  XLSX.writeFile(wb, 'template-produtos-massa.xlsx');
};

export const parseBulkProductFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsBinaryString(file);
  });
};

// Nova função para processar Excel bidirecional com cálculos
export const updateCashFlowWithCalculations = async (
  quoteNumber: string,
  products: QuoteProduct[],
  rateioServices: RateioService[],
  prv: number,
  receitaBruta: number,
  custoProduto: number,
  custoRateado: number,
  impostos: number,
  uploadedFileData?: ArrayBuffer
): Promise<{ vpl: number; margem: number; margemPercentual: number; workbook: XLSX.WorkBook }> => {
  try {
    console.log('Atualizando fluxo de caixa com cálculos:', { 
      quoteNumber, 
      productsCount: products.length, 
      servicesCount: rateioServices.length, 
      prv,
      receitaBruta,
      custoProduto,
      custoRateado,
      impostos,
      hasUploadedFile: !!uploadedFileData
    });
    
    // Usar arquivo enviado ou carregar o template
    let arrayBuffer: ArrayBuffer;
    if (uploadedFileData) {
      arrayBuffer = uploadedFileData;
      console.log('Usando arquivo carregado da Administração');
    } else {
      const response = await fetch('/Template_FluxoCaixa.xlsx');
      arrayBuffer = await response.arrayBuffer();
      console.log('Usando template padrão');
    }
    
    const wb = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true, cellFormula: true });

    // Preencher aba "produtos" preservando formatação do template
    if (wb.SheetNames.includes('produtos')) {
      const wsProducts = wb.Sheets['produtos'];
      console.log('Preenchendo produtos:', products.length);
      
      // Adicionar produtos a partir da linha 2 (preservando cabeçalho na linha 1)
      products.forEach((product, index) => {
        const row = index + 2;
        
        // Mapear cada campo para sua coluna correspondente
        const productData = {
          'A': product.fabricante,
          'B': product.partNumber,
          'C': product.descricao,
          'D': product.idFamiliaRange,
          'E': product.categoria,
          'F': product.variacaoCambial ? 'Sim' : 'Não',
          'G': product.custoUnitario,
          'H': product.precoVenda,
          'I': product.quantidade,
          'J': product.custoUnitario * product.quantidade,
          'K': product.precoVenda * product.quantidade,
        };

        // Inserir cada valor na célula correspondente
        Object.entries(productData).forEach(([col, value]) => {
          const cellRef = `${col}${row}`;
          if (!wsProducts[cellRef]) {
            wsProducts[cellRef] = {};
          }
          wsProducts[cellRef].v = value;
          wsProducts[cellRef].t = typeof value === 'number' ? 'n' : 's';
        });
      });

      // Atualizar o range da planilha para incluir todos os produtos
      if (products.length > 0) {
        const lastRow = products.length + 1;
        wsProducts['!ref'] = `A1:K${lastRow}`;
        console.log('Range produtos atualizado:', wsProducts['!ref']);
      }
    }

    // Preencher aba "rateio" preservando formatação do template
    if (wb.SheetNames.includes('rateio')) {
      const wsRateio = wb.Sheets['rateio'];
      console.log('Preenchendo rateio:', rateioServices.length);
      
      // Adicionar itens de rateio a partir da linha 2 (preservando cabeçalho na linha 1)
      rateioServices.forEach((service, index) => {
        const row = index + 2;
        
        const rateioData = {
          'A': service.item,
          'B': service.mesInicioMinimo,
          'C': service.sgiTis,
          'D': service.servico,
          'E': service.descricaoServico,
          'F': service.importado ? 'Sim' : 'Não',
          'G': service.fornecedor,
          'H': service.valorComImpostos,
          'I': service.moedaReferencia,
          'J': service.prazoCusto,
          'K': service.mensalidades,
        };

        Object.entries(rateioData).forEach(([col, value]) => {
          const cellRef = `${col}${row}`;
          if (!wsRateio[cellRef]) {
            wsRateio[cellRef] = {};
          }
          wsRateio[cellRef].v = value;
          wsRateio[cellRef].t = typeof value === 'number' ? 'n' : 's';
        });
      });

      // Atualizar o range da planilha para incluir todos os serviços
      if (rateioServices.length > 0) {
        const lastRow = rateioServices.length + 1;
        wsRateio['!ref'] = `A1:K${lastRow}`;
        console.log('Range rateio atualizado:', wsRateio['!ref']);
      }
    }

    // Atualizar células da aba "FC" com valores calculados
    if (wb.SheetNames.includes('FC')) {
      const wsFC = wb.Sheets['FC'];
      
      // Mapear os valores para as células especificadas
      const fcUpdates = {
        'B13': receitaBruta,        // Receita Bruta
        'B14': prv,                  // PRV
        'B15': custoProduto,         // Custo de Produto
        'B16': custoRateado,         // Custo Rateado
        'B18': impostos,             // Impostos
        'DZ20': prv                  // PRV (célula adicional)
      };

      // Atualizar cada célula
      Object.entries(fcUpdates).forEach(([cellRef, value]) => {
        if (!wsFC[cellRef]) {
          wsFC[cellRef] = { t: 'n', v: value };
        } else {
          wsFC[cellRef].v = value;
          wsFC[cellRef].t = 'n';
        }
      });

      // Usar HyperFormula para calcular as fórmulas
      console.log('Iniciando cálculo de fórmulas com HyperFormula...');
      
      try {
        // Configurar HyperFormula
        const hfOptions = {
          licenseKey: 'gpl-v3',
          useArrayArithmetic: true,
          useColumnIndex: true,
        };
        
        const hf = HyperFormula.buildFromSheets(
          { 'FC': XLSX.utils.sheet_to_json(wsFC, { header: 1, raw: false, defval: null }) },
          hfOptions
        );
        
        // Obter valores calculados das células
        // B7 = VPL (linha 6, coluna 1 - zero-based)
        // B8 = Margem % (linha 7, coluna 1)
        // B19 = Margem (linha 18, coluna 1)
        const vplValue = hf.getCellValue({ sheet: 0, col: 1, row: 6 });
        const margemPercentualValue = hf.getCellValue({ sheet: 0, col: 1, row: 7 });
        const margemValue = hf.getCellValue({ sheet: 0, col: 1, row: 18 });
        
        // Converter para números, tratando possíveis erros
        const vpl = typeof vplValue === 'number' ? vplValue : 0;
        const margemPercentual = typeof margemPercentualValue === 'number' ? margemPercentualValue * 100 : 0;
        const margem = typeof margemValue === 'number' ? margemValue : 0;
        
        console.log('Valores calculados pelo HyperFormula:', {
          vpl: `B7 = ${vpl}`,
          margemPercentual: `B8 = ${margemPercentual}%`,
          margem: `B19 = ${margem}`
        });
        
        // Retornar workbook e valores calculados
        return {
          vpl,
          margem,
          margemPercentual,
          workbook: wb
        };
      } catch (hfError) {
        console.error('Erro ao calcular fórmulas com HyperFormula:', hfError);
        
        // Fallback: tentar ler valores diretos das células
        const vplCell = wsFC['B7'];
        const margemPercentualCell = wsFC['B8'];
        const margemCell = wsFC['B19'];
        
        const vpl = vplCell?.v !== undefined ? Number(vplCell.v) : 0;
        const margemPercentual = margemPercentualCell?.v !== undefined ? Number(margemPercentualCell.v) * 100 : 0;
        const margem = margemCell?.v !== undefined ? Number(margemCell.v) : 0;
        
        console.log('Valores lidos diretamente (fallback):', {
          vpl: `B7 = ${vpl}`,
          margemPercentual: `B8 = ${margemPercentual}%`,
          margem: `B19 = ${margem}`
        });

        // Retornar workbook e valores calculados (fallback)
        return {
          vpl,
          margem,
          margemPercentual,
          workbook: wb
        };
      }
    }

    throw new Error('Planilha FC não encontrada no template');
  } catch (error) {
    console.error('Erro ao atualizar fluxo de caixa:', error);
    throw error;
  }
};

export const generateCashFlowWithTemplate = async (
  quoteNumber: string,
  products: QuoteProduct[],
  rateioServices: RateioService[],
  prv: number
) => {
  try {
    console.log('Gerando fluxo de caixa completo:', { quoteNumber, productsCount: products.length, servicesCount: rateioServices.length, prv });
    
    // Carregar o template
    const response = await fetch('/Template_FluxoCaixa.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true });

    // Preencher aba "produtos" preservando formatação do template
    if (wb.SheetNames.includes('produtos')) {
      const wsProducts = wb.Sheets['produtos'];
      console.log('Preenchendo produtos:', products.length);
      
      // Adicionar produtos a partir da linha 2 (preservando cabeçalho na linha 1)
      products.forEach((product, index) => {
        const row = index + 2;
        
        // Mapear cada campo para sua coluna correspondente
        const productData = {
          'A': product.fabricante,
          'B': product.partNumber,
          'C': product.descricao,
          'D': product.idFamiliaRange,
          'E': product.categoria,
          'F': product.variacaoCambial ? 'Sim' : 'Não',
          'G': product.custoUnitario,
          'H': product.precoVenda,
          'I': product.quantidade,
          'J': product.custoUnitario * product.quantidade,
          'K': product.precoVenda * product.quantidade,
        };

        // Inserir cada valor na célula correspondente
        Object.entries(productData).forEach(([col, value]) => {
          const cellRef = `${col}${row}`;
          if (!wsProducts[cellRef]) {
            wsProducts[cellRef] = {};
          }
          wsProducts[cellRef].v = value;
          wsProducts[cellRef].t = typeof value === 'number' ? 'n' : 's';
        });
      });

      // Atualizar o range da planilha para incluir todos os produtos
      if (products.length > 0) {
        const lastRow = products.length + 1;
        wsProducts['!ref'] = `A1:K${lastRow}`;
        console.log('Range produtos atualizado:', wsProducts['!ref']);
      }
    }

    // Preencher aba "rateio" preservando formatação do template
    if (wb.SheetNames.includes('rateio')) {
      const wsRateio = wb.Sheets['rateio'];
      console.log('Preenchendo rateio:', rateioServices.length);
      
      // Adicionar itens de rateio a partir da linha 2 (preservando cabeçalho na linha 1)
      rateioServices.forEach((service, index) => {
        const row = index + 2;
        
        const rateioData = {
          'A': service.item,
          'B': service.mesInicioMinimo,
          'C': service.sgiTis,
          'D': service.servico,
          'E': service.descricaoServico,
          'F': service.importado ? 'Sim' : 'Não',
          'G': service.fornecedor,
          'H': service.valorComImpostos,
          'I': service.moedaReferencia,
          'J': service.prazoCusto,
          'K': service.mensalidades,
        };

        Object.entries(rateioData).forEach(([col, value]) => {
          const cellRef = `${col}${row}`;
          if (!wsRateio[cellRef]) {
            wsRateio[cellRef] = {};
          }
          wsRateio[cellRef].v = value;
          wsRateio[cellRef].t = typeof value === 'number' ? 'n' : 's';
        });
      });

      // Atualizar o range da planilha para incluir todos os serviços
      if (rateioServices.length > 0) {
        const lastRow = rateioServices.length + 1;
        wsRateio['!ref'] = `A1:K${lastRow}`;
        console.log('Range rateio atualizado:', wsRateio['!ref']);
      }
    }

    // Atualizar célula DZ20 da aba "FC" com o valor do PRV
    if (wb.SheetNames.includes('FC')) {
      const wsFC = wb.Sheets['FC'];
      const cellRef = getCellRef('DZ', 20);
      
      // Criar célula se não existir
      if (!wsFC[cellRef]) {
        wsFC[cellRef] = { t: 'n', v: prv };
      } else {
        wsFC[cellRef].v = prv;
        wsFC[cellRef].t = 'n';
      }
    }

    // Download do arquivo
    XLSX.writeFile(wb, `fluxo-de-caixa-${quoteNumber}.xlsx`);
  } catch (error) {
    console.error('Erro ao gerar fluxo de caixa:', error);
    throw error;
  }
};

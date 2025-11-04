import { Client, Quote, Product, AdminSettings } from '@/types';

export const mockClients: Client[] = [
  {
    id: '1',
    razaoSocial: 'Tech Solutions Ltda',
    cnpj: '12.345.678/0001-90',
    telefone: '(11) 98765-4321',
    email: 'contato@techsolutions.com.br'
  },
  {
    id: '2',
    razaoSocial: 'Conecta Telecom S.A.',
    cnpj: '23.456.789/0001-12',
    telefone: '(21) 97654-3210',
    email: 'vendas@conecta.com.br'
  },
  {
    id: '3',
    razaoSocial: 'Mega Networks Corp',
    cnpj: '34.567.890/0001-34',
    telefone: '(11) 96543-2109',
    email: 'comercial@meganetworks.com.br'
  },
  {
    id: '4',
    razaoSocial: 'Digital Voice Comunicações',
    cnpj: '45.678.901/0001-56',
    telefone: '(47) 95432-1098',
    email: 'suporte@digitalvoice.com.br'
  }
];

export const mockQuotes: Quote[] = [
  {
    id: '1',
    clientId: '1',
    codigo: '20240001',
    salesforce: 'SF-2024-001',
    nomeProjeto: 'Expansão rede corporativa',
    valor: 450000.00,
    status: 'Aberta',
    dataAbertura: '15/01/2024',
    versao: '1.0'
  },
  {
    id: '2',
    clientId: '1',
    codigo: '20240002',
    salesforce: 'SF-2024-002',
    nomeProjeto: 'Upgrade infraestrutura TI',
    valor: 780000.00,
    status: 'Emitida',
    dataAbertura: '22/01/2024',
    versao: '2.1'
  },
  {
    id: '3',
    clientId: '2',
    codigo: '20240003',
    salesforce: 'SF-2024-003',
    nomeProjeto: 'Sistema telefonia IP',
    valor: 320000.00,
    status: 'Aberta',
    dataAbertura: '05/02/2024',
    versao: '1.0'
  },
  {
    id: '4',
    clientId: '2',
    codigo: '20240004',
    salesforce: 'SF-2024-004',
    nomeProjeto: 'Modernização data center',
    valor: 1200000.00,
    status: 'Aberta',
    dataAbertura: '18/02/2024',
    versao: '1.5'
  },
  {
    id: '5',
    clientId: '3',
    codigo: '20240005',
    salesforce: 'SF-2024-005',
    nomeProjeto: 'Fibra óptica matriz',
    valor: 560000.00,
    status: 'Emitida',
    dataAbertura: '10/03/2024',
    versao: '3.0'
  },
  {
    id: '6',
    clientId: '4',
    codigo: '20240006',
    salesforce: 'SF-2024-006',
    nomeProjeto: 'VoIP corporativo',
    valor: 290000.00,
    status: 'Cancelada',
    dataAbertura: '25/03/2024',
    versao: '1.0'
  }
];

export const mockProducts: Product[] = [
  {
    id: '1',
    fabricante: 'Lenovo',
    partNumber: '21AT003CBR',
    descricao: 'NBLN TB 13x G2 IAP I7 32G 1T 11P',
    idFamiliaRange: 'ThinkBook 13x G2 IAP',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 12840.18,
    precoVenda: 12840.18,
    quantidade: 1
  },
  {
    id: '2',
    fabricante: 'Lenovo',
    partNumber: '21AT003DBR',
    descricao: 'NBLN TB 13x G2 IAP I7 16G 512G 11P',
    idFamiliaRange: 'ThinkBook 13x G2 IAP',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 10478.09,
    precoVenda: 10478.09,
    quantidade: 1
  },
  {
    id: '3',
    fabricante: 'Lenovo',
    partNumber: '21BY0014BR',
    descricao: 'NB TP X13s G1 SC8280 16G 512G 11P',
    idFamiliaRange: 'X13s G1',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 11901.00,
    precoVenda: 11901.00,
    quantidade: 1
  },
  {
    id: '4',
    fabricante: 'Lenovo',
    partNumber: '21BY001FBR',
    descricao: 'NB TP X13s G1 SC8280 16G 512G 11P',
    idFamiliaRange: 'X13s G1',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 13362.69,
    precoVenda: 13362.69,
    quantidade: 1
  },
  {
    id: '5',
    fabricante: 'Apple',
    partNumber: '21BY001GBR',
    descricao: 'NB TP X13s G1 SC8280 16G 512G 11P',
    idFamiliaRange: 'X13s G1',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 13465.40,
    precoVenda: 13465.40,
    quantidade: 1
  },
  {
    id: '6',
    fabricante: 'Apple',
    partNumber: '21C60013BO',
    descricao: 'NB TP L14 AMD G3 R5_PRO 8G 256G 11P',
    idFamiliaRange: 'L14 AMD G3',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 5396.07,
    precoVenda: 5396.07,
    quantidade: 1
  },
  {
    id: '7',
    fabricante: 'Apple',
    partNumber: '21C6001RBO',
    descricao: 'NB TP L14 AMD G3 R5_PRO 16G 256G 11P',
    idFamiliaRange: 'L14 AMD G3',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 6139.50,
    precoVenda: 6139.50,
    quantidade: 1
  },
  {
    id: '8',
    fabricante: 'Apple',
    partNumber: '21E40015BO',
    descricao: 'NB TP E14 G4 I7 16G 512G 11P',
    idFamiliaRange: 'E14 G4',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 7165.91,
    precoVenda: 7165.91,
    quantidade: 1
  },
  {
    id: '9',
    fabricante: 'Motorola',
    partNumber: '21E4001CBO',
    descricao: 'NB TP E14 G4 I5 8G 256G 11P',
    idFamiliaRange: 'E14 G4',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 5935.20,
    precoVenda: 5935.20,
    quantidade: 1
  },
  {
    id: '10',
    fabricante: 'Motorola',
    partNumber: '21E4001FBO',
    descricao: 'NB TP E14 G4 I5 16G 256G 11P',
    idFamiliaRange: 'E14 G4',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 6051.30,
    precoVenda: 6051.30,
    quantidade: 1
  },
  {
    id: '11',
    fabricante: 'Motorola',
    partNumber: '21E4001KBO',
    descricao: 'NB TP E14 G4 I7 16G 256G 11P',
    idFamiliaRange: 'E14 G4',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 6842.17,
    precoVenda: 6842.17,
    quantidade: 1
  },
  {
    id: '12',
    fabricante: 'Motorola',
    partNumber: '21ET000EBR',
    descricao: 'NB TP X1 Fold 16 G1 I7 16G 1T 11P',
    idFamiliaRange: 'X1 Fold 16 G1',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 36394.23,
    precoVenda: 36394.23,
    quantidade: 1
  },
  {
    id: '13',
    fabricante: 'Motorola',
    partNumber: '21EY000LBR',
    descricao: 'NB TP X13 G4 I5 16G 256G 11P',
    idFamiliaRange: 'X13 G4',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 10142.08,
    precoVenda: 10142.08,
    quantidade: 1
  },
  {
    id: '14',
    fabricante: 'IBM',
    partNumber: '1AAAAAAAAA',
    descricao: 'Notebook 1',
    idFamiliaRange: 'intel',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 1000.00,
    precoVenda: 1000.00,
    quantidade: 1
  },
  {
    id: '15',
    fabricante: 'IBM',
    partNumber: '2AAAAAAAAA',
    descricao: 'Notebook 2',
    idFamiliaRange: 'intel',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 2000.00,
    precoVenda: 2000.00,
    quantidade: 1
  },
  {
    id: '16',
    fabricante: 'IBM',
    partNumber: '3AAAAAAAAA',
    descricao: 'Notebook 3',
    idFamiliaRange: 'intel',
    categoria: 'HW',
    variacaoCambial: false,
    custoUnitario: 3000.00,
    precoVenda: 3000.00,
    quantidade: 1
  },
  {
    id: '17',
    fabricante: 'Microsoft',
    partNumber: '4MMMMMM',
    descricao: 'Windows 11',
    idFamiliaRange: 'Win11',
    categoria: 'SW',
    variacaoCambial: false,
    custoUnitario: 4000.00,
    precoVenda: 4000.00,
    quantidade: 1
  },
  {
    id: '18',
    fabricante: 'Microsoft',
    partNumber: '5MMMMMM',
    descricao: 'Office 365',
    idFamiliaRange: 'Off365',
    categoria: 'SW',
    variacaoCambial: false,
    custoUnitario: 5000.00,
    precoVenda: 5000.00,
    quantidade: 1
  }
];

export const mockAdminSettings: AdminSettings = {
  alcadas: {
    preVendas: 10,
    diretor: 7,
    cdg: 0
  },
  lpuFile: {
    name: 'LPU_2024_Q1.xlsx',
    uploadDate: '15/01/2024'
  }
};

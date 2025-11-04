export interface Client {
  id: string;
  razaoSocial: string;
  cnpj: string;
  telefone?: string;
  email?: string;
}

export interface Quote {
  id: string;
  clientId: string;
  codigo: string;
  salesforce: string;
  nomeProjeto: string;
  valor: number;
  status: 'Aberta' | 'Emitida' | 'Cancelada';
  dataAbertura: string;
  versao: string;
}

export interface QuoteConfig {
  quoteId: string;
  tipoRevenda: 'Cliente' | 'Banco';
  clienteConsumidorFinal: boolean;
  prv: 30 | 45 | 60 | 75 | 90;
  insumosDolar: boolean;
  clausulaReajustePtax: boolean;
  validadeProposta: string;
  inicioReceita: string;
  classificacaoCliente: 'Normal' | 'Microempresa';
  aplicarBenchmarking: boolean;
  mesInicioBenchmarking?: string;
  beneficiarioReidi: boolean;
  dataPtax: string;
  dolarPtax: number;
  contribuicaoIcmsVenda: boolean;
}

export interface Product {
  id: string;
  fabricante: string;
  partNumber: string;
  descricao: string;
  idFamiliaRange: string;
  categoria: 'HW' | 'SW' | 'SERV';
  variacaoCambial: boolean;
  custoUnitario: number;
  precoVenda: number;
  quantidade: number;
}

export interface QuoteProduct extends Product {
  quoteId: string;
}

export interface RateioService {
  id: string;
  quoteId: string;
  item: number;
  mesInicioMinimo: number;
  sgiTis: 'COMP' | 'MODI' | 'MOIN' | 'Outros' | 'Nenhum';
  servico: 'Instalação' | 'Logística' | 'Logística para Transferência entre Filiais Transferência' | 'Armazenagem' | 'Gerente de Projetos' | 'Líder Técnico' | 'Reserva Técnica e Miscelâneas';
  descricaoServico: 'Instalação' | 'Logística' | 'Logística para Transferência entre Filiais Transferência' | 'Armazenagem' | 'Gerente de Projetos Interno' | 'Líder Técnico Interno' | 'Despesas diversas';
  importado: boolean;
  fornecedor: '11 Paths' | '2S' | '3Corp' | '5Dimensão' | '5WI' | '9Net';
  valorComImpostos: number;
  moedaReferencia: 'BRL' | 'USD';
  prazoCusto: string;
  mensalidades: number;
}

export interface Contact {
  nome: string;
  cargo: string;
  telefone: string;
  email: string;
}

export interface ClientContacts {
  quoteId: string;
  contatoCliente: Contact;
  preVendas: Contact;
  gerenteNegocios: Contact;
}

export interface AdminSettings {
  alcadas: {
    preVendas: number;
    diretor: number;
    cdg: number;
  };
  lpuFile?: {
    name: string;
    uploadDate: string;
  };
  cashFlowFile?: {
    name: string;
    uploadDate: string;
    fileData?: ArrayBuffer;
  };
}

export interface QuoteCashFlowFile {
  quoteId: string;
  fileName: string;
  uploadDate: string;
  locked: boolean; // true para cotações não-abertas
}

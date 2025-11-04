import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Client, Quote, QuoteConfig, QuoteProduct, RateioService, ClientContacts, AdminSettings, QuoteCashFlowFile } from '@/types';
import { mockClients, mockQuotes, mockAdminSettings } from '@/data/mockData';

interface AppContextType {
  // Client
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  clients: Client[];
  
  // Quotes
  quotes: Quote[];
  selectedQuote: Quote | null;
  setSelectedQuote: (quote: Quote | null) => void;
  createQuote: (quote: Omit<Quote, 'id'>) => void;
  updateQuote: (id: string, quote: Partial<Quote>) => void;
  cancelQuote: (id: string) => void;
  
  // Quote Config
  quoteConfigs: Record<string, QuoteConfig>;
  updateQuoteConfig: (quoteId: string, config: Partial<QuoteConfig>) => void;
  
  // Products
  quoteProducts: Record<string, QuoteProduct[]>;
  addProductToQuote: (quoteId: string, product: QuoteProduct) => void;
  updateQuoteProduct: (quoteId: string, productId: string, updates: Partial<QuoteProduct>) => void;
  removeProductFromQuote: (quoteId: string, productId: string) => void;
  
  // Rateio
  rateioServices: Record<string, RateioService[]>;
  addRateioService: (quoteId: string, service: Omit<RateioService, 'id' | 'item'>) => void;
  updateRateioService: (quoteId: string, serviceId: string, updates: Partial<RateioService>) => void;
  removeRateioService: (quoteId: string, serviceId: string) => void;
  
  // Contacts
  clientContacts: Record<string, ClientContacts>;
  updateClientContacts: (quoteId: string, contacts: ClientContacts) => void;
  
  // Admin
  adminSettings: AdminSettings;
  updateAdminSettings: (settings: Partial<AdminSettings>) => void;
  
  // Cash Flow Files
  quoteCashFlowFiles: Record<string, QuoteCashFlowFile>;
  setQuoteCashFlowFile: (quoteId: string, file: QuoteCashFlowFile) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients] = useState<Client[]>(mockClients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteConfigs, setQuoteConfigs] = useState<Record<string, QuoteConfig>>({});
  const [quoteProducts, setQuoteProducts] = useState<Record<string, QuoteProduct[]>>({});
  const [rateioServices, setRateioServices] = useState<Record<string, RateioService[]>>({});
  const [clientContacts, setClientContacts] = useState<Record<string, ClientContacts>>({});
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(mockAdminSettings);
  const [quoteCashFlowFiles, setQuoteCashFlowFiles] = useState<Record<string, QuoteCashFlowFile>>({});

  const createQuote = (quote: Omit<Quote, 'id'>) => {
    const newQuote: Quote = {
      ...quote,
      id: `${Date.now()}`,
    };
    setQuotes(prev => [...prev, newQuote]);
    setSelectedQuote(newQuote);
  };

  const updateQuote = (id: string, updates: Partial<Quote>) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    if (selectedQuote?.id === id) {
      setSelectedQuote(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const cancelQuote = (id: string) => {
    updateQuote(id, { status: 'Cancelada' });
  };

  const updateQuoteConfig = (quoteId: string, config: Partial<QuoteConfig>) => {
    const today = new Date();
    const validadeProposta = new Date(today);
    validadeProposta.setDate(validadeProposta.getDate() + 7);
    const inicioReceita = new Date(today);
    inicioReceita.setDate(inicioReceita.getDate() + 30);
    
    setQuoteConfigs(prev => ({
      ...prev,
      [quoteId]: {
        ...(prev[quoteId] || { 
          quoteId, 
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
        }),
        ...config,
      }
    }));
  };

  const addProductToQuote = (quoteId: string, product: QuoteProduct) => {
    setQuoteProducts(prev => ({
      ...prev,
      [quoteId]: [...(prev[quoteId] || []), product],
    }));
  };

  const updateQuoteProduct = (quoteId: string, productId: string, updates: Partial<QuoteProduct>) => {
    setQuoteProducts(prev => ({
      ...prev,
      [quoteId]: (prev[quoteId] || []).map(p => 
        p.id === productId ? { ...p, ...updates } : p
      ),
    }));
  };

  const removeProductFromQuote = (quoteId: string, productId: string) => {
    setQuoteProducts(prev => ({
      ...prev,
      [quoteId]: (prev[quoteId] || []).filter(p => p.id !== productId),
    }));
  };

  const addRateioService = (quoteId: string, service: Omit<RateioService, 'id' | 'item'>) => {
    const currentServices = rateioServices[quoteId] || [];
    const newService: RateioService = {
      ...service,
      id: `${Date.now()}`,
      item: currentServices.length + 1,
    };
    setRateioServices(prev => ({
      ...prev,
      [quoteId]: [...(prev[quoteId] || []), newService],
    }));
  };

  const updateRateioService = (quoteId: string, serviceId: string, updates: Partial<RateioService>) => {
    setRateioServices(prev => ({
      ...prev,
      [quoteId]: (prev[quoteId] || []).map(s => 
        s.id === serviceId ? { ...s, ...updates } : s
      ),
    }));
  };

  const removeRateioService = (quoteId: string, serviceId: string) => {
    setRateioServices(prev => ({
      ...prev,
      [quoteId]: (prev[quoteId] || []).filter(s => s.id !== serviceId),
    }));
  };

  const updateClientContacts = (quoteId: string, contacts: ClientContacts) => {
    setClientContacts(prev => ({
      ...prev,
      [quoteId]: contacts,
    }));
  };

  const updateAdminSettings = (settings: Partial<AdminSettings>) => {
    setAdminSettings(prev => ({
      ...prev,
      ...settings,
      alcadas: settings.alcadas ? { ...prev.alcadas, ...settings.alcadas } : prev.alcadas,
    }));
  };

  const setQuoteCashFlowFile = (quoteId: string, file: QuoteCashFlowFile) => {
    setQuoteCashFlowFiles(prev => ({
      ...prev,
      [quoteId]: file,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        selectedClient,
        setSelectedClient,
        clients,
        quotes,
        selectedQuote,
        setSelectedQuote,
        createQuote,
        updateQuote,
        cancelQuote,
        quoteConfigs,
        updateQuoteConfig,
        quoteProducts,
        addProductToQuote,
        updateQuoteProduct,
        removeProductFromQuote,
        rateioServices,
        addRateioService,
        updateRateioService,
        removeRateioService,
        clientContacts,
        updateClientContacts,
        adminSettings,
        updateAdminSettings,
        quoteCashFlowFiles,
        setQuoteCashFlowFile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

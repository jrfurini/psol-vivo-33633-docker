import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import type { ClientContacts, Contact } from '@/types';

const formatPhoneInput = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

export default function Contatos() {
  const { selectedQuote, clientContacts, updateClientContacts } = useApp();
  
  const [contatoCliente, setContatoCliente] = useState<Contact>({
    nome: '',
    cargo: '',
    telefone: '',
    email: '',
  });

  const [preVendas, setPreVendas] = useState<Contact>({
    nome: '',
    cargo: '',
    telefone: '',
    email: '',
  });

  const [gerenteNegocios, setGerenteNegocios] = useState<Contact>({
    nome: '',
    cargo: '',
    telefone: '',
    email: '',
  });

  useEffect(() => {
    if (selectedQuote) {
      const contacts = clientContacts[selectedQuote.id];
      if (contacts) {
        setContatoCliente(contacts.contatoCliente);
        setPreVendas(contacts.preVendas);
        setGerenteNegocios(contacts.gerenteNegocios);
      }
    }
  }, [selectedQuote, clientContacts]);

  // Auto-save quando os contatos mudarem
  useEffect(() => {
    if (!selectedQuote) return;
    
    // Verificar se há algum campo preenchido para evitar salvar vazio no carregamento inicial
    const hasData = contatoCliente.nome || contatoCliente.email || 
                    preVendas.nome || preVendas.email || 
                    gerenteNegocios.nome || gerenteNegocios.email;
    
    if (hasData) {
      const contacts: ClientContacts = {
        quoteId: selectedQuote.id,
        contatoCliente,
        preVendas,
        gerenteNegocios,
      };
      
      updateClientContacts(selectedQuote.id, contacts);
    }
  }, [contatoCliente, preVendas, gerenteNegocios, selectedQuote]);

  if (!selectedQuote) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Selecione uma cotação para gerenciar os contatos
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Contatos do Cliente</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os contatos relacionados à cotação
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contato do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cliente-nome">Nome</Label>
              <Input
                id="cliente-nome"
                value={contatoCliente.nome}
                onChange={(e) => setContatoCliente({ ...contatoCliente, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="cliente-cargo">Cargo</Label>
              <Input
                id="cliente-cargo"
                value={contatoCliente.cargo}
                onChange={(e) => setContatoCliente({ ...contatoCliente, cargo: e.target.value })}
                placeholder="Cargo"
              />
            </div>
            <div>
              <Label htmlFor="cliente-telefone">Telefone</Label>
              <Input
                id="cliente-telefone"
                value={contatoCliente.telefone}
                onChange={(e) => setContatoCliente({ ...contatoCliente, telefone: formatPhoneInput(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
            <div>
              <Label htmlFor="cliente-email">E-mail</Label>
              <Input
                id="cliente-email"
                type="email"
                value={contatoCliente.email}
                onChange={(e) => setContatoCliente({ ...contatoCliente, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pré Vendas (PV)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pv-nome">Nome</Label>
              <Input
                id="pv-nome"
                value={preVendas.nome}
                onChange={(e) => setPreVendas({ ...preVendas, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="pv-cargo">Cargo</Label>
              <Input
                id="pv-cargo"
                value={preVendas.cargo}
                onChange={(e) => setPreVendas({ ...preVendas, cargo: e.target.value })}
                placeholder="Cargo"
              />
            </div>
            <div>
              <Label htmlFor="pv-telefone">Telefone</Label>
              <Input
                id="pv-telefone"
                value={preVendas.telefone}
                onChange={(e) => setPreVendas({ ...preVendas, telefone: formatPhoneInput(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
            <div>
              <Label htmlFor="pv-email">E-mail</Label>
              <Input
                id="pv-email"
                type="email"
                value={preVendas.email}
                onChange={(e) => setPreVendas({ ...preVendas, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gerente de Negócios (GN)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gn-nome">Nome</Label>
              <Input
                id="gn-nome"
                value={gerenteNegocios.nome}
                onChange={(e) => setGerenteNegocios({ ...gerenteNegocios, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="gn-cargo">Cargo</Label>
              <Input
                id="gn-cargo"
                value={gerenteNegocios.cargo}
                onChange={(e) => setGerenteNegocios({ ...gerenteNegocios, cargo: e.target.value })}
                placeholder="Cargo"
              />
            </div>
            <div>
              <Label htmlFor="gn-telefone">Telefone</Label>
              <Input
                id="gn-telefone"
                value={gerenteNegocios.telefone}
                onChange={(e) => setGerenteNegocios({ ...gerenteNegocios, telefone: formatPhoneInput(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
            <div>
              <Label htmlFor="gn-email">E-mail</Label>
              <Input
                id="gn-email"
                type="email"
                value={gerenteNegocios.email}
                onChange={(e) => setGerenteNegocios({ ...gerenteNegocios, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuoteProduct, ClientContacts } from '@/types';
import { formatCurrency } from './formatters';

export const generateProposalPDF = (
  quoteNumber: string,
  clientName: string,
  clientCNPJ: string,
  products: QuoteProduct[],
  contacts?: ClientContacts
) => {
  const doc = new jsPDF();

  // Página 1 - Título
  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  doc.text('Proposta Comercial', 105, 100, { align: 'center' });

  doc.setFontSize(15);
  doc.setFont('helvetica', 'normal');
  doc.text(clientName, 105, 120, { align: 'center' });
  doc.text(`CNPJ: ${clientCNPJ}`, 105, 130, { align: 'center' });

  // Página 2 - Produtos
  doc.addPage();
  
  const tableData = products.map(product => [
    product.fabricante,
    product.descricao,
    formatCurrency(product.precoVenda),
    product.quantidade.toString(),
    formatCurrency(product.precoVenda * product.quantidade)
  ]);

  autoTable(doc, {
    head: [['Fabricante', 'Descrição', 'Valor Unit. Venda', 'Qtd.', 'Valor de Venda']],
    body: tableData,
    startY: 20,
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [103, 3, 159], textColor: 255 },
  });

  // Total
  const total = products.reduce((sum, p) => sum + (p.precoVenda * p.quantidade), 0);
  const finalY = (doc as any).lastAutoTable.finalY || 20;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Valor Total: ${formatCurrency(total)}`, 14, finalY + 15);

  // Página 3 - Contatos
  if (contacts) {
    doc.addPage();
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Contatos', 14, 20);

    let yPos = 35;

    // Contato do Cliente
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Contato do Cliente', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    if (contacts.contatoCliente.nome) {
      doc.text(`Nome: ${contacts.contatoCliente.nome}`, 14, yPos);
      yPos += 7;
    }
    if (contacts.contatoCliente.cargo) {
      doc.text(`Cargo: ${contacts.contatoCliente.cargo}`, 14, yPos);
      yPos += 7;
    }
    if (contacts.contatoCliente.telefone) {
      doc.text(`Telefone: ${contacts.contatoCliente.telefone}`, 14, yPos);
      yPos += 7;
    }
    if (contacts.contatoCliente.email) {
      doc.text(`E-mail: ${contacts.contatoCliente.email}`, 14, yPos);
      yPos += 7;
    }

    yPos += 10;

    // Pré Vendas
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Pré Vendas (PV)', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    if (contacts.preVendas.nome) {
      doc.text(`Nome: ${contacts.preVendas.nome}`, 14, yPos);
      yPos += 7;
    }
    if (contacts.preVendas.cargo) {
      doc.text(`Cargo: ${contacts.preVendas.cargo}`, 14, yPos);
      yPos += 7;
    }
    if (contacts.preVendas.telefone) {
      doc.text(`Telefone: ${contacts.preVendas.telefone}`, 14, yPos);
      yPos += 7;
    }
    if (contacts.preVendas.email) {
      doc.text(`E-mail: ${contacts.preVendas.email}`, 14, yPos);
      yPos += 7;
    }

    yPos += 10;

    // Gerente de Negócios
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Gerente de Negócios (GN)', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    if (contacts.gerenteNegocios.nome) {
      doc.text(`Nome: ${contacts.gerenteNegocios.nome}`, 14, yPos);
      yPos += 7;
    }
    if (contacts.gerenteNegocios.cargo) {
      doc.text(`Cargo: ${contacts.gerenteNegocios.cargo}`, 14, yPos);
      yPos += 7;
    }
    if (contacts.gerenteNegocios.telefone) {
      doc.text(`Telefone: ${contacts.gerenteNegocios.telefone}`, 14, yPos);
      yPos += 7;
    }
    if (contacts.gerenteNegocios.email) {
      doc.text(`E-mail: ${contacts.gerenteNegocios.email}`, 14, yPos);
      yPos += 7;
    }
  }

  // Download
  doc.save(`Proposta comercial-${quoteNumber}.pdf`);
};

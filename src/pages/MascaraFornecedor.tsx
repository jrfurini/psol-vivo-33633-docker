import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { mockProducts } from '@/data/mockData';
import { QuoteProduct } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { generateBulkProductTemplate, parseBulkProductFile } from '@/lib/excelGenerator';
import { toast } from 'sonner';

export default function MascaraFornecedor() {
  const navigate = useNavigate();
  const { selectedQuote, quoteProducts, addProductToQuote, updateQuoteProduct, removeProductFromQuote } = useApp();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [precoVenda, setPrecoVenda] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedQuote) {
      toast.error('Selecione uma cotação primeiro');
      navigate('/');
    }
  }, [selectedQuote, navigate]);

  if (!selectedQuote) {
    return null;
  }

  const products = quoteProducts[selectedQuote.id] || [];

  const handleAddProduct = () => {
    const product = mockProducts.find(p => p.id === selectedProduct);
    if (!product || precoVenda <= 0) return;

    const quoteProduct: QuoteProduct = {
      ...product,
      id: `${Date.now()}`,
      quoteId: selectedQuote.id,
      quantidade: quantity,
      precoVenda: precoVenda,
    };

    addProductToQuote(selectedQuote.id, quoteProduct);
    setIsAddDialogOpen(false);
    setSelectedProduct('');
    setQuantity(1);
    setPrecoVenda(0);
    toast.success('Produto adicionado');
  };

  const selectedProductData = mockProducts.find(p => p.id === selectedProduct);

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    updateQuoteProduct(selectedQuote.id, productId, { quantidade: newQuantity });
    toast.success('Quantidade atualizada');
  };

  const handleRemoveProduct = (productId: string) => {
    removeProductFromQuote(selectedQuote.id, productId);
    toast.success('Produto removido');
  };

  const handleDownloadTemplate = () => {
    generateBulkProductTemplate();
    toast.success('Template baixado com sucesso');
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseBulkProductFile(file);
      
      let addedCount = 0;
      data.forEach((row: any) => {
        if (!row['Fabricante'] || !row['Descrição']) return;

        const quoteProduct: QuoteProduct = {
          id: `${Date.now()}-${addedCount}`,
          quoteId: selectedQuote.id,
          fabricante: row['Fabricante'],
          partNumber: row['Part Number'] || '',
          descricao: row['Descrição'],
          idFamiliaRange: row['ID Família/Range'] || '',
          categoria: row['Categoria'] || '',
          variacaoCambial: row['Variação Cambial'] === 'Sim',
          custoUnitario: parseFloat(row['Custo Unitário']) || 0,
          precoVenda: parseFloat(row['Valor Unit. Venda']) || 0,
          quantidade: parseInt(row['Quantidade']) || 1,
        };

        addProductToQuote(selectedQuote.id, quoteProduct);
        addedCount++;
      });

      toast.success(`${addedCount} produtos adicionados com sucesso`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Erro ao processar arquivo. Verifique o formato.');
    }
  };

  const totalValue = products.reduce((sum, p) => sum + (p.precoVenda * p.quantidade), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Máscara do Fornecedor</h1>
          <p className="text-muted-foreground">Produtos da cotação</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="text-sm text-primary hover:underline"
          >
            Template para produtos em massa
          </button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Adicionar produtos em massa
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleBulkUpload}
            className="hidden"
          />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Produto</Label>
                <Select value={selectedProduct} onValueChange={(value) => {
                  setSelectedProduct(value);
                  const product = mockProducts.find(p => p.id === value);
                  if (product) {
                    setPrecoVenda(product.custoUnitario);
                  }
                }}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione um produto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.descricao} - {product.fabricante}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedProductData && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Custo Unitário</div>
                  <div className="text-lg font-semibold text-foreground">
                    {formatCurrency(selectedProductData.custoUnitario)}
                  </div>
                </div>
              )}
              <div>
                <Label>Valor Unitário de Venda</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precoVenda}
                    onChange={(e) => setPrecoVenda(Number(e.target.value))}
                    className="pl-10"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-2"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleAddProduct}
                disabled={!selectedProduct || quantity < 1 || precoVenda <= 0}
              >
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card className="p-6">
        {products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum produto adicionado ainda
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fabricante</TableHead>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>ID Família/Range</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Variação Cambial?</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-right">Valor Unit. Venda</TableHead>
                    <TableHead className="text-right">Qtd.</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Valor de Venda</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>{product.fabricante}</TableCell>
                      <TableCell className="font-medium">{product.partNumber}</TableCell>
                      <TableCell>{product.descricao}</TableCell>
                      <TableCell>{product.idFamiliaRange}</TableCell>
                      <TableCell>{product.categoria}</TableCell>
                      <TableCell>{product.variacaoCambial ? 'Sim' : 'Não'}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.custoUnitario)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.precoVenda)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="1"
                          value={product.quantidade}
                          onChange={(e) => handleUpdateQuantity(product.id, Number(e.target.value))}
                          className="w-20 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.custoUnitario * product.quantidade)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(product.precoVenda * product.quantidade)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-6 flex justify-end">
              <div className="bg-accent p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Valor Total</div>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(totalValue)}
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

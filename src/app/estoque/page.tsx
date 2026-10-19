'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  SlidersHorizontal,
  DollarSign,
  TrendingUp,
  Truck,
  History,
  CheckCircle,
  X,
  Phone,
  MessageCircle,
  FileSpreadsheet,
  Edit2,
} from 'lucide-react';
import {
  getProducts,
  createProduct,
  updateProduct,
  getSuppliers,
  createSupplier,
  getStockMovements,
  recordStockMovement,
} from '@/lib/api';
import {
  Product,
  ProductCategory,
  ProductUnit,
  Supplier,
  StockMovement,
  StockMovementType,
} from '@/lib/types';
import { formatCurrencyBRL } from '@/lib/formatters';
import { AppLayout } from '@/components/layout/AppLayout';

export default function EstoquePage() {
  const [activeTab, setActiveTab] = useState<'products' | 'movements' | 'suppliers'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);

  // Forms
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: 'gas',
    sku: '',
    unit: 'un',
    quantity: 0,
    min_stock: 2,
    cost_price: 0,
    sale_price: 0,
    notes: '',
  });

  const [movementForm, setMovementForm] = useState<{
    productId: string;
    movementType: StockMovementType;
    quantity: number;
    unitCost: number;
    notes: string;
  }>({
    productId: '',
    movementType: 'entry',
    quantity: 1,
    unitCost: 0,
    notes: '',
  });

  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: '',
    contact_name: '',
    phone: '',
    whatsapp: '',
    city: 'Manaus',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodData, supData, movData] = await Promise.all([
        getProducts(),
        getSuppliers(),
        getStockMovements({ limit: 50 }),
      ]);
      setProducts(prodData);
      setSuppliers(supData);
      setMovements(movData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name?.trim()) return;
    setSubmitting(true);
    try {
      await createProduct(newProduct);
      setShowProductModal(false);
      setNewProduct({
        name: '',
        category: 'gas',
        sku: '',
        unit: 'un',
        quantity: 0,
        min_stock: 2,
        cost_price: 0,
        sale_price: 0,
        notes: '',
      });
      await loadData();
    } catch (err) {
      console.error('Erro ao cadastrar produto:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.productId || movementForm.quantity <= 0) return;
    setSubmitting(true);
    try {
      await recordStockMovement({
        productId: movementForm.productId,
        movementType: movementForm.movementType,
        quantity: Number(movementForm.quantity),
        unitCost: Number(movementForm.unitCost) || undefined,
        notes: movementForm.notes || undefined,
      });
      setShowMovementModal(false);
      setSelectedProductForMovement(null);
      await loadData();
    } catch (err) {
      console.error('Erro ao registrar movimentação:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name?.trim()) return;
    setSubmitting(true);
    try {
      await createSupplier(newSupplier as any);
      setShowSupplierModal(false);
      setNewSupplier({
        name: '',
        contact_name: '',
        phone: '',
        whatsapp: '',
        city: 'Manaus',
        notes: '',
      });
      await loadData();
    } catch (err) {
      console.error('Erro ao cadastrar fornecedor:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const openMovementForProduct = (prod: Product) => {
    setSelectedProductForMovement(prod);
    setMovementForm({
      productId: prod.id,
      movementType: 'entry',
      quantity: 1,
      unitCost: prod.cost_price || 0,
      notes: '',
    });
    setShowMovementModal(true);
  };

  // Calculations
  const lowStockCount = products.filter((p) => p.quantity <= p.min_stock).length;
  const totalCostValue = products.reduce((acc, p) => acc + (p.quantity * (p.cost_price || 0)), 0);
  const totalSaleValue = products.reduce((acc, p) => acc + (p.quantity * (p.sale_price || 0)), 0);

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
    if (!matchesSearch) return false;

    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (lowStockFilter && p.quantity > p.min_stock) return false;

    return true;
  });

  const categoryLabels: Record<ProductCategory, string> = {
    gas: 'Gás Refrigerante',
    quimico: 'Químico & Limpeza',
    peca: 'Peças & Placas',
    eletrica: 'Materiais Elétricos',
    ferramenta: 'Ferramentas',
    outros: 'Outros',
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103778] flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#0754D8]" />
            <span>Estoque & Materiais</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle de gases refrigerantes, bactericidas, peças de reposição e fornecedores
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'suppliers') {
                setShowSupplierModal(true);
              } else {
                setShowProductModal(true);
              }
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white py-2.5 px-4 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'suppliers' ? 'Novo Fornecedor' : 'Cadastrar Item'}</span>
          </button>
        </div>
      </div>

      {/* METRIC BADGES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500">Itens em Catálogo</p>
            <p className="text-xl font-bold text-[#103778] mt-0.5">{products.length}</p>
          </div>
          <div className="p-2 bg-[#EAF3FF] rounded-lg text-[#0754D8]">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => {
            setLowStockFilter(!lowStockFilter);
            setActiveTab('products');
          }}
          className={`cursor-pointer border rounded-xl p-3.5 flex items-center justify-between transition-all ${
            lowStockCount > 0
              ? 'bg-amber-50/80 border-amber-200 hover:bg-amber-100/60'
              : 'bg-white border-slate-200/90'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-amber-800">Alerta Estoque Baixo</p>
            <p className="text-xl font-bold text-amber-900 mt-0.5">{lowStockCount}</p>
          </div>
          <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500">Custo Total em Estoque</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{formatCurrencyBRL(totalCostValue)}</p>
          </div>
          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500">Valor Estimado Venda</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{formatCurrencyBRL(totalSaleValue)}</p>
          </div>
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'products'
              ? 'border-[#0754D8] text-[#0754D8]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produtos & Materiais ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'movements'
              ? 'border-[#0754D8] text-[#0754D8]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Histórico de Entradas / Saídas</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'suppliers'
              ? 'border-[#0754D8] text-[#0754D8]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Fornecedores ({suppliers.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: PRODUTOS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* SEARCH & CATEGORY FILTER */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou código SKU..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-hidden focus:border-[#0754D8] focus:ring-1 focus:ring-[#0754D8]"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-2 rounded-lg font-semibold whitespace-nowrap border ${
                  categoryFilter === 'all'
                    ? 'bg-[#103778] text-white border-[#103778]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Todos
              </button>
              {Object.entries(categoryLabels).map(([cat, label]) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-2 rounded-lg font-semibold whitespace-nowrap border ${
                    categoryFilter === cat
                      ? 'bg-[#103778] text-white border-[#103778]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* LIST OF PRODUCTS */}
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0754D8]" />
              <p className="text-sm">Carregando estoque...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#103778]">Nenhum item encontrado</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Cadastre insumos como gases (R410A, R32), bactericidas e disjuntores para acompanhar o estoque.
              </p>
              <button
                onClick={() => setShowProductModal(true)}
                className="mt-4 inline-flex items-center gap-2 bg-[#0754D8] text-white py-2 px-4 rounded-xl text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Primeiro Item</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const isLow = product.quantity <= product.min_stock;
                return (
                  <div
                    key={product.id}
                    className={`bg-white border rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between ${
                      isLow ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200/90 hover:border-[#0754D8]/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {categoryLabels[product.category] || product.category}
                        </span>

                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Estoque Baixo
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Normal
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-[#103778] text-base leading-snug">{product.name}</h3>

                      {product.sku && (
                        <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {product.sku}</p>
                      )}

                      <div className="mt-4 p-3 bg-slate-50 rounded-xl grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-400 text-[10px]">Saldo Atual</p>
                          <p className={`font-bold text-base ${isLow ? 'text-amber-700' : 'text-slate-800'}`}>
                            {product.quantity} <span className="text-xs font-normal text-slate-500">{product.unit}</span>
                          </p>
                          <p className="text-[10px] text-slate-400">Mínimo: {product.min_stock} {product.unit}</p>
                        </div>

                        <div>
                          <p className="text-slate-400 text-[10px]">Preço de Custo / Venda</p>
                          <p className="font-semibold text-slate-700">
                            {formatCurrencyBRL(product.cost_price || 0)}
                          </p>
                          <p className="font-bold text-emerald-600 text-xs">
                            {formatCurrencyBRL(product.sale_price || 0)} <span className="text-[10px] text-slate-400">(venda)</span>
                          </p>
                        </div>
                      </div>

                      {product.supplier && (
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <Truck className="w-3 h-3 text-slate-400" />
                          <span>Fornecedor: {product.supplier.name}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => openMovementForProduct(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#0754D8] hover:bg-[#0642aa] text-white py-2 px-3 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Movimentar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: MOVIMENTAÇÕES */}
      {activeTab === 'movements' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#103778] text-base">Últimas 50 Movimentações</h3>
              <p className="text-xs text-slate-500">Histórico de compras, consumo em ordens de serviço e balanços</p>
            </div>
            <button
              onClick={() => {
                if (products.length > 0) {
                  openMovementForProduct(products[0]);
                }
              }}
              className="inline-flex items-center gap-1.5 bg-[#0754D8] text-white py-1.5 px-3 rounded-lg text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lançar Movimento</span>
            </button>
          </div>

          {movements.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Nenhuma movimentação registrada até o momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {movements.map((mov) => {
                const isEntry = mov.movement_type === 'entry';
                const isExit = mov.movement_type === 'exit' || mov.movement_type === 'service_order';
                return (
                  <div key={mov.id} className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/70">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl ${
                          isEntry
                            ? 'bg-emerald-100 text-emerald-700'
                            : isExit
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isEntry ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : isExit ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <SlidersHorizontal className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {mov.product?.name || 'Produto'}
                        </h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {mov.movement_type === 'entry' && 'Entrada / Compra'}
                          {mov.movement_type === 'exit' && 'Saída Manual'}
                          {mov.movement_type === 'service_order' && 'Consumo em O.S.'}
                          {mov.movement_type === 'adjustment' && 'Ajuste de Balanço'}
                          {mov.notes && ` • ${mov.notes}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-bold text-sm ${
                          isEntry ? 'text-emerald-700' : isExit ? 'text-red-700' : 'text-slate-800'
                        }`}
                      >
                        {isEntry ? '+' : isExit ? '-' : ''}
                        {mov.quantity} {mov.product?.unit || 'un'}
                      </p>
                      <p className="text-slate-400 text-[10px] mt-0.5">
                        {mov.created_at ? new Date(mov.created_at).toLocaleDateString('pt-BR') : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: FORNECEDORES */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Contatos de distribuidoras de refrigeração e lojas de materiais elétricos
            </p>
            <button
              onClick={() => setShowSupplierModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#0754D8] text-white py-2 px-3.5 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Fornecedor</span>
            </button>
          </div>

          {suppliers.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#103778]">Nenhum fornecedor cadastrado</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Guarde contatos de lojas de gás e peças em Manaus para orçamentos rápidos de reposição.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-[#103778] text-base">{sup.name}</h3>
                    {sup.contact_name && (
                      <p className="text-xs text-slate-500 mt-0.5">Contato: {sup.contact_name}</p>
                    )}
                    {sup.city && (
                      <p className="text-xs text-slate-400 mt-0.5">Cidade: {sup.city}</p>
                    )}
                    {sup.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-3">
                        {sup.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 flex gap-2">
                    {sup.whatsapp && (
                      <a
                        href={`https://wa.me/55${sup.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-semibold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    {sup.phone && (
                      <a
                        href={`tel:${sup.phone}`}
                        className="p-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
                        title="Ligar"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: NOVO PRODUTO */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-[#103778] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#0754D8]" />
                <span>Cadastrar Novo Insumo / Peça</span>
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Item / Descrição *
                </label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Ex: Gás Refrigerante R410A 11.3kg Dupont"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0754D8] focus:outline-hidden"
                  >
                    <option value="gas">Gás Refrigerante</option>
                    <option value="quimico">Químico & Higienização</option>
                    <option value="peca">Peça & Placa</option>
                    <option value="eletrica">Material Elétrico</option>
                    <option value="ferramenta">Ferramenta</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0754D8] focus:outline-hidden"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="kg">Quilo (kg)</option>
                    <option value="l">Litro (L)</option>
                    <option value="m">Metro (m)</option>
                    <option value="cx">Caixa (cx)</option>
                    <option value="kit">Kit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade Inicial em Estoque
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.min_stock}
                    onChange={(e) => setNewProduct({ ...newProduct, min_stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.cost_price}
                    onChange={(e) => setNewProduct({ ...newProduct, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço de Venda / Repasse (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.sale_price}
                    onChange={(e) => setNewProduct({ ...newProduct, sale_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código SKU / Referência
                  </label>
                  <input
                    type="text"
                    value={newProduct.sku || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="Ex: GAS-R410A"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fornecedor Habitual
                  </label>
                  <select
                    value={newProduct.supplier_id || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, supplier_id: e.target.value || null })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0754D8] focus:outline-hidden"
                  >
                    <option value="">Nenhum fornecedor</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0754D8] text-white text-sm font-semibold hover:bg-[#0642aa] disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Cadastrar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVIMENTAÇÃO DE ESTOQUE */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-[#103778]">Movimentar Estoque</h3>
              <button
                onClick={() => setShowMovementModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Selecionado
                </label>
                <select
                  value={movementForm.productId}
                  onChange={(e) => {
                    const prod = products.find((p) => p.id === e.target.value);
                    setMovementForm({
                      ...movementForm,
                      productId: e.target.value,
                      unitCost: prod?.cost_price || 0,
                    });
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0754D8] focus:outline-hidden"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Atual: {p.quantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Movimentação *
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'entry', label: 'Entrada (+)', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                    { id: 'exit', label: 'Saída (-)', color: 'border-red-500 bg-red-50 text-red-800' },
                    { id: 'adjustment', label: 'Balanço (=)', color: 'border-blue-500 bg-blue-50 text-blue-800' },
                  ].map((type) => (
                    <button
                      type="button"
                      key={type.id}
                      onClick={() => setMovementForm({ ...movementForm, movementType: type.id as any })}
                      className={`py-2 px-2 rounded-xl border text-center font-bold transition-all ${
                        movementForm.movementType === type.id
                          ? type.color
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {movementForm.movementType === 'adjustment' ? 'Novo Saldo Real' : 'Quantidade *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm({ ...movementForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custo Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={movementForm.unitCost}
                    onChange={(e) => setMovementForm({ ...movementForm, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo / Observações
                </label>
                <input
                  type="text"
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                  placeholder="Ex: Compra NF 1234 / Consumo no Cliente X"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0754D8] text-white text-sm font-semibold hover:bg-[#0642aa] disabled:opacity-50"
                >
                  {submitting ? 'Lançando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO FORNECEDOR */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-[#103778]">Cadastrar Fornecedor</h3>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Empresa / Loja *
                </label>
                <input
                  type="text"
                  required
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="Ex: Distribuidora Friopeças Manaus"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Vendedor / Contato
                  </label>
                  <input
                    type="text"
                    value={newSupplier.contact_name || ''}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contact_name: e.target.value })}
                    placeholder="Ex: Carlos Vendas"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp (com DDD)
                  </label>
                  <input
                    type="text"
                    value={newSupplier.whatsapp || ''}
                    onChange={(e) => setNewSupplier({ ...newSupplier, whatsapp: e.target.value })}
                    placeholder="Ex: 92981234567"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone Fixo
                  </label>
                  <input
                    type="text"
                    value={newSupplier.phone || ''}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    placeholder="Ex: 9232145678"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={newSupplier.city || 'Manaus'}
                    onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações / Itens que fornece
                </label>
                <textarea
                  rows={2}
                  value={newSupplier.notes || ''}
                  onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                  placeholder="Ex: Fornece gás R410A com bom preço à vista e entrega na oficina"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0754D8] text-white text-sm font-semibold hover:bg-[#0642aa] disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  );
}

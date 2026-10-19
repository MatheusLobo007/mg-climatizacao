'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  Save,
  Users,
  MapPin,
  AirVent,
  Zap,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Sparkles,
  DollarSign,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getCustomers, getServiceCatalog, createQuote } from '@/lib/api';
import { Customer, ServiceCatalogItem, ServiceCategory } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

interface QuoteItemRow {
  item_type: 'service' | 'material';
  catalog_service_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

function NovoOrcamentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramCustomerId = searchParams.get('customerId') || '';
  const paramEquipmentId = searchParams.get('equipmentId') || '';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [customerId, setCustomerId] = useState(paramCustomerId);
  const [addressId, setAddressId] = useState('');
  const [equipmentId, setEquipmentId] = useState(paramEquipmentId);
  const [category, setCategory] = useState<ServiceCategory>('climatizacao');
  const [validUntil, setValidUntil] = useState('');
  const [validDays, setValidDays] = useState(15);
  const [discount, setDiscount] = useState('0');
  const [paymentTerms, setPaymentTerms] = useState('Pix à vista ou até 3x no cartão');
  const [executionEstimate, setExecutionEstimate] = useState('1 dia útil');
  const [warrantyTerms, setWarrantyTerms] = useState('90 dias de garantia sobre o serviço');
  const [notes, setNotes] = useState('');

  // Items
  const [items, setItems] = useState<QuoteItemRow[]>([]);

  useEffect(() => {
    // Definir data de validade inicial (hoje + 15 dias)
    const d = new Date();
    d.setDate(d.getDate() + 15);
    setValidUntil(d.toISOString().split('T')[0]);

    async function loadData() {
      try {
        setLoading(true);
        const [cList, catList] = await Promise.all([
          getCustomers(),
          getServiceCatalog(),
        ]);
        setCustomers(cList);
        setCatalog(catList);

        if (paramCustomerId) {
          const cust = cList.find((c) => c.id === paramCustomerId);
          if (cust?.addresses && cust.addresses.length > 0) {
            setAddressId(cust.addresses[0].id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [paramCustomerId]);

  const handleSetValidityDays = (days: number) => {
    setValidDays(days);
    const d = new Date();
    d.setDate(d.getDate() + days);
    setValidUntil(d.toISOString().split('T')[0]);
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Adicionar item do catálogo
  const handleAddCatalogItem = (serviceId: string) => {
    const s = catalog.find((item) => item.id === serviceId);
    if (!s) return;

    const newItem: QuoteItemRow = {
      item_type: 'service',
      catalog_service_id: s.id,
      name: s.name,
      quantity: 1,
      unit_price: Number(s.default_price || 0),
      total_price: Number(s.default_price || 0),
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Remover item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Atualizar quantidade ou preço de um item
  const handleUpdateItem = (index: number, qty: number, price: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            quantity: qty,
            unit_price: price,
            total_price: qty * price,
          };
        }
        return item;
      })
    );
  };

  // Cálculos de Totais
  const subtotal = items.reduce((acc, curr) => acc + curr.total_price, 0);
  const discountVal = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discountVal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setErrorMsg('Selecione o cliente responsável pelo orçamento.');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Adicione pelo menos um item ao orçamento.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const quote = await createQuote({
        customer_id: customerId,
        address_id: addressId || undefined,
        equipment_id: equipmentId || undefined,
        category,
        valid_until: validUntil,
        subtotal,
        discount: discountVal,
        total_amount: grandTotal,
        payment_terms: paymentTerms.trim() || undefined,
        execution_time_estimate: executionEstimate.trim() || undefined,
        warranty_terms: warrantyTerms.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          item_type: i.item_type,
          catalog_service_id: i.catalog_service_id,
          name: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price,
        })),
      });

      if (quote) {
        router.push(`/orcamentos/${quote.id}`);
      } else {
        router.push('/orcamentos');
      }
    } catch (err: any) {
      console.error('Erro ao criar orçamento:', err);
      setErrorMsg(err.message || 'Falha ao salvar orçamento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/orcamentos"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0754D8] hover:border-[#0754D8] transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#103778] tracking-tight">
            Novo Orçamento
          </h1>
          <p className="text-xs text-slate-500">
            Monte a proposta comercial com preços, validade e condições de pagamento
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SEÇÃO 1: CLIENTE E LOCAL */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#103778] flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-[#0754D8]" />
            <span>Cliente e Local da Proposta</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cliente *
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  const cust = customers.find((c) => c.id === e.target.value);
                  if (cust?.addresses && cust.addresses.length > 0) {
                    setAddressId(cust.addresses[0].id);
                  } else {
                    setAddressId('');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
              >
                <option value="">Selecione um cliente cadastrado...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer && selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço do Serviço
                </label>
                <select
                  value={addressId}
                  onChange={(e) => setAddressId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {selectedCustomer.addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label || 'Endereço'} — {a.street}, {a.number} ({a.neighborhood})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* SEÇÃO 2: TIPO & PRAZO DE VALIDADE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#103778] flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-[#0754D8]" />
            <span>Condições Gerais da Proposta</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoria
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('climatizacao')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    category === 'climatizacao'
                      ? 'bg-[#0754D8] text-white border-[#0754D8]'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <AirVent className="w-3.5 h-3.5" />
                  <span>Climatização (Ar-Condicionado)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('eletrica')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    category === 'eletrica'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Elétrica Residencial</span>
                </button>
              </div>
            </div>

            {category === 'climatizacao' && selectedCustomer?.equipment && selectedCustomer.equipment.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ar-Condicionado Relacionado (Opcional)
                </label>
                <select
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="">Aparelho a definir ou múltiplos</option>
                  {selectedCustomer.equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.environment} — {eq.brand || 'Split'} ({eq.btu_capacity || 'BTU'} BTU)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prazo de Validade da Proposta
                </label>
                <div className="flex gap-2 mb-2">
                  {[7, 15, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSetValidityDays(d)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        validDays === d
                          ? 'bg-[#0754D8] text-white border-[#0754D8]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {d} dias
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#103778]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prazo Estimado de Execução
                </label>
                <input
                  type="text"
                  value={executionEstimate}
                  onChange={(e) => setExecutionEstimate(e.target.value)}
                  placeholder="Ex: 1 dia útil, 4 horas, A combinar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condições de Pagamento Propostas
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Ex: Pix com 5% de desconto; 50% entrada e 50% na conclusão"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Garantia Informada
                </label>
                <input
                  type="text"
                  value={warrantyTerms}
                  onChange={(e) => setWarrantyTerms(e.target.value)}
                  placeholder="Ex: 90 dias sobre a mão de obra"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações Técnicas / Escopo do Serviço (Opcional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Incluso fornecimento de tubulação de cobre até 3m e suporte metálico."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: ITENS E VALORES */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#103778] mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#0754D8]" />
            <span>Itens Orçados</span>
          </h2>

          {/* Adicionar do Catálogo */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Adicionar do Catálogo de Serviços:
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddCatalogItem(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
            >
              <option value="">Selecione um serviço do catálogo para adicionar ao orçamento...</option>
              {catalog
                .filter((s) => s.category === category)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    + {s.name} — {formatCurrency(s.default_price)}
                  </option>
                ))}
            </select>
          </div>

          {/* Lista de Itens */}
          {items.length > 0 ? (
            <div className="space-y-2 mb-4">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-800 block truncate">{item.name}</span>
                    <span className="text-slate-400 text-[10px] uppercase">{item.item_type}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-16">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(idx, parseFloat(e.target.value) || 1, item.unit_price)
                        }
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 text-center font-bold"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleUpdateItem(idx, item.quantity, parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 text-right font-bold text-[#0754D8]"
                      />
                    </div>
                    <span className="w-24 text-right font-extrabold text-[#103778]">
                      {formatCurrency(item.total_price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 rounded text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs mb-4">
              Selecione os serviços no catálogo acima para compor a proposta.
            </div>
          )}

          {/* TOTAIS E DESCONTO */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal dos Itens:</span>
              <span className="font-bold">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Desconto Comercial Concedido (R$):</span>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-28 px-2 py-1 rounded-lg border border-slate-200 text-right font-bold text-red-600"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-extrabold text-[#103778]">
              <span>Valor Total da Proposta:</span>
              <span className="text-xl text-[#0754D8]">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* BOTÕES DE SUBMISSÃO */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/orcamentos"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Gerando Orçamento...' : 'Gerar Orçamento'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NovoOrcamentoPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="py-20 text-center text-slate-400">Carregando...</div>}>
        <NovoOrcamentoContent />
      </Suspense>
    </AppLayout>
  );
}

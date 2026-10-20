'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ClipboardList,
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
  AlertCircle,
  Clock,
  Receipt,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getCustomers, getServiceCatalog, createServiceOrder } from '@/lib/api';
import { Customer, ServiceCatalogItem, ServiceCategory, PaymentStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

interface OrderItemRow {
  item_type: 'service' | 'material';
  catalog_service_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

function NovaOrdemContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramCustomerId = searchParams.get('customerId') || '';
  const paramEquipmentId = searchParams.get('equipmentId') || '';
  const paramAppointmentId = searchParams.get('appointmentId') || '';
  const paramCategory = (searchParams.get('category') as ServiceCategory) || 'climatizacao';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [customerId, setCustomerId] = useState(paramCustomerId);
  const [addressId, setAddressId] = useState('');
  const [equipmentId, setEquipmentId] = useState(paramEquipmentId);
  const [category, setCategory] = useState<ServiceCategory>(paramCategory);
  const [isCleaning, setIsCleaning] = useState(paramCategory === 'climatizacao');
  const [problemDescription, setProblemDescription] = useState('');
  const [technicianName, setTechnicianName] = useState('Técnico MG');
  const [scheduledDate, setScheduledDate] = useState('');
  const [discount, setDiscount] = useState('0');

  // Campos de Pagamento & Fluxo de Caixa
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [amountPaid, setAmountPaid] = useState('0');

  // Items adicionados à OS
  const [items, setItems] = useState<OrderItemRow[]>([]);

  useEffect(() => {
    setScheduledDate(new Date().toISOString().split('T')[0]);
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

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Adicionar item do catálogo
  const handleAddCatalogItem = (serviceId: string) => {
    const s = catalog.find((item) => item.id === serviceId);
    if (!s) return;

    const newItem: OrderItemRow = {
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
  const totalServices = items
    .filter((i) => i.item_type === 'service')
    .reduce((acc, curr) => acc + curr.total_price, 0);

  const totalMaterials = items
    .filter((i) => i.item_type === 'material')
    .reduce((acc, curr) => acc + curr.total_price, 0);

  const discountVal = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, totalServices + totalMaterials - discountVal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setErrorMsg('Selecione o cliente responsável.');
      return;
    }
    if (!problemDescription.trim()) {
      setErrorMsg('Informe o problema relatado ou serviço a ser executado.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const paidVal =
        paymentStatus === 'paid'
          ? (parseFloat(amountPaid) || grandTotal)
          : paymentStatus === 'partial'
          ? (parseFloat(amountPaid) || 0)
          : 0;

      const order = await createServiceOrder({
        customer_id: customerId,
        address_id: addressId || undefined,
        equipment_id: equipmentId || undefined,
        appointment_id: paramAppointmentId || undefined,
        category,
        problem_description: problemDescription.trim(),
        is_cleaning: isCleaning,
        technician_name: technicianName.trim() || undefined,
        scheduled_date: scheduledDate || undefined,
        total_services: totalServices,
        total_materials: totalMaterials,
        discount: discountVal,
        total_amount: grandTotal,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        amount_paid: paidVal,
        items: items.map((i) => ({
          item_type: i.item_type,
          catalog_service_id: i.catalog_service_id,
          name: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price,
        })),
      });

      if (order) {
        router.push(`/ordens/${order.id}`);
      } else {
        router.push('/ordens');
      }
    } catch (err: any) {
      console.error('Erro ao criar ordem de serviço:', err);
      setErrorMsg(err.message || 'Falha ao salvar Ordem de Serviço.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/ordens"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0754D8] hover:border-[#0754D8] transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#103778] tracking-tight">
            Nova Ordem de Serviço
          </h1>
          <p className="text-xs text-slate-500">
            Abertura de O.S. com checklist técnico e itens de serviço
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
            <span>Cliente e Local de Atendimento</span>
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
                <option value="">Selecione um cliente...</option>
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
                  Endereço do Atendimento
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

        {/* SEÇÃO 2: TIPO DE SERVIÇO & EQUIPAMENTO */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#103778] flex items-center gap-2 mb-4">
            <ClipboardList className="w-4 h-4 text-[#0754D8]" />
            <span>Dados da Atividade</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Especialidade
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCategory('climatizacao');
                    setIsCleaning(true);
                  }}
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
                  onClick={() => {
                    setCategory('eletrica');
                    setIsCleaning(false);
                  }}
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

            {/* SELEÇÃO DO APARELHO (QUANDO CLIMATIZAÇÃO) */}
            {category === 'climatizacao' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ar-Condicionado Vinculado (Opcional)
                </label>
                <select
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="">Nenhum aparelho específico selecionado</option>
                  {selectedCustomer?.equipment?.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.environment} — {eq.brand || 'Split'} {eq.btu_capacity ? `(${eq.btu_capacity} BTU)` : ''}
                    </option>
                  ))}
                </select>

                {/* CHECKBOX CRUCIAL: HIGIENIZAÇÃO / LIMPEZA */}
                <div className="mt-3 p-3.5 rounded-xl bg-[#EAF3FF] border border-[#0754D8]/20 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="isCleaningCheck"
                    checked={isCleaning}
                    onChange={(e) => setIsCleaning(e.target.checked)}
                    className="w-4 h-4 text-[#0754D8] rounded border-slate-300 focus:ring-[#0754D8] mt-0.5"
                  />
                  <label htmlFor="isCleaningCheck" className="text-xs text-[#103778] cursor-pointer">
                    <span className="font-bold block">
                      Este serviço inclui higienização / limpeza preventiva de ar-condicionado?
                    </span>
                    <span className="text-slate-600 block mt-0.5">
                      Ao concluir esta O.S., a data de última limpeza do aparelho será atualizada automaticamente e a próxima manutenção será recalculada no radar!
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição do Problema / Serviço Solicitado *
              </label>
              <textarea
                rows={2}
                required
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Ex: Ar não gela direito e apresenta mau cheiro; solicitação de limpeza completa e verificação de gás."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data Prevista do Atendimento
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Técnico Responsável
                </label>
                <input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: ITENS E VALORES DA O.S. */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#103778] flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#0754D8]" />
              <span>Itens de Serviços e Materiais</span>
            </h2>
          </div>

          {/* Adicionar Rápido do Catálogo */}
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
              <option value="">Selecione um serviço do catálogo para adicionar à O.S....</option>
              {catalog
                .filter((s) => s.category === category)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    + {s.name} — {formatCurrency(s.default_price)}
                  </option>
                ))}
            </select>
          </div>

          {/* Tabela de Itens Adicionados */}
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
              Nenhum item adicionado ainda. Escolha no catálogo acima ou preencha o valor diretamente.
            </div>
          )}

          {/* TOTAIS E DESCONTO */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal dos Serviços:</span>
              <span className="font-bold">{formatCurrency(totalServices)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Desconto Autorizado (R$):</span>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-28 px-2 py-1 rounded-lg border border-slate-200 text-right font-bold text-red-600"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-extrabold text-[#103778]">
              <span>Valor Total da O.S.:</span>
              <span className="text-xl text-[#0754D8]">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* CONDIÇÕES FINANCEIRAS & PAGAMENTO */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-[#103778] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#0754D8]" />
              <span>Condições de Pagamento & Faturamento</span>
            </h3>
            <span className="text-[11px] font-semibold text-[#0754D8] bg-[#EAF3FF] px-2.5 py-0.5 rounded-lg flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" />
              Sincroniza com Fluxo de Caixa
            </span>
          </div>

          {/* Seletores rápidos de situação de pagamento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Situação do Pagamento na Abertura
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPaymentStatus('pending');
                  setAmountPaid('0');
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  paymentStatus === 'pending'
                    ? 'bg-red-50/90 border-red-400 text-red-900 ring-2 ring-red-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="font-extrabold text-xs block">Pendente (A Receber)</span>
                  <span className="text-[10px] text-red-700">A pagar no atendimento</span>
                </div>
                {paymentStatus === 'pending' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentStatus('paid');
                  setAmountPaid(String(grandTotal));
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  paymentStatus === 'paid'
                    ? 'bg-emerald-50/90 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="font-extrabold text-xs block">Já Pago (Quitado)</span>
                  <span className="text-[10px] text-emerald-700">Entrada integral no Caixa</span>
                </div>
                {paymentStatus === 'paid' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentStatus('partial');
                  if (!amountPaid || amountPaid === '0') {
                    setAmountPaid(String(Math.round(grandTotal / 2)));
                  }
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  paymentStatus === 'partial'
                    ? 'bg-amber-50/90 border-amber-400 text-amber-900 ring-2 ring-amber-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="font-extrabold text-xs block">Pagamento Parcial</span>
                  <span className="text-[10px] text-amber-700">Entrada / Sinal pago</span>
                </div>
                {paymentStatus === 'partial' && <Clock className="w-4 h-4 text-amber-600 shrink-0" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-[#0754D8]"
              >
                <option value="Pix">Pix (Instantâneo)</option>
                <option value="Dinheiro">Dinheiro em Espécie</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Transferência Bancária">Transferência Bancária</option>
                <option value="Boleto Bancário">Boleto Bancário</option>
                <option value="A Combinar">A Combinar / Faturado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor Efetivamente Pago na Abertura (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold text-emerald-700 bg-white focus:ring-2 focus:ring-[#0754D8]"
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            {paymentStatus === 'paid'
              ? '✓ O valor total será lançado imediatamente como receita paga no Fluxo de Caixa da MG Climatização.'
              : paymentStatus === 'partial'
              ? '✓ O valor pago entrará nas receitas do caixa e a diferença constará em "A Receber".'
              : '✓ O valor total constará como pendência em "A Receber" no Fluxo de Caixa até o pagamento ser registrado.'}
          </p>
        </div>

        {/* BOTÕES DE SUBMISSÃO */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/ordens"
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
            <span>{saving ? 'Criando O.S...' : 'Abrir Ordem de Serviço'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NovaOrdemPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="py-20 text-center text-slate-400">Carregando...</div>}>
        <NovaOrdemContent />
      </Suspense>
    </AppLayout>
  );
}

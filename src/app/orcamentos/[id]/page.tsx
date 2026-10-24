'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  Users,
  MapPin,
  AirVent,
  Zap,
  Phone,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  DollarSign,
  ClipboardList,
  Sparkles,
  AlertTriangle,
  Send,
  XCircle,
  Edit2,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  getQuoteById,
  updateQuote,
  updateQuoteStatus,
  convertQuoteToServiceOrder,
  getCompanySettings,
} from '@/lib/api';
import { Quote, CompanySettings, QuoteStatus, QuoteItem } from '@/lib/types';
import {
  formatDate,
  formatCurrency,
  getWhatsAppLink,
  getGoogleMapsLink,
  formatQuoteStatus,
  formatEquipmentType,
} from '@/lib/formatters';
import { LogoMG } from '@/components/brand/LogoMG';

function OrcamentoDetalheContent() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [qData, compData] = await Promise.all([
        getQuoteById(quoteId),
        getCompanySettings(),
      ]);
      setQuote(qData);
      setCompany(compData);
    } catch (err) {
      console.error('Erro ao carregar orçamento:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (quoteId) {
      loadData();
    }
  }, [quoteId]);

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    if (!quote) return;
    await updateQuoteStatus(quote.id, newStatus);
    loadData();
  };

  const handleConvertToOrder = async () => {
    if (!quote) return;
    if (quote.service_order_id) {
      router.push(`/ordens/${quote.service_order_id}`);
      return;
    }

    try {
      setConverting(true);
      setErrorMsg(null);
      const newOrder = await convertQuoteToServiceOrder(quote.id);
      if (newOrder) {
        router.push(`/ordens/${newOrder.id}`);
      }
    } catch (err: any) {
      console.error('Erro ao converter orçamento:', err);
      setErrorMsg(err.message || 'Falha ao converter em Ordem de Serviço.');
    } finally {
      setConverting(false);
    }
  };

  // Estados de Edição da Proposta
  const [showEditModal, setShowEditModal] = useState(false);
  const [editValidUntil, setEditValidUntil] = useState('');
  const [editPaymentTerms, setEditPaymentTerms] = useState('');
  const [editWarrantyTerms, setEditWarrantyTerms] = useState('');
  const [editExecutionTime, setEditExecutionTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDiscount, setEditDiscount] = useState('0');
  const [editItems, setEditItems] = useState<
    Array<{
      id?: string;
      item_type: 'service' | 'material';
      name: string;
      quantity: number;
      unit_price: number;
    }>
  >([]);
  const [editSaving, setEditSaving] = useState(false);

  const handleOpenEditModal = () => {
    if (!quote) return;
    setEditValidUntil(quote.valid_until ? quote.valid_until.split('T')[0] : '');
    setEditPaymentTerms(quote.payment_terms || 'Pix, Dinheiro ou Cartão de Crédito');
    setEditWarrantyTerms(quote.warranty_terms || '90 dias de garantia sobre a mão de obra');
    setEditExecutionTime(quote.execution_time_estimate || '');
    setEditNotes(quote.notes || '');
    setEditDiscount(String(quote.discount || 0));
    setEditItems(
      quote.items && quote.items.length > 0
        ? quote.items.map((i) => ({
            id: i.id,
            item_type: i.item_type || 'service',
            name: i.name,
            quantity: i.quantity || 1,
            unit_price: i.unit_price || 0,
          }))
        : [
            {
              item_type: 'service',
              name: 'Serviço de Climatização',
              quantity: 1,
              unit_price: quote.subtotal || 0,
            },
          ]
    );
    setShowEditModal(true);
  };

  const handleAddItem = () => {
    setEditItems((prev) => [
      ...prev,
      { item_type: 'service', name: '', quantity: 1, unit_price: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setEditItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const calcEditSubtotal = () =>
    editItems.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);

  const calcEditTotal = () =>
    Math.max(0, calcEditSubtotal() - (parseFloat(editDiscount) || 0));

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) return;

    try {
      setEditSaving(true);
      await updateQuote(quote.id, {
        valid_until: editValidUntil ? new Date(editValidUntil).toISOString() : quote.valid_until,
        payment_terms: editPaymentTerms.trim(),
        warranty_terms: editWarrantyTerms.trim(),
        execution_time_estimate: editExecutionTime.trim() || undefined,
        notes: editNotes.trim() || undefined,
        discount: parseFloat(editDiscount) || 0,
        items: editItems.map((i) => ({
          id: i.id,
          item_type: i.item_type,
          description: i.name,
          name: i.name,
          quantity: Number(i.quantity) || 1,
          unit_price: Number(i.unit_price) || 0,
          total_price: (Number(i.quantity) || 1) * (Number(i.unit_price) || 0),
        })) as any,
      });

      setShowEditModal(false);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao salvar proposta:', err);
      alert(err.message || 'Erro ao atualizar orçamento.');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-slate-400 text-sm">Carregando proposta...</div>
      </AppLayout>
    );
  }

  if (!quote) {
    return (
      <AppLayout>
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-700">Orçamento não encontrado</h2>
          <Link
            href="/orcamentos"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#0754D8] bg-[#EAF3FF] px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Orçamentos</span>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const statusInfo = formatQuoteStatus(quote.status);
  const phone = quote.customer?.whatsapp || quote.customer?.phone;

  // Mensagem elegante para envio no WhatsApp
  const waMsg = `Olá, ${quote.customer?.name}! Tudo bem?\n\nSegue a proposta formal da *MG Climatização*:\n*Orçamento:* ${quote.code}\n*Valor Total:* ${formatCurrency(quote.total_amount)}\n*Condições:* ${quote.payment_terms || 'A combinar'}\n*Validade:* até ${formatDate(quote.valid_until)}\n\nFicamos à disposição para agendarmos o serviço!`;
  const waLink = getWhatsAppLink(phone, waMsg);

  return (
    <AppLayout>
      {/* BARRA SUPERIOR DE AÇÕES (OCULTA NA IMPRESSÃO) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/orcamentos"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0754D8] hover:border-[#0754D8] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-extrabold text-[#0754D8] font-mono tracking-tight">
                {quote.code}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-md border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
              >
                {statusInfo.label}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase">
                • {quote.category === 'climatizacao' ? 'Climatização' : 'Elétrica'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Emitido em {formatDate(quote.issue_date)} • Válido até {formatDate(quote.valid_until)}
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 flex-wrap">
          {phone && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleStatusChange('sent')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar WhatsApp</span>
            </a>
          )}

          <button
            onClick={handleOpenEditModal}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#0754D8] border border-blue-200 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Edit2 className="w-4 h-4 text-[#0754D8]" />
            <span>Editar Proposta</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir / PDF</span>
          </button>

          {/* CONVERSÃO EM ORDEM DE SERVIÇO */}
          {quote.service_order_id ? (
            <Link
              href={`/ordens/${quote.service_order_id}`}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Ver O.S. Gerada</span>
            </Link>
          ) : (
            <button
              onClick={handleConvertToOrder}
              disabled={converting}
              className="flex items-center gap-1.5 bg-[#0754D8] hover:bg-[#0642aa] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-60"
            >
              <ClipboardList className="w-4 h-4" />
              <span>{converting ? 'Convertendo...' : 'Aprovar e Gerar O.S.'}</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="print:hidden mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {/* CONTROLES DE STATUS (PRINT:HIDDEN) */}
      <div className="print:hidden bg-white p-3 rounded-2xl border border-slate-200/80 mb-6 flex items-center justify-between gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide shrink-0">
          Alterar Situação:
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleStatusChange('draft')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              quote.status === 'draft' ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            Rascunho
          </button>
          <button
            onClick={() => handleStatusChange('sent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              quote.status === 'sent' ? 'bg-blue-100 text-[#0754D8]' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            Enviado
          </button>
          <button
            onClick={() => handleStatusChange('awaiting_approval')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              quote.status === 'awaiting_approval' ? 'bg-amber-100 text-amber-800' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            Aguardando Aprovação
          </button>
          <button
            onClick={() => handleStatusChange('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              quote.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            Aprovado
          </button>
          <button
            onClick={() => handleStatusChange('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              quote.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            Recusado
          </button>
        </div>
      </div>

      {/* FOLHA DE ORÇAMENTO FORMAL (OTIMIZADA PARA IMPRESSÃO EM PDF) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-10 shadow-xs max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">
        {/* CABEÇALHO DA EMPRESA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <LogoMG size="md" />
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
            <p className="font-bold text-sm text-[#103778]">{company?.name || 'MG Climatização'}</p>
            <p>{company?.slogan || 'Refrigeração, Climatização e Elétrica Residencial'}</p>
            <p>{company?.address || company?.city_state || 'Tangará - RN'} • Tel/WhatsApp: {company?.phone || company?.whatsapp || '(84) 99461-3185'}</p>
            <p className="font-mono text-[11px] text-[#0754D8] font-bold">Proposta Nº {quote.code}</p>
          </div>
        </div>

        {/* DADOS DO CLIENTE & PROPOSTA */}
        <div className="py-6 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Dados do Cliente
            </span>
            <p className="font-bold text-sm text-[#103778]">{quote.customer?.name}</p>
            {quote.customer?.phone && (
              <p className="text-slate-600 mt-0.5">Contato: {quote.customer.phone}</p>
            )}
            {quote.address && (
              <p className="text-slate-600 mt-0.5">
                Local: {quote.address.street}, {quote.address.number} - {quote.address.neighborhood} ({quote.address.city}/{quote.address.state})
              </p>
            )}
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Validade & Condições
            </span>
            <p className="text-slate-700">
              Data de Emissão: <span className="font-bold">{formatDate(quote.issue_date)}</span>
            </p>
            <p className="text-slate-700">
              Válido até: <span className="font-bold text-red-600">{formatDate(quote.valid_until)}</span>
            </p>
            {quote.execution_time_estimate && (
              <p className="text-slate-700">
                Prazo de Execução: <span className="font-semibold">{quote.execution_time_estimate}</span>
              </p>
            )}
          </div>
        </div>

        {/* TABELA DE ITENS DO ORÇAMENTO */}
        <div className="py-6 border-b border-slate-200">
          <h3 className="font-bold text-sm text-[#103778] mb-3 uppercase tracking-wide">
            Discriminação de Serviços e Materiais
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5">Item / Descrição</th>
                  <th className="py-2.5 text-center w-20">Qtd</th>
                  <th className="py-2.5 text-right w-28">Preço Unit.</th>
                  <th className="py-2.5 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.items && quote.items.length > 0 ? (
                  quote.items.map((i, idx) => (
                    <tr key={i.id || idx}>
                      <td className="py-3">
                        <span className="font-bold text-slate-800 block">{i.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{i.item_type}</span>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-700">{i.quantity}</td>
                      <td className="py-3 text-right text-slate-600">{formatCurrency(i.unit_price)}</td>
                      <td className="py-3 text-right font-extrabold text-[#103778]">
                        {formatCurrency(i.total_price)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                      Nenhum item adicionado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TOTALIZADOR */}
          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col items-end space-y-1 text-xs">
            <div className="flex justify-between w-64 text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.discount > 0 && (
              <div className="flex justify-between w-64 text-red-600 font-semibold">
                <span>Desconto Comercial:</span>
                <span>- {formatCurrency(quote.discount)}</span>
              </div>
            )}
            <div className="flex justify-between w-64 pt-2 border-t border-slate-200 text-sm font-extrabold text-[#103778]">
              <span>Valor Total da Proposta:</span>
              <span className="text-base text-[#0754D8]">{formatCurrency(quote.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* CONDIÇÕES COMERCIAIS & GARANTIA */}
        <div className="py-6 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Formas e Condições de Pagamento
            </span>
            <p className="font-semibold text-slate-700">
              {quote.payment_terms || 'Pix, Dinheiro ou Cartão de Crédito'}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Termos de Garantia
            </span>
            <p className="font-semibold text-slate-700">
              {quote.warranty_terms || '90 dias de garantia sobre a mão de obra'}
            </p>
          </div>

          {quote.notes && (
            <div className="sm:col-span-2 pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Observações
              </span>
              <p className="text-slate-600 italic">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* ASSINATURAS (PRINT ONLY) */}
        <div className="hidden print:grid grid-cols-2 gap-12 pt-16 text-center text-xs text-slate-600">
          <div>
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
              MG Climatização
            </div>
            <p className="text-[10px] text-slate-400">Responsável Técnico</p>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
              {quote.customer?.name}
            </div>
            <p className="text-[10px] text-slate-400">De acordo com a proposta</p>
          </div>
        </div>
      </div>

      {/* MODAL EDITAR PROPOSTA */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#103778]">
                  Editar Orçamento {quote.code}
                </h3>
                <p className="text-xs text-slate-500">
                  Modifique itens, condições comerciais, garantia e prazos da proposta
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-4">
              {/* ITENS DO ORÇAMENTO */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Itens / Serviços da Proposta
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs font-bold text-[#0754D8] hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                    >
                      <select
                        value={item.item_type}
                        onChange={(e) => handleItemChange(idx, 'item_type', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-semibold text-slate-700 w-full sm:w-28"
                      >
                        <option value="service">Serviço</option>
                        <option value="material">Material / Peça</option>
                      </select>

                      <input
                        type="text"
                        required
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        placeholder="Descrição do serviço ou material"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white flex-1 w-full"
                      />

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="w-16">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            placeholder="Qtd"
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center bg-white font-semibold"
                          />
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            placeholder="Preço Unit."
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-right bg-white font-bold text-[#0754D8]"
                          />
                        </div>

                        <span className="text-xs font-bold text-slate-700 w-24 text-right hidden sm:block">
                          {formatCurrency((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={editItems.length <= 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                          title="Remover Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONDIÇÕES COMERCIAIS & PRAZOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Válido Até
                  </label>
                  <input
                    type="date"
                    required
                    value={editValidUntil}
                    onChange={(e) => setEditValidUntil(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prazo Estimado de Execução
                  </label>
                  <input
                    type="text"
                    value={editExecutionTime}
                    onChange={(e) => setEditExecutionTime(e.target.value)}
                    placeholder="Ex: 1 dia útil, 4 horas, A combinar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Formas e Condições de Pagamento
                  </label>
                  <input
                    type="text"
                    required
                    value={editPaymentTerms}
                    onChange={(e) => setEditPaymentTerms(e.target.value)}
                    placeholder="Ex: Pix, 50% entrada + 50% entrega"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Termos de Garantia
                  </label>
                  <input
                    type="text"
                    required
                    value={editWarrantyTerms}
                    onChange={(e) => setEditWarrantyTerms(e.target.value)}
                    placeholder="Ex: 90 dias sobre mão de obra"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Desconto Especial (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações Internas / Técnicas
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Anotações adicionais da proposta"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700"
                  />
                </div>
              </div>

              {/* RESUMO DOS VALORES RECALCULADOS */}
              <div className="bg-[#EAF3FF] p-3.5 rounded-xl flex items-center justify-between text-xs border border-blue-200">
                <div className="space-y-0.5">
                  <div className="text-slate-600">
                    Subtotal: <strong className="text-slate-800">{formatCurrency(calcEditSubtotal())}</strong>
                  </div>
                  {parseFloat(editDiscount) > 0 && (
                    <div className="text-red-600 font-semibold">
                      Desconto: - {formatCurrency(parseFloat(editDiscount))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#0754D8] font-bold uppercase block">Total Atualizado</span>
                  <span className="text-base font-extrabold text-[#103778]">
                    {formatCurrency(calcEditTotal())}
                  </span>
                </div>
              </div>

              {/* BOTÕES */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={editSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0754D8] hover:bg-[#0642aa] text-white shadow-md disabled:opacity-60 flex items-center gap-1.5"
                >
                  {editSaving ? 'Salvando...' : 'Salvar Proposta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function OrcamentoDetalhePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Carregando orçamento...</div>}>
      <OrcamentoDetalheContent />
    </Suspense>
  );
}

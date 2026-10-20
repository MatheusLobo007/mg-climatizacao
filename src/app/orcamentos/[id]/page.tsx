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
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  getQuoteById,
  updateQuoteStatus,
  convertQuoteToServiceOrder,
  getCompanySettings,
} from '@/lib/api';
import { Quote, CompanySettings, QuoteStatus } from '@/lib/types';
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

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  AirVent,
  Zap,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getQuotes } from '@/lib/api';
import { Quote } from '@/lib/types';
import {
  formatDate,
  formatCurrency,
  formatQuoteStatus,
} from '@/lib/formatters';

export default function OrcamentosPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const data = await getQuotes();
      setQuotes(data);
    } catch (err) {
      console.error('Erro ao buscar orçamentos:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = quotes.filter((q) => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      const code = q.code.toLowerCase();
      const client = q.customer?.name?.toLowerCase() || '';
      return code.includes(term) || client.includes(term);
    }
    return true;
  });

  return (
    <AppLayout>
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0754D8] uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Propostas Comerciais</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#103778] tracking-tight mt-1">
            Orçamentos
          </h1>
          <p className="text-sm text-slate-500">
            Crie propostas com validade, envie via WhatsApp e converta em O.S. com 1 clique
          </p>
        </div>

        <Link
          href="/orcamentos/novo"
          className="inline-flex items-center justify-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Orçamento</span>
        </Link>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código (ORC-XXXX) ou nome do cliente..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
          />
        </div>

        {/* Abas de Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-[#103778] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos ({quotes.length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'draft'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Rascunhos
          </button>
          <button
            onClick={() => setStatusFilter('awaiting_approval')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'awaiting_approval'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            Aguardando Aprovação
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Aprovados
          </button>
        </div>
      </div>

      {/* LISTAGEM DE ORÇAMENTOS */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Carregando orçamentos...</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3.5">
          {filtered.map((q) => {
            const statusInfo = formatQuoteStatus(q.status);
            const isClima = q.category === 'climatizacao';

            return (
              <Link
                key={q.id}
                href={`/orcamentos/${q.id}`}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-[#0754D8]/40 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 block"
              >
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-extrabold text-sm text-[#0754D8] font-mono tracking-tight bg-[#EAF3FF] px-2.5 py-1 rounded-lg">
                      {q.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                    >
                      {statusInfo.label}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isClima ? 'text-blue-700 bg-blue-50' : 'text-amber-800 bg-amber-50'
                      }`}
                    >
                      {isClima ? <AirVent className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                      <span>{isClima ? 'Climatização' : 'Elétrica'}</span>
                    </span>
                    {q.service_order_id && (
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                        Convertido em O.S.
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-[#103778] mt-2">
                    {q.customer?.name}
                  </h3>

                  <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span>Emissão: {formatDate(q.issue_date)}</span>
                    <span className="font-medium text-slate-600">
                      • Válido até: <span className="text-slate-800 font-bold">{formatDate(q.valid_until)}</span>
                    </span>
                    {q.items && q.items.length > 0 && (
                      <span>• {q.items.length} {q.items.length === 1 ? 'item' : 'itens'}</span>
                    )}
                  </div>
                </div>

                {/* Bloco de Valor e Ação */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-base sm:text-lg font-extrabold text-[#103778] block">
                      {formatCurrency(q.total_amount)}
                    </span>
                    {q.discount > 0 && (
                      <span className="text-[10px] text-red-600 font-bold block">
                        Desconto: {formatCurrency(q.discount)}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-[#0754D8] hover:underline inline-flex items-center gap-1">
                    <span>Ver Proposta</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhum orçamento cadastrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Gere orçamentos formais com validade para apresentar ao cliente e fechar mais serviços.
          </p>
          <Link
            href="/orcamentos/novo"
            className="inline-flex items-center gap-2 mt-4 bg-[#0754D8] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Primeiro Orçamento</span>
          </Link>
        </div>
      )}
    </AppLayout>
  );
}

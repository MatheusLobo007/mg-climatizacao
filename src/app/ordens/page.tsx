'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  Search,
  AirVent,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter,
  Trash2,
  Edit2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getServiceOrders, deleteServiceOrder } from '@/lib/api';
import { ServiceOrder } from '@/lib/types';
import {
  formatDate,
  formatCurrency,
  formatOrderStatus,
} from '@/lib/formatters';

export default function OrdensPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [itemToDelete, setItemToDelete] = useState<ServiceOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getServiceOrders();
      setOrders(data);
    } catch (err) {
      console.error('Erro ao buscar ordens de serviço:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await deleteServiceOrder(itemToDelete.id);
      setOrders((prev) => prev.filter((o) => o.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir ordem de serviço.');
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = orders.filter((ord) => {
    if (statusFilter !== 'all' && ord.status !== statusFilter) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      const code = ord.code.toLowerCase();
      const client = ord.customer?.name?.toLowerCase() || '';
      const desc = ord.problem_description?.toLowerCase() || '';
      return code.includes(term) || client.includes(term) || desc.includes(term);
    }
    return true;
  });

  return (
    <AppLayout>
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0754D8] uppercase tracking-wider">
            <ClipboardList className="w-4 h-4" />
            <span>Execução de Serviços</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#103778] tracking-tight mt-1">
            Ordens de Serviço (O.S.)
          </h1>
          <p className="text-sm text-slate-500">
            Acompanhe o status dos atendimentos, checklists técnicos e faturamento
          </p>
        </div>

        <Link
          href="/ordens/nova"
          className="inline-flex items-center justify-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Ordem de Serviço</span>
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
            placeholder="Buscar por código (OS-XXXX), cliente ou descrição..."
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
            Todas ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'open'
                ? 'bg-[#0754D8] text-white shadow-xs'
                : 'bg-white border border-blue-200 text-[#0754D8] hover:bg-blue-50'
            }`}
          >
            Abertas
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'in_progress'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            Em Atendimento
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Concluídas
          </button>
        </div>
      </div>

      {/* LISTAGEM DE ORDENS */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Carregando ordens de serviço...</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3.5">
          {filtered.map((ord) => {
            const statusInfo = formatOrderStatus(ord.status);
            const isClima = ord.category === 'climatizacao';

            return (
              <Link
                key={ord.id}
                href={`/ordens/${ord.id}`}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-[#0754D8]/40 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 block"
              >
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-extrabold text-sm text-[#0754D8] font-mono tracking-tight bg-[#EAF3FF] px-2.5 py-1 rounded-lg">
                      {ord.code}
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
                    {ord.is_cleaning && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                        Higienização
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-[#103778] mt-2">
                    {ord.customer?.name}
                  </h3>

                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {ord.problem_description || 'Serviço sob demanda'}
                  </p>

                  <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span>Criada: {formatDate(ord.created_at)}</span>
                    {ord.scheduled_date && (
                      <span>• Agendada: {formatDate(ord.scheduled_date)}</span>
                    )}
                    {ord.completed_at && (
                      <span className="text-emerald-700 font-semibold">
                        • Concluída: {formatDate(ord.completed_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bloco de Valor e Ação */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-base sm:text-lg font-extrabold text-[#103778] block">
                      {formatCurrency(ord.total_amount)}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider block ${
                        ord.payment_status === 'paid'
                          ? 'text-emerald-600'
                          : ord.payment_status === 'partial'
                          ? 'text-amber-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {ord.payment_status === 'paid'
                        ? 'Pago'
                        : ord.payment_status === 'partial'
                        ? 'Pago Parcial'
                        : 'Aguardando Pagamento'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/ordens/${ord.id}?edit=finance`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-slate-400 hover:text-[#0754D8] hover:bg-[#EAF3FF] rounded-lg transition-colors"
                      title="Editar O.S. & Financeiro"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setItemToDelete(ord);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir O.S."
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-[#0754D8] hover:underline inline-flex items-center gap-1 ml-1">
                      <span>Ver Ordem</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white p-8">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhuma ordem de serviço encontrada</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Crie sua primeira Ordem de Serviço para acompanhar checklist, serviços e pagamento.
          </p>
          <Link
            href="/ordens/nova"
            className="inline-flex items-center gap-2 mt-4 bg-[#0754D8] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Primeira O.S.</span>
          </Link>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-800 text-center">
              Excluir Ordem de Serviço?
            </h3>
            <p className="text-sm text-slate-500 text-center mt-2">
              Tem certeza que deseja excluir permanentemente a O.S.{' '}
              <span className="font-mono font-bold text-[#0754D8]">{itemToDelete.code}</span> do cliente{' '}
              <strong className="text-slate-700">{itemToDelete.customer?.name}</strong>?
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-3 text-center">
              Aviso: Itens vinculados, checklists, fotos e lançamentos financeiros desta O.S. serão removidos.
            </p>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <span>Excluindo...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

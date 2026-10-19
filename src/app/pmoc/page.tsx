'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  ShieldCheck,
  AirVent,
  AlertCircle,
  FileText,
  User,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getPMOCPlans, deletePMOCPlan } from '@/lib/api';
import { PMOCPlan } from '@/lib/types';
import { formatDate } from '@/lib/formatters';

export default function PMOCListPage() {
  const [plans, setPlans] = useState<PMOCPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [itemToDelete, setItemToDelete] = useState<PMOCPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await deletePMOCPlan(itemToDelete.id);
      setItemToDelete(null);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao excluir PMOC:', err);
      alert(err.message || 'Erro ao excluir plano PMOC.');
    } finally {
      setDeleting(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getPMOCPlans();
      setPlans(data);
    } catch (err) {
      console.error('Erro ao buscar planos PMOC:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPlans = plans.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const code = p.code.toLowerCase();
    const estab = p.establishment_name.toLowerCase();
    const cust = p.customer?.name?.toLowerCase() || '';
    return code.includes(q) || estab.includes(q) || cust.includes(q);
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0754D8] bg-[#EAF3FF] px-2.5 py-1 rounded-md">
                Lei Federal 13.589/2018
              </span>
              <span className="text-xs font-semibold text-slate-500">Portaria MS 3.523</span>
            </div>
            <h1 className="text-2xl font-bold text-[#103778] flex items-center gap-2.5 mt-1">
              <FileSpreadsheet className="w-6 h-6 text-[#0754D8]" />
              <span>Gestão de PMOC Legal</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Plano de Manutenção, Operação e Controle obrigatório para empresas, clínicas e comércios climatizados
            </p>
          </div>

          <Link
            href="/pmoc/novo"
            className="inline-flex items-center justify-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white py-2.5 px-4 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Plano PMOC</span>
          </Link>
        </div>

        {/* INFORMAÇÃO REGULATÓRIA */}
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-[#0754D8] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 space-y-1">
            <h4 className="font-bold text-sm text-[#103778]">
              Conformidade ANVISA e Fiscalização Municipal
            </h4>
            <p>
              O PMOC é exigência legal em todo o território nacional para edifícios de uso público e coletivo com climatização. Com a MG Climatização, seus clientes corporativos contam com laudos técnicos estruturados, inventário de carga térmica e rotinas periódicas de higienização.
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código (PMOC-2026-XXXX), estabelecimento ou cliente..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-hidden focus:border-[#0754D8]"
          />
        </div>

        {/* LIST */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Carregando planos PMOC...</div>
        ) : filteredPlans.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#103778]">Nenhum plano PMOC registrado</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Crie contratos corporativos de PMOC para clínicas médicas, escritórios e lojas com visitas mensais garantidas.
            </p>
            <Link
              href="/pmoc/novo"
              className="mt-4 inline-flex items-center gap-2 bg-[#0754D8] text-white py-2 px-4 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Primeiro PMOC</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map((plan) => {
              const eqCount = plan.equipment_links?.length || 0;
              return (
                <div
                  key={plan.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-[#0754D8]/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-[#0754D8] bg-[#EAF3FF] px-2.5 py-1 rounded-md">
                        {plan.code}
                      </span>

                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Ativo • {plan.periodicity}
                      </span>
                    </div>

                    <h3 className="font-bold text-[#103778] text-base mt-2">
                      {plan.establishment_name}
                    </h3>

                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{plan.activity_type}</span>
                    </p>

                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cliente: {plan.customer?.name}</span>
                    </p>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Capacidade Total:</span>
                        <span className="font-bold text-[#103778]">
                          {plan.total_refrigeration_capacity_btu.toLocaleString()} BTUs
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Aparelhos no PMOC:</span>
                        <span className="font-semibold text-slate-700">
                          {eqCount} {eqCount === 1 ? 'unidade' : 'unidades'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Validade Até:</span>
                        <span className="font-bold text-emerald-700">
                          {formatDate(plan.valid_until)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex gap-2">
                    <Link
                      href={`/pmoc/${plan.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#0754D8] hover:bg-[#0642aa] text-white py-2 px-3 rounded-xl text-xs font-semibold transition-all shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Visualizar Laudo PMOC</span>
                    </Link>
                    <button
                      onClick={() => setItemToDelete(plan)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all active:scale-95"
                      title="Excluir Plano PMOC"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
        {itemToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 text-red-600 mb-3">
                <div className="p-3 bg-red-50 rounded-xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Excluir Plano PMOC</h3>
                  <p className="text-xs text-slate-500">Esta ação não poderá ser desfeita</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 my-4">
                Tem certeza que deseja excluir o plano PMOC <strong className="text-slate-900">{itemToDelete.code}</strong> do estabelecimento <strong className="text-slate-900">{itemToDelete.establishment_name}</strong>?
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {deleting ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

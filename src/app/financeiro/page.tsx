'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Fuel,
  Wrench,
  Utensils,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  X,
  FileText,
  AlertCircle,
  Building,
  Trash2,
  BarChart3,
  Percent,
  RotateCcw,
  Edit2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  getFinancialTransactions,
  getFinancialSummary,
  createFinancialTransaction,
  updateFinancialTransaction,
  deleteFinancialTransaction,
} from '@/lib/api';
import {
  FinancialTransaction,
  FinancialTransactionType,
  FinancialCategory,
  FinancialPaymentMethod,
} from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros de Período
  const [periodPreset, setPeriodPreset] = useState<'month' | 'today' | 'week' | 'last30' | 'year' | 'custom' | 'all'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtros de Tipo e Categoria
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Modal de Nova Transação
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal de Exclusão
  const [itemToDelete, setItemToDelete] = useState<FinancialTransaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal de Edição de Transação
  const [editingTx, setEditingTx] = useState<FinancialTransaction | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    type: FinancialTransactionType;
    category: FinancialCategory;
    description: string;
    amount: number;
    payment_method: FinancialPaymentMethod;
    status: 'paid' | 'pending' | 'cancelled';
    transaction_date: string;
    notes: string;
  }>({
    type: 'expense',
    category: 'combustivel',
    description: '',
    amount: 0,
    payment_method: 'pix',
    status: 'paid',
    transaction_date: '',
    notes: '',
  });

  const handleOpenEdit = (tx: FinancialTransaction) => {
    setEditingTx(tx);
    setEditFormData({
      type: tx.type || 'expense',
      category: tx.category || 'outros',
      description: tx.description || '',
      amount: tx.amount || 0,
      payment_method: tx.payment_method || 'pix',
      status: tx.status || 'paid',
      transaction_date: tx.transaction_date ? tx.transaction_date.split('T')[0] : '',
      notes: tx.notes || '',
    });
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !editFormData.description.trim() || editFormData.amount <= 0) return;

    setEditSubmitting(true);
    try {
      await updateFinancialTransaction(editingTx.id, {
        ...editFormData,
        amount: Number(editFormData.amount),
      });
      setEditingTx(null);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao atualizar transação:', err);
      alert(err.message || 'Erro ao salvar alterações no lançamento.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const [formData, setFormData] = useState<{
    type: FinancialTransactionType;
    category: FinancialCategory;
    description: string;
    amount: number;
    payment_method: FinancialPaymentMethod;
    status: 'paid' | 'pending';
    transaction_date: string;
    notes: string;
  }>({
    type: 'expense',
    category: 'combustivel',
    description: '',
    amount: 0,
    payment_method: 'pix',
    status: 'paid',
    transaction_date: '',
    notes: '',
  });

  // Configuração inicial de datas
  const applyPresetDates = (preset: string) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'week') {
      const dayOfWeek = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'last30') {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const trans = await getFinancialTransactions();
      setTransactions(trans);
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyPresetDates('month');
    setFormData((prev) => ({
      ...prev,
      transaction_date: new Date().toISOString().split('T')[0],
    }));
    loadData();
  }, []);

  const handlePresetClick = (preset: any) => {
    setPeriodPreset(preset);
    applyPresetDates(preset);
  };

  const handleClearFilters = () => {
    setPeriodPreset('month');
    applyPresetDates('month');
    setTypeFilter('all');
    setCategoryFilter('all');
    setSearch('');
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || formData.amount <= 0) return;

    setSubmitting(true);
    try {
      await createFinancialTransaction({
        ...formData,
        amount: Number(formData.amount),
      });
      setShowModal(false);
      setFormData({
        type: 'expense',
        category: 'combustivel',
        description: '',
        amount: 0,
        payment_method: 'pix',
        status: 'paid',
        transaction_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      await loadData();
    } catch (err) {
      console.error('Erro ao lançar transação:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteFinancialTransaction(itemToDelete.id);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Erro ao excluir transação:', err);
    } finally {
      setDeleting(false);
    }
  };

  const categoryLabels: Record<FinancialCategory, { label: string; icon: any; color: string }> = {
    combustivel: { label: 'Combustível / Rota', icon: Fuel, color: 'bg-amber-500' },
    ferramentas: { label: 'Ferramentas & Acessórios', icon: Wrench, color: 'bg-blue-500' },
    refeicao: { label: 'Alimentação & Refeição', icon: Utensils, color: 'bg-orange-500' },
    insumos: { label: 'Insumos & Peças', icon: Package, color: 'bg-indigo-500' },
    servico_os: { label: 'Receita de O.S.', icon: CheckCircle2, color: 'bg-emerald-500' },
    prolabore: { label: 'Pró-Labore / Retirada', icon: DollarSign, color: 'bg-purple-500' },
    aluguel_oficina: { label: 'Oficina / Instalações', icon: Building, color: 'bg-slate-500' },
    energia_agua: { label: 'Energia / Água / Net', icon: Layers, color: 'bg-cyan-500' },
    outros: { label: 'Outras Operações', icon: FileText, color: 'bg-slate-400' },
  };

  // Filtragem Dinâmica
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Filtro de Data
      if (startDate && t.transaction_date < startDate) return false;
      if (endDate && t.transaction_date > endDate) return false;

      // Filtro de Tipo
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Filtro de Categoria
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      // Busca por texto
      if (search.trim()) {
        const q = search.toLowerCase();
        const desc = t.description.toLowerCase();
        const client = t.customer?.name?.toLowerCase() || '';
        return desc.includes(q) || client.includes(q);
      }
      return true;
    });
  }, [transactions, startDate, endDate, typeFilter, categoryFilter, search]);

  // Resumo Métrico Dinâmico Calculado a Partir do Período Filtrado
  const periodSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let pending = 0;
    const catExpenses: Record<string, number> = {};

    filteredTransactions.forEach((t) => {
      const val = Number(t.amount || 0);
      if (t.type === 'income') {
        if (t.status === 'paid') {
          income += val;
        } else {
          pending += val;
        }
      } else if (t.type === 'expense') {
        if (t.status === 'paid') {
          expense += val;
          catExpenses[t.category] = (catExpenses[t.category] || 0) + val;
        }
      }
    });

    const net = income - expense;
    const margin = income > 0 ? Math.round((net / income) * 100) : 0;

    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: net,
      pendingReceivables: pending,
      profitMargin: margin,
      categoryExpenses: catExpenses,
    };
  }, [filteredTransactions]);

  // Dados para o Gráfico de Evolução por Dia
  const chartDailyData = useMemo(() => {
    const dailyMap: Record<string, { date: string; income: number; expense: number }> = {};

    filteredTransactions.forEach((t) => {
      const d = t.transaction_date;
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, income: 0, expense: 0 };
      }
      const val = Number(t.amount || 0);
      if (t.type === 'income' && t.status === 'paid') {
        dailyMap[d].income += val;
      } else if (t.type === 'expense' && t.status === 'paid') {
        dailyMap[d].expense += val;
      }
    });

    // Ordenar cronologicamente e pegar até os últimos 10 dias com movimentação
    const sorted = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-10);
  }, [filteredTransactions]);

  const maxChartValue = useMemo(() => {
    if (chartDailyData.length === 0) return 100;
    const maxVal = Math.max(
      ...chartDailyData.map((d) => Math.max(d.income, d.expense)),
      100
    );
    return maxVal;
  }, [chartDailyData]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#103778] flex items-center gap-2.5">
              <DollarSign className="w-6 h-6 text-[#0754D8]" />
              <span>Controle Financeiro & Fluxo de Caixa</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Histórico de entradas e saídas, filtros por período e análise de lucratividade
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  type: 'expense',
                  category: 'combustivel',
                  description: '',
                  amount: 0,
                }));
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 px-3.5 rounded-xl font-semibold text-xs transition-all shadow-xs active:scale-95"
            >
              <TrendingDown className="w-4 h-4" />
              <span>Nova Despesa</span>
            </button>

            <button
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  type: 'income',
                  category: 'servico_os',
                  description: '',
                  amount: 0,
                }));
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3.5 rounded-xl font-semibold text-xs transition-all shadow-xs active:scale-95"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Nova Receita</span>
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS DE PERÍODO & ATALHOS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Atalhos Rápidos */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'today', label: 'Hoje' },
                { id: 'week', label: 'Esta Semana' },
                { id: 'month', label: 'Este Mês' },
                { id: 'last30', label: 'Últimos 30 Dias' },
                { id: 'year', label: 'Ano Atual' },
                { id: 'all', label: 'Todos' },
                { id: 'custom', label: 'Personalizado' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetClick(p.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all border ${
                    periodPreset === p.id
                      ? 'bg-[#103778] text-white border-[#103778] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Inputs de Data Início / Fim */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                <span className="text-slate-400 font-medium">De:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPeriodPreset('custom');
                  }}
                  className="bg-transparent font-semibold text-slate-700 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                <span className="text-slate-400 font-medium">Até:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPeriodPreset('custom');
                  }}
                  className="bg-transparent font-semibold text-slate-700 focus:outline-hidden"
                />
              </div>

              {/* Botão de Limpar Filtro */}
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all font-semibold active:scale-95 shadow-2xs shrink-0 cursor-pointer"
                title="Limpar filtros e restaurar período atual"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                <span>Limpar Filtro</span>
              </button>
            </div>
          </div>
        </div>

        {/* METRICS CARDS (CALCULADOS NO PERÍODO SELECIONADO) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Receitas */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold text-emerald-800">Receitas do Período</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-700">
                {loading ? '—' : formatCurrency(periodSummary.totalIncome)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">entradas recebidas</p>
            </div>
          </div>

          {/* Despesas */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold text-red-800">Despesas do Período</span>
              <div className="p-2 rounded-xl bg-red-50 text-red-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl sm:text-2xl font-extrabold text-red-700">
                {loading ? '—' : formatCurrency(periodSummary.totalExpense)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">combustível, peças, rotas</p>
            </div>
          </div>

          {/* Saldo Líquido */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold text-[#103778]">Saldo Líquido</span>
              <div className="p-2 rounded-xl bg-[#EAF3FF] text-[#0754D8]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span
                className={`text-xl sm:text-2xl font-extrabold ${
                  periodSummary.netBalance >= 0 ? 'text-[#103778]' : 'text-red-600'
                }`}
              >
                {loading ? '—' : formatCurrency(periodSummary.netBalance)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {periodSummary.profitMargin}% margem de lucro
              </p>
            </div>
          </div>

          {/* A Receber */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold text-amber-800">A Receber</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl sm:text-2xl font-extrabold text-amber-800">
                {loading ? '—' : formatCurrency(periodSummary.pendingReceivables)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">valores pendentes de O.S.</p>
            </div>
          </div>
        </div>

        {/* SEÇÃO GRÁFICA VISUAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico 1: Evolução Diária (Barras Comparativas) */}
          <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#103778] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0754D8]" />
                <span>Evolução do Fluxo de Caixa (Receitas vs Despesas)</span>
              </h3>
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 block"></span>
                  Receitas
                </span>
                <span className="flex items-center gap-1.5 text-red-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500 block"></span>
                  Despesas
                </span>
              </div>
            </div>

            {chartDailyData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                Nenhum lançamento no período para compor o gráfico.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100">
                  {chartDailyData.map((d) => {
                    const incHeight = Math.max(Math.round((d.income / maxChartValue) * 100), 4);
                    const expHeight = Math.max(Math.round((d.expense / maxChartValue) * 100), 4);
                    const dayLabel = d.date.split('-').slice(1).reverse().join('/');

                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center h-full justify-end group">
                        {/* Barras Lado a Lado */}
                        <div className="w-full flex items-end justify-center gap-1 h-36">
                          {/* Barra de Receita */}
                          <div
                            style={{ height: `${incHeight}%` }}
                            className="w-1/2 max-w-[20px] bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition-all relative cursor-pointer"
                            title={`Receita em ${formatDate(d.date)}: ${formatCurrency(d.income)}`}
                          ></div>
                          {/* Barra de Despesa */}
                          <div
                            style={{ height: `${expHeight}%` }}
                            className="w-1/2 max-w-[20px] bg-red-500 hover:bg-red-600 rounded-t-sm transition-all relative cursor-pointer"
                            title={`Despesa em ${formatDate(d.date)}: ${formatCurrency(d.expense)}`}
                          ></div>
                        </div>
                        {/* Data */}
                        <span className="text-[10px] text-slate-400 mt-2 font-mono group-hover:text-slate-800 transition-colors">
                          {dayLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Gráfico 2: Despesas por Categoria & Rentabilidade */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col gap-3.5">
            {/* Header com totalizador */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#103778] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0754D8]" />
                <span>Distribuição de Despesas</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                Total: {formatCurrency(periodSummary.totalExpense)}
              </span>
            </div>

            {/* Lista de Categorias de Despesas */}
            {Object.keys(periodSummary.categoryExpenses).length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Nenhuma despesa registrada neste período.
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(periodSummary.categoryExpenses)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 4)
                  .map(([cat, amount]) => {
                    const info = categoryLabels[cat as FinancialCategory] || {
                      label: cat,
                      icon: FileText,
                      color: 'bg-slate-500',
                    };
                    const Icon = info.icon;
                    const pct =
                      periodSummary.totalExpense > 0
                        ? Math.round((amount / periodSummary.totalExpense) * 100)
                        : 0;

                    return (
                      <div
                        key={cat}
                        className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1.5 hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Icon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[150px] font-semibold">{info.label}</span>
                          </span>
                          <span className="font-bold text-slate-800">
                            {formatCurrency(amount)}{' '}
                            <span className="text-[10px] text-slate-500 font-medium bg-white px-1.5 py-0.5 rounded-md border border-slate-200">
                              {pct}%
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${info.color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Painel de Saúde Financeira & Margem Líquida (posicionado logo abaixo das despesas) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#103778] flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-[#0754D8]" />
                  <span>Margem Líquida</span>
                </span>
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                    periodSummary.profitMargin >= 40
                      ? 'text-emerald-700 bg-emerald-100/80'
                      : periodSummary.profitMargin >= 15
                      ? 'text-blue-700 bg-blue-100/80'
                      : 'text-amber-700 bg-amber-100/80'
                  }`}
                >
                  {periodSummary.profitMargin}%{' '}
                  <span className="font-semibold text-[11px]">
                    {periodSummary.profitMargin >= 40
                      ? '• Lucro Alto'
                      : periodSummary.profitMargin >= 15
                      ? '• Saudável'
                      : '• Atenção'}
                  </span>
                </span>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    periodSummary.profitMargin >= 40
                      ? 'bg-emerald-500'
                      : periodSummary.profitMargin >= 15
                      ? 'bg-[#0754D8]'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.max(Math.min(periodSummary.profitMargin, 100), 0)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Receita: {formatCurrency(periodSummary.totalIncome)}</span>
                <span>Líquido: {formatCurrency(periodSummary.netBalance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FILTROS DE LISTAGEM & BUSCA */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por descrição, cliente ou fornecedor..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-hidden focus:border-[#0754D8]"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'income', label: 'Receitas (+)' },
                { id: 'expense', label: 'Despesas (-)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTypeFilter(tab.id as any)}
                  className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap border transition-all ${
                    typeFilter === tab.id
                      ? 'bg-[#103778] text-white border-[#103778]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LISTAGEM DE TRANSAÇÕES */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-[#103778] text-sm">
              Extrato Financeiro ({filteredTransactions.length} lançamentos encontrados)
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Carregando fluxo de caixa...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              <p>Nenhuma transação encontrada para os filtros selecionados.</p>
              <button
                onClick={handleClearFilters}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#0754D8] bg-[#EAF3FF] hover:bg-[#d6e7ff] transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar Filtros</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const info = categoryLabels[tx.category] || { label: tx.category, icon: FileText, color: 'bg-slate-500' };
                const Icon = info.icon;

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-sm">{tx.description}</h4>
                          {tx.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Aguardando
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-slate-400 text-[11px] flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Icon className="w-3 h-3 text-slate-400" />
                            {info.label}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{tx.payment_method || 'Pix'}</span>
                          {tx.customer && (
                            <>
                              <span>•</span>
                              <span className="text-[#0754D8] font-medium">{tx.customer.name}</span>
                            </>
                          )}
                          {tx.service_order && (
                            <>
                              <span>•</span>
                              <Link
                                href={`/ordens/${tx.service_order.id}`}
                                className="text-[#0754D8] hover:underline font-mono"
                              >
                                {tx.service_order.code}
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p
                          className={`font-bold text-sm ${
                            isIncome ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                        </p>
                        <p className="text-slate-400 text-[10px] mt-0.5">
                          {formatDate(tx.transaction_date)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(tx)}
                          title="Editar lançamento"
                          className="p-2 rounded-xl text-slate-400 hover:text-[#0754D8] hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(tx)}
                          title="Excluir lançamento"
                          className="p-2 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL: NOVA TRANSAÇÃO */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-lg text-[#103778] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#0754D8]" />
                  <span>
                    {formData.type === 'expense' ? 'Lançar Nova Despesa' : 'Lançar Nova Receita'}
                  </span>
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="space-y-4 mt-4">
                {/* Tipo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Lançamento
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          type: 'expense',
                          category: 'combustivel',
                        })
                      }
                      className={`py-2 px-3 rounded-xl border text-center font-bold ${
                        formData.type === 'expense'
                          ? 'border-red-500 bg-red-50 text-red-800'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Despesa (-)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          type: 'income',
                          category: 'servico_os',
                        })
                      }
                      className={`py-2 px-3 rounded-xl border text-center font-bold ${
                        formData.type === 'income'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Receita (+)
                    </button>
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Descrição do Lançamento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={
                      formData.type === 'expense'
                        ? 'Ex: Gasolina Fiorino - Posto Shell Djalma'
                        : 'Ex: Pagamento Instalação Split - Cliente João'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as FinancialCategory })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0754D8] focus:outline-hidden"
                  >
                    {formData.type === 'expense' ? (
                      <>
                        <option value="combustivel">Combustível / Rota Técnica</option>
                        <option value="ferramentas">Ferramentas & Acessórios</option>
                        <option value="refeicao">Refeição / Equipe</option>
                        <option value="insumos">Peças & Insumos de Bancada</option>
                        <option value="prolabore">Pró-Labore / Retirada do Técnico</option>
                        <option value="aluguel_oficina">Oficina / Galpão</option>
                        <option value="energia_agua">Energia / Internet / Água</option>
                        <option value="outros">Outras Despesas</option>
                      </>
                    ) : (
                      <>
                        <option value="servico_os">Serviço de Climatização / Elétrica</option>
                        <option value="insumos">Venda Avulsa de Peça / Gás</option>
                        <option value="outros">Outras Entradas</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Valor e Data */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Data do Lançamento
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.transaction_date}
                      onChange={(e) =>
                        setFormData({ ...formData, transaction_date: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Forma de Pagamento e Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_method: e.target.value as FinancialPaymentMethod,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0754D8] focus:outline-hidden"
                    >
                      <option value="pix">Pix</option>
                      <option value="dinheiro">Dinheiro em Espécie</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="boleto">Boleto Bancário</option>
                      <option value="transferencia">Transferência TED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Situação
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'paid' | 'pending',
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0754D8] focus:outline-hidden"
                    >
                      <option value="paid">Confirmado / Pago</option>
                      <option value="pending">Aguardando Pagamento</option>
                    </select>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações / Comprovante
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ex: Cupom fiscal 9876 ou nota de abastecimento"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#0754D8] text-white text-sm font-semibold hover:bg-[#0642aa] disabled:opacity-50"
                  >
                    {submitting ? 'Lançando...' : 'Confirmar Lançamento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
        {itemToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="font-bold text-lg text-slate-900 text-center">
                Excluir Lançamento?
              </h3>

              <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed">
                Tem certeza que deseja excluir o lançamento{' '}
                <strong className="text-slate-800 font-semibold">"{itemToDelete.description}"</strong> no valor de{' '}
                <strong className="text-slate-800 font-semibold">{formatCurrency(itemToDelete.amount)}</strong>?
              </p>

              <div className="pt-5 mt-5 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                >
                  {deleting ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EDITAR TRANSAÇÃO */}
        {editingTx && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-lg text-[#103778] flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#0754D8]" />
                  <span>Editar Lançamento</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateTransaction} className="space-y-4 mt-4">
                {/* Tipo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Lançamento
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setEditFormData({
                          ...editFormData,
                          type: 'expense',
                          category: 'combustivel',
                        })
                      }
                      className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                        editFormData.type === 'expense'
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Despesa (-)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditFormData({
                          ...editFormData,
                          type: 'income',
                          category: 'servico_os',
                        })
                      }
                      className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                        editFormData.type === 'income'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Receita (+)
                    </button>
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        category: e.target.value as FinancialCategory,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0754D8] focus:outline-hidden"
                  >
                    {editFormData.type === 'expense' ? (
                      <>
                        <option value="combustivel">Combustível / Rota</option>
                        <option value="ferramentas">Ferramentas & Acessórios</option>
                        <option value="refeicao">Alimentação & Refeição</option>
                        <option value="insumos">Insumos & Peças (Gás, Tubos, etc)</option>
                        <option value="prolabore">Pró-Labore / Retirada</option>
                        <option value="aluguel_oficina">Oficina / Instalações</option>
                        <option value="energia_agua">Energia / Água / Telecom</option>
                        <option value="outros">Outras Despesas</option>
                      </>
                    ) : (
                      <>
                        <option value="servico_os">Receita de Ordem de Serviço</option>
                        <option value="outros">Outras Entradas / Aportes</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Descrição do Lançamento *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, description: e.target.value })
                    }
                    placeholder="Ex: Abastecimento Fiorino ou Compra de fluido R410A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>

                {/* Valor e Data */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={editFormData.amount || ''}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#103778] focus:border-[#0754D8] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Data da Transação *
                    </label>
                    <input
                      type="date"
                      required
                      value={editFormData.transaction_date}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          transaction_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Forma de Pagamento e Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={editFormData.payment_method}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          payment_method: e.target.value as FinancialPaymentMethod,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0754D8] focus:outline-hidden"
                    >
                      <option value="pix">Pix</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="boleto">Boleto Bancário</option>
                      <option value="transferencia">Transferência</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Situação
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          status: e.target.value as 'paid' | 'pending' | 'cancelled',
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0754D8] focus:outline-hidden"
                    >
                      <option value="paid">Confirmado / Pago</option>
                      <option value="pending">Aguardando Pagamento</option>
                      <option value="cancelled">Cancelado / Estornado</option>
                    </select>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações / Comprovante
                  </label>
                  <input
                    type="text"
                    value={editFormData.notes}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, notes: e.target.value })
                    }
                    placeholder="Ex: Cupom fiscal 9876 ou nota de abastecimento"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTx(null)}
                    disabled={editSubmitting}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#0754D8] text-white text-sm font-semibold hover:bg-[#0642aa] disabled:opacity-50"
                  >
                    {editSubmitting ? 'Salvando...' : 'Salvar Alterações'}
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

'use client';

import React, { useEffect, useState } from 'react';
import {
  Wrench,
  Plus,
  AirVent,
  Zap,
  Clock,
  DollarSign,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getServiceCatalog, createServiceCatalogItem, updateServiceCatalogItem, deleteServiceCatalogItem } from '@/lib/api';
import { ServiceCatalogItem, ServiceCategory } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

export default function ServicosPage() {
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'climatizacao' | 'eletrica'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Novo Serviço
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('climatizacao');
  const [description, setDescription] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('180');
  const [durationMin, setDurationMin] = useState('90');
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ServiceCatalogItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal Editar Serviço
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ServiceCategory>('climatizacao');
  const [editDescription, setEditDescription] = useState('');
  const [editDefaultPrice, setEditDefaultPrice] = useState('');
  const [editDurationMin, setEditDurationMin] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const handleOpenEdit = (s: ServiceCatalogItem) => {
    setEditingService(s);
    setEditName(s.name || '');
    setEditCategory(s.category || 'climatizacao');
    setEditDescription(s.description || '');
    setEditDefaultPrice(String(s.default_price || 0));
    setEditDurationMin(String(s.estimated_duration_min || 60));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editName.trim()) return;

    try {
      setEditSaving(true);
      await updateServiceCatalogItem(editingService.id, {
        name: editName.trim(),
        category: editCategory,
        description: editDescription.trim() || undefined,
        default_price: parseFloat(editDefaultPrice) || 0,
        estimated_duration_min: parseInt(editDurationMin, 10) || 60,
      });

      setEditingService(null);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao editar serviço:', err);
      alert(err.message || 'Erro ao salvar alterações no serviço.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await deleteServiceCatalogItem(itemToDelete.id);
      setItemToDelete(null);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao excluir serviço:', err);
      alert(err.message || 'Erro ao excluir serviço do catálogo.');
    } finally {
      setDeleting(false);
    }
  };

  async function loadData() {
    try {
      setLoading(true);
      const data = await getServiceCatalog();
      setServices(data);
    } catch (err) {
      console.error('Erro ao buscar serviços:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      await createServiceCatalogItem({
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        default_price: parseFloat(defaultPrice) || 0,
        estimated_duration_min: parseInt(durationMin, 10) || 60,
      });

      setShowModal(false);
      setName('');
      setDescription('');
      loadData();
    } catch (err) {
      console.error('Erro ao criar serviço:', err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = services.filter((s) => {
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(term) ||
        (s.description && s.description.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <AppLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0754D8] uppercase tracking-wider">
            <Wrench className="w-4 h-4" />
            <span>Tabela Operacional</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#103778] tracking-tight mt-1">
            Catálogo de Serviços & Preços
          </h1>
          <p className="text-sm text-slate-500">
            Valores de referência e tempos médios para orçamentos e ordens de serviço
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome do serviço..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
          />
        </div>

        {/* Abas de Categorias */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-[#103778] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos ({services.length})
          </button>
          <button
            onClick={() => setCategoryFilter('climatizacao')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              categoryFilter === 'climatizacao'
                ? 'bg-[#0754D8] text-white shadow-xs'
                : 'bg-white border border-blue-200 text-[#0754D8] hover:bg-blue-50'
            }`}
          >
            <AirVent className="w-3.5 h-3.5" />
            <span>Climatização</span>
          </button>
          <button
            onClick={() => setCategoryFilter('eletrica')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              categoryFilter === 'eletrica'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Elétrica Residencial</span>
          </button>
        </div>
      </div>

      {/* GRID DE SERVIÇOS */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Carregando catálogo de serviços...</div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const isClima = s.category === 'climatizacao';
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-[#0754D8]/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isClima
                          ? 'bg-[#EAF3FF] text-[#0754D8] border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isClima ? <AirVent className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                      <span>{isClima ? 'Climatização' : 'Elétrica'}</span>
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{s.estimated_duration_min} min</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#103778] leading-snug">
                    {s.name}
                  </h3>
                  {s.description && (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-3">
                      {s.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                      Preço Padrão
                    </span>
                    <span className="text-base font-extrabold text-[#0754D8]">
                      {formatCurrency(s.default_price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(s)}
                      className="p-2 rounded-xl text-slate-500 hover:text-[#0754D8] hover:bg-blue-50 border border-slate-200 transition-all active:scale-95"
                      title="Editar serviço do catálogo"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(s)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all active:scale-95"
                      title="Excluir serviço do catálogo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white p-8">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhum serviço encontrado</h3>
          <p className="text-xs text-slate-400 mt-1">Crie serviços no catálogo para agilizar orçamentos e ordens.</p>
        </div>
      )}

      {/* MODAL NOVO SERVIÇO */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in duration-150">
            <h3 className="text-lg font-bold text-[#103778] mb-1">Novo Serviço no Catálogo</h3>
            <p className="text-xs text-slate-500 mb-4">
              Defina o nome, categoria e preço base do serviço
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Higienização de Ar Split 12.000 BTU"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0754D8]"
                />
              </div>

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
                    <span>Climatização</span>
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
                    <span>Elétrica</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço Padrão (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duração Estimada (min)
                  </label>
                  <input
                    type="number"
                    step="15"
                    required
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição dos Procedimentos (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Aplicação de bactericida, limpeza de turbina e serpentina."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0754D8] text-white shadow-md"
                >
                  {saving ? 'Salvando...' : 'Salvar no Catálogo'}
                </button>
              </div>
            </form>
          </div>
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
                <h3 className="font-bold text-base text-slate-900">Excluir Serviço</h3>
                <p className="text-xs text-slate-500">Esta ação não poderá ser desfeita</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 my-4">
              Tem certeza que deseja excluir o serviço <strong className="text-slate-900">{itemToDelete.name}</strong> ({formatCurrency(itemToDelete.default_price)}) do catálogo?
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

      {/* MODAL EDITAR SERVIÇO */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-[#103778]">Editar Serviço</h3>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Atualize as informações operacionais e de precificação deste serviço
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ex: Higienização de Ar Split 12.000 BTU"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#0754D8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoria
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditCategory('climatizacao')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      editCategory === 'climatizacao'
                        ? 'bg-[#0754D8] text-white border-[#0754D8]'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <AirVent className="w-3.5 h-3.5" />
                    <span>Climatização</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCategory('eletrica')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      editCategory === 'eletrica'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Elétrica</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço Padrão (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editDefaultPrice}
                    onChange={(e) => setEditDefaultPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duração Estimada (min)
                  </label>
                  <input
                    type="number"
                    step="15"
                    required
                    value={editDurationMin}
                    onChange={(e) => setEditDurationMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição dos Procedimentos (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Ex: Aplicação de bactericida, limpeza de turbina e serpentina."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
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
                  {editSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

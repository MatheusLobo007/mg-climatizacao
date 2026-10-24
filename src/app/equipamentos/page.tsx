'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AirVent,
  Plus,
  Search,
  MessageCircle,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Filter,
  Trash2,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getEquipment, deleteEquipment, updateEquipment } from '@/lib/api';
import { Equipment, EquipmentType, EquipmentStatus } from '@/lib/types';
import {
  formatDate,
  getWhatsAppLink,
  getMaintenanceUrgency,
  formatEquipmentType,
} from '@/lib/formatters';

export default function EquipamentosPage() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUrgency, setFilterUrgency] = useState<'all' | 'overdue' | 'soon' | 'ok'>('all');
  const [search, setSearch] = useState('');
  const [itemToDelete, setItemToDelete] = useState<Equipment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal de Edição de Equipamento
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<{
    environment: string;
    type: EquipmentType;
    brand: string;
    model: string;
    btu_capacity: string | number;
    serial_number: string;
    installation_date: string;
    last_cleaning_date: string;
    maintenance_interval_months: number;
    status: EquipmentStatus;
    notes: string;
  }>({
    environment: '',
    type: 'split',
    brand: '',
    model: '',
    btu_capacity: '9000',
    serial_number: '',
    installation_date: '',
    last_cleaning_date: '',
    maintenance_interval_months: 6,
    status: 'active',
    notes: '',
  });

  const openEditModal = (eq: Equipment) => {
    setEditingItem(eq);
    setEditForm({
      environment: eq.environment || '',
      type: eq.type || 'split',
      brand: eq.brand || '',
      model: eq.model || '',
      btu_capacity: eq.btu_capacity ? String(eq.btu_capacity) : '9000',
      serial_number: eq.serial_number || '',
      installation_date: eq.installation_date || '',
      last_cleaning_date: eq.last_cleaning_date || '',
      maintenance_interval_months: eq.maintenance_interval_months || 6,
      status: eq.status || 'active',
      notes: eq.notes || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editForm.environment.trim()) return;

    try {
      setSavingEdit(true);
      await updateEquipment(editingItem.id, {
        environment: editForm.environment.trim(),
        type: editForm.type,
        brand: editForm.brand.trim() || null,
        model: editForm.model.trim() || null,
        btu_capacity: editForm.btu_capacity ? parseInt(String(editForm.btu_capacity), 10) : null,
        serial_number: editForm.serial_number.trim() || null,
        installation_date: editForm.installation_date || null,
        last_cleaning_date: editForm.last_cleaning_date || null,
        maintenance_interval_months: Number(editForm.maintenance_interval_months) || 6,
        status: editForm.status,
        notes: editForm.notes.trim() || null,
      });
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao atualizar equipamento:', err);
      alert(err.message || 'Erro ao atualizar equipamento.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await deleteEquipment(itemToDelete.id);
      setItemToDelete(null);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao excluir equipamento:', err);
      alert(err.message || 'Erro ao excluir equipamento.');
    } finally {
      setDeleting(false);
    }
  };

  async function loadData() {
    try {
      setLoading(true);
      const data = await getEquipment();
      setEquipmentList(data);
    } catch (err) {
      console.error('Erro ao buscar equipamentos:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredEquipment = equipmentList.filter((eq) => {
    const urgency = getMaintenanceUrgency(eq.next_cleaning_date);
    if (filterUrgency === 'overdue' && urgency.urgency !== 'overdue' && urgency.urgency !== 'today') {
      return false;
    }
    if (filterUrgency === 'soon' && urgency.urgency !== 'soon_15' && urgency.urgency !== 'today') {
      return false;
    }
    if (filterUrgency === 'ok' && urgency.urgency !== 'ok') {
      return false;
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      const clientName = eq.customer?.name?.toLowerCase() || '';
      const env = eq.environment?.toLowerCase() || '';
      const brand = eq.brand?.toLowerCase() || '';
      return clientName.includes(term) || env.includes(term) || brand.includes(term);
    }
    return true;
  });

  return (
    <AppLayout>
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0754D8] uppercase tracking-wider">
            <AirVent className="w-4 h-4" />
            <span>Controle Preventivo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#103778] tracking-tight mt-1">
            Ar-Condicionado & Higienização
          </h1>
          <p className="text-sm text-slate-500">
            Acompanhe o ciclo de manutenções periódicas e ative clientes antigos via WhatsApp
          </p>
        </div>

        <Link
          href="/equipamentos/novo"
          className="inline-flex items-center justify-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Ar-Condicionado</span>
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
            placeholder="Filtrar por cliente, ambiente ou marca..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-[#263447] placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
          />
        </div>

        {/* Botões de Filtro de Urgência */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterUrgency('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterUrgency === 'all'
                ? 'bg-[#103778] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos ({equipmentList.length})
          </button>
          <button
            onClick={() => setFilterUrgency('overdue')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterUrgency === 'overdue'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white border border-red-200 text-red-700 hover:bg-red-50'
            }`}
          >
            Atrasadas
          </button>
          <button
            onClick={() => setFilterUrgency('soon')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterUrgency === 'soon'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            Próximos 15 dias
          </button>
          <button
            onClick={() => setFilterUrgency('ok')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterUrgency === 'ok'
                ? 'bg-[#0754D8] text-white shadow-xs'
                : 'bg-white border border-blue-200 text-[#0754D8] hover:bg-blue-50'
            }`}
          >
            Em dia
          </button>
        </div>
      </div>

      {/* LISTAGEM DE EQUIPAMENTOS */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Carregando aparelhos...</div>
      ) : filteredEquipment.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((eq) => {
            const urgency = getMaintenanceUrgency(eq.next_cleaning_date);
            const phone = eq.customer?.whatsapp || eq.customer?.phone;
            const waMsg = `Olá, ${eq.customer?.name}! Sou da MG Climatização. Estamos acompanhando a manutenção do seu ar-condicionado ${eq.brand || ''} no ambiente "${eq.environment}". O prazo ideal de nova limpeza preventiva está previsto para ${formatDate(eq.next_cleaning_date)}. Podemos agendar sua visita?`;
            const waLink = getWhatsAppLink(phone, waMsg);

            return (
              <div
                key={eq.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-[#0754D8]/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                        {eq.customer?.name}
                      </span>
                      <h3 className="font-bold text-base text-[#103778] mt-0.5">
                        {eq.environment}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-md border ${urgency.badgeClass}`}
                    >
                      {urgency.label}
                    </span>
                  </div>

                  {/* Detalhes Técnicos */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                    <p className="font-medium text-slate-700">
                      {eq.brand || 'Marca não informada'} • {formatEquipmentType(eq.type)}
                    </p>
                    {eq.btu_capacity && (
                      <p className="font-bold text-[#0754D8]">
                        {eq.btu_capacity.toLocaleString('pt-BR')} BTU/h
                      </p>
                    )}
                    {eq.address && (
                      <p className="text-slate-500 text-[11px]">
                        Local: {eq.address.street}, {eq.address.number} ({eq.address.neighborhood})
                      </p>
                    )}
                  </div>

                  {/* Cronograma de Limpeza */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                        Última Limpeza
                      </span>
                      <span className="font-bold text-slate-700">
                        {formatDate(eq.last_cleaning_date)}
                      </span>
                    </div>
                    <div className="bg-[#EAF3FF]/50 p-2 rounded-xl">
                      <span className="text-[10px] text-[#0754D8] font-semibold block uppercase">
                        Próxima Prevista
                      </span>
                      <span className="font-bold text-[#103778]">
                        {formatDate(eq.next_cleaning_date)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO RÁPIDA */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {phone ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-2xs active:scale-95 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Lembrar WhatsApp</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Sem telefone</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(eq)}
                      className="p-2 rounded-xl text-slate-500 hover:text-[#0754D8] hover:bg-blue-50 border border-slate-200 transition-all active:scale-95"
                      title="Editar ar-condicionado"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      href={`/ordens/nova?customerId=${eq.customer_id}&equipmentId=${eq.id}`}
                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-[#EAF3FF] text-[#103778] hover:text-[#0754D8] text-xs font-bold py-2 px-3 rounded-xl transition-all"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Nova O.S.</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(eq)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all active:scale-95"
                      title="Excluir ar-condicionado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white p-8">
          <AirVent className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhum equipamento cadastrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Cadastre os aparelhos de ar-condicionado dos seus clientes para manter o controle preventivo.
          </p>
          <Link
            href="/equipamentos/novo"
            className="inline-flex items-center gap-2 mt-4 bg-[#0754D8] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Ar-Condicionado</span>
          </Link>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE AR-CONDICIONADO */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-[#0754D8]">
                  <AirVent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#103778]">Editar Ar-Condicionado</h3>
                  <p className="text-xs text-slate-500">
                    Cliente: <strong className="text-slate-700">{editingItem.customer?.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ambiente / Cômodo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.environment}
                    onChange={(e) => setEditForm({ ...editForm, environment: e.target.value })}
                    placeholder="Ex: Suíte Master, Sala, Recepção"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Aparelho
                  </label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value as EquipmentType })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  >
                    <option value="split">Split Hi-Wall</option>
                    <option value="inverter">Split Inverter</option>
                    <option value="cassete">Cassete</option>
                    <option value="piso_teto">Piso Teto</option>
                    <option value="janela">Janela (ACJ)</option>
                    <option value="multi_split">Multi Split</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    placeholder="Ex: Gree, LG, Midea"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={editForm.model}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    placeholder="Ex: Eco Garden"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Capacidade (BTUs)
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={editForm.btu_capacity}
                    onChange={(e) => setEditForm({ ...editForm, btu_capacity: e.target.value })}
                    placeholder="Ex: 9000, 12000"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Série
                  </label>
                  <input
                    type="text"
                    value={editForm.serial_number}
                    onChange={(e) => setEditForm({ ...editForm, serial_number: e.target.value })}
                    placeholder="Opcional"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Instalação
                  </label>
                  <input
                    type="date"
                    value={editForm.installation_date}
                    onChange={(e) => setEditForm({ ...editForm, installation_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
              </div>

              {/* Ciclo Preventivo */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <span className="block text-xs font-bold text-[#103778]">
                  Ciclo Preventivo & Lembrete de Higienização
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Data da Última Limpeza
                    </label>
                    <input
                      type="date"
                      value={editForm.last_cleaning_date}
                      onChange={(e) => setEditForm({ ...editForm, last_cleaning_date: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Intervalo de Manutenção
                    </label>
                    <select
                      value={editForm.maintenance_interval_months}
                      onChange={(e) => setEditForm({ ...editForm, maintenance_interval_months: Number(e.target.value) })}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value={3}>A cada 3 meses (Comércio intenso)</option>
                      <option value={6}>A cada 6 meses (Padrão residencial)</option>
                      <option value={12}>A cada 12 meses (Uso esporádico)</option>
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  * A próxima data de limpeza e o lembrete preventivo no WhatsApp serão recalculados automaticamente ao salvar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status do Aparelho
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as EquipmentStatus })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  >
                    <option value="active">Ativo (Em funcionamento)</option>
                    <option value="inactive">Inativo (Desativado / Aguardando troca)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notas Técnicas
                  </label>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Ex: Gás R410A, 220V"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0754D8] hover:bg-[#0642aa] text-white shadow-xs active:scale-95 transition-all disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingEdit ? 'Salvando...' : 'Salvar Alterações'}</span>
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
                <h3 className="font-bold text-base text-slate-900">Excluir Ar-Condicionado</h3>
                <p className="text-xs text-slate-500">Esta ação não poderá ser desfeita</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 my-4">
              Tem certeza que deseja excluir o aparelho <strong className="text-slate-900">{itemToDelete.environment} ({itemToDelete.brand || 'Split'})</strong> do cliente <strong className="text-slate-900">{itemToDelete.customer?.name}</strong>?
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
    </AppLayout>
  );
}

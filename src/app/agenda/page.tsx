'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Wrench,
  CheckCircle2,
  Filter,
  Users,
  ChevronRight,
  ClipboardList,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getAppointments, updateAppointmentStatus, updateAppointment } from '@/lib/api';
import { Appointment, AppointmentStatus } from '@/lib/types';
import {
  formatDate,
  getWhatsAppLink,
  getGoogleMapsLink,
  formatAppointmentStatus,
} from '@/lib/formatters';

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'upcoming' | 'all'>('today');
  const [todayStr, setTodayStr] = useState<string>('');

  // Modal de Edição de Agendamento
  const [editingApp, setEditingApp] = useState<Appointment | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    scheduled_date: string;
    scheduled_time: string;
    estimated_duration_min: number;
    technician_name: string;
    notes: string;
    status: AppointmentStatus;
  }>({
    title: '',
    scheduled_date: '',
    scheduled_time: '',
    estimated_duration_min: 60,
    technician_name: '',
    notes: '',
    status: 'confirmed',
  });

  const openEditModal = (app: Appointment) => {
    setEditingApp(app);
    setEditForm({
      title: app.title || '',
      scheduled_date: app.scheduled_date || '',
      scheduled_time: app.scheduled_time || '',
      estimated_duration_min: app.estimated_duration_min || 60,
      technician_name: app.technician_name || '',
      notes: app.notes || '',
      status: app.status || 'confirmed',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp || !editForm.scheduled_date || !editForm.scheduled_time) return;

    try {
      setSavingEdit(true);
      await updateAppointment(editingApp.id, {
        title: editForm.title.trim() || 'Atendimento Técnico',
        scheduled_date: editForm.scheduled_date,
        scheduled_time: editForm.scheduled_time,
        estimated_duration_min: Number(editForm.estimated_duration_min) || 60,
        technician_name: editForm.technician_name.trim() || null,
        notes: editForm.notes.trim() || null,
        status: editForm.status,
      });
      setEditingApp(null);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao atualizar agendamento:', err);
      alert(err.message || 'Erro ao atualizar agendamento.');
    } finally {
      setSavingEdit(false);
    }
  };

  async function loadData() {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      setTodayStr(today);
      const data = await getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Erro ao buscar agenda:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateAppointmentStatus(id, newStatus);
    loadData();
  };

  const filtered = appointments.filter((app) => {
    if (dateFilter === 'today') {
      return app.scheduled_date === todayStr;
    }
    if (dateFilter === 'upcoming') {
      return app.scheduled_date >= todayStr;
    }
    return true;
  });

  return (
    <AppLayout>
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0754D8] uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>Programação Técnica</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#103778] tracking-tight mt-1">
            Agenda de Atendimentos
          </h1>
          <p className="text-sm text-slate-500">
            Horários marcados, rotas e conversão direta para Ordem de Serviço
          </p>
        </div>

        <Link
          href="/agenda/novo"
          className="inline-flex items-center justify-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Agendamento</span>
        </Link>
      </div>

      {/* ABAS DE VISUALIZAÇÃO */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setDateFilter('today')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            dateFilter === 'today'
              ? 'bg-[#103778] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Compromissos de Hoje
        </button>
        <button
          onClick={() => setDateFilter('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            dateFilter === 'upcoming'
              ? 'bg-[#0754D8] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Próximos Dias
        </button>
        <button
          onClick={() => setDateFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            dateFilter === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Todos os Registros ({appointments.length})
        </button>
      </div>

      {/* LISTAGEM DE COMPROMISSOS */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Carregando horários...</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3.5">
          {filtered.map((app) => {
            const statusInfo = formatAppointmentStatus(app.status);
            const phone = app.customer?.whatsapp || app.customer?.phone;
            const waMsg = `Olá, ${app.customer?.name}! Sou da MG Climatização. Confirmando nosso atendimento marcado para ${formatDate(app.scheduled_date)} às ${app.scheduled_time}. Qualquer imprevisto, favor nos avisar!`;
            const waLink = getWhatsAppLink(phone, waMsg);
            const mapsLink = app.address ? getGoogleMapsLink(app.address) : null;

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-[#0754D8]/30 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                {/* Lado Esquerdo: Horário e Dados do Atendimento */}
                <div className="flex items-start gap-4">
                  {/* Badge de Horário */}
                  <div className="flex flex-col items-center justify-center bg-[#103778] text-white rounded-xl p-2.5 min-w-[70px] shrink-0 text-center shadow-xs">
                    <span className="text-sm font-extrabold">{app.scheduled_time}</span>
                    <span className="text-[10px] text-white/70 font-medium">
                      {formatDate(app.scheduled_date)}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-[#103778]">
                        {app.customer?.name}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        • {app.category === 'climatizacao' ? 'Climatização' : 'Elétrica'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      {app.title}
                    </p>

                    {app.address && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {app.address.street}, {app.address.number} — {app.address.neighborhood} ({app.address.city})
                        </span>
                      </p>
                    )}

                    {app.notes && (
                      <p className="text-[11px] text-slate-400 italic mt-1">
                        Obs: {app.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Ações Operacionais */}
                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex-wrap justify-end">
                  {phone && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all"
                      title="Enviar confirmação por WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}

                  {mapsLink && (
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-blue-50 text-[#0754D8] hover:bg-blue-100 active:scale-95 transition-all"
                      title="Abrir rota no Maps"
                    >
                      <MapPin className="w-4 h-4" />
                    </a>
                  )}

                  {/* Botão Editar Agendamento */}
                  <button
                    type="button"
                    onClick={() => openEditModal(app)}
                    className="p-2 rounded-xl text-slate-500 hover:text-[#0754D8] hover:bg-blue-50 border border-slate-200 transition-all active:scale-95"
                    title="Editar data, horário ou técnico do compromisso"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Seletor rápido de Status */}
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className="text-xs font-semibold py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-[#0754D8]"
                    title="Alterar status do atendimento"
                  >
                    <option value="confirmed">Confirmado</option>
                    <option value="awaiting_confirmation">Aguardando Confirmação</option>
                    <option value="requested">Solicitado</option>
                    <option value="in_transit">Em Deslocamento</option>
                    <option value="in_progress">Em Atendimento</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="missed">Não Realizado</option>
                  </select>

                  {/* Converter em O.S. Direta */}
                  <Link
                    href={`/ordens/nova?customerId=${app.customer_id}&appointmentId=${app.id}&category=${app.category}`}
                    className="inline-flex items-center gap-1.5 bg-[#0754D8] hover:bg-[#0642aa] text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-xs active:scale-95 transition-all"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Gerar O.S.</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white p-8">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            {dateFilter === 'today'
              ? 'Nenhum atendimento para hoje'
              : 'Nenhum agendamento encontrado'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Agende novos atendimentos para organizar a rota diária e o tempo da equipe.
          </p>
          <Link
            href="/agenda/novo"
            className="inline-flex items-center gap-2 mt-4 bg-[#0754D8] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </Link>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE AGENDAMENTO */}
      {editingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-[#0754D8]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#103778]">Editar Agendamento</h3>
                  <p className="text-xs text-slate-500">
                    Cliente: <strong className="text-slate-700">{editingApp.customer?.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título / Motivo do Atendimento *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Ex: Higienização preventiva, Instalação split"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data Agendada *
                  </label>
                  <input
                    type="date"
                    required
                    value={editForm.scheduled_date}
                    onChange={(e) => setEditForm({ ...editForm, scheduled_date: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário Marcado *
                  </label>
                  <input
                    type="time"
                    required
                    value={editForm.scheduled_time}
                    onChange={(e) => setEditForm({ ...editForm, scheduled_time: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Técnico Responsável
                  </label>
                  <input
                    type="text"
                    value={editForm.technician_name}
                    onChange={(e) => setEditForm({ ...editForm, technician_name: e.target.value })}
                    placeholder="Nome do técnico"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duração Estimada (min)
                  </label>
                  <input
                    type="number"
                    step="15"
                    value={editForm.estimated_duration_min}
                    onChange={(e) => setEditForm({ ...editForm, estimated_duration_min: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status do Atendimento
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AppointmentStatus })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                >
                  <option value="confirmed">Confirmado</option>
                  <option value="awaiting_confirmation">Aguardando Confirmação</option>
                  <option value="requested">Solicitado</option>
                  <option value="in_transit">Em Deslocamento</option>
                  <option value="in_progress">Em Atendimento</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="missed">Não Realizado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações / Instruções
                </label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Informações adicionais para a equipe técnica"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
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
    </AppLayout>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BellRing,
  Calendar,
  CheckCircle,
  Clock,
  MessageCircle,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  AirVent,
  User,
  MapPin,
  ChevronRight,
  ArrowRight,
  Send,
  Check,
  X,
} from 'lucide-react';
import {
  getMaintenanceReminders,
  syncMaintenanceRemindersFromEquipment,
  logReminderContact,
  updateReminderStatus,
} from '@/lib/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { MaintenanceReminder, ReminderStatus } from '@/lib/types';
import { formatDateBR } from '@/lib/formatters';

export default function LembretesPage() {
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'upcoming' | 'contacted' | 'scheduled'>('all');
  const [search, setSearch] = useState('');
  const [todayStr, setTodayStr] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // Sync first to make sure newly registered equipment are present
      await syncMaintenanceRemindersFromEquipment();
      const data = await getMaintenanceReminders();
      setReminders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0]);
    loadData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const added = await syncMaintenanceRemindersFromEquipment();
      const data = await getMaintenanceReminders();
      setReminders(data);
    } catch (err) {
      console.error('Erro na sincronização:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSendWhatsApp = async (reminder: MaintenanceReminder) => {
    const customer = reminder.customer;
    const equipment = reminder.equipment;
    if (!customer) return;

    const phoneRaw = customer.whatsapp || customer.phone || '';
    const cleanPhone = phoneRaw.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const dateFormatted = reminder.scheduled_for_date
      ? formatDateBR(reminder.scheduled_for_date)
      : 'breve';

    const equipDesc = equipment
      ? `${equipment.environment}${equipment.brand ? ` (${equipment.brand}${equipment.btu_capacity ? ` ${equipment.btu_capacity} BTUs` : ''})` : ''}`
      : 'seu ar-condicionado';

    const text = `Olá, ${customer.name}! Tudo bem?\n\nAqui é da *MG Climatização* ❄️🔧\n\nIdentificamos em nosso controle técnico que a higienização preventiva do seu ar-condicionado (*${equipDesc}*) está prevista para *${dateFormatted}*.\n\nA limpeza técnica periódica evita fungos e bactérias, previne vazamentos e reduz o consumo de energia da sua conta de luz.\n\nPodemos agendar a visita técnica para esta semana? Qual o melhor dia e período (manhã/tarde) para você?`;

    // Atualiza status do lembrete no banco como contatado
    try {
      const updated = await logReminderContact(reminder.id, 'Contato iniciado via WhatsApp');
      setReminders((prev) => prev.map((r) => (r.id === reminder.id ? updated : r)));
    } catch (err) {
      console.error('Erro ao registrar contato:', err);
    }

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleStatusChange = async (id: string, newStatus: ReminderStatus) => {
    try {
      const updated = await updateReminderStatus(id, newStatus);
      setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  // Classificação dos lembretes
  const isOverdue = (dateStr: string) => todayStr && dateStr < todayStr;
  const isUpcoming = (dateStr: string) => {
    if (!todayStr) return false;
    const target = new Date(dateStr).getTime();
    const today = new Date(todayStr).getTime();
    const diffDays = (target - today) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30;
  };

  const filteredReminders = reminders.filter((rem) => {
    const customerName = rem.customer?.name?.toLowerCase() || '';
    const env = rem.equipment?.environment?.toLowerCase() || '';
    const brand = rem.equipment?.brand?.toLowerCase() || '';
    const q = search.toLowerCase();

    const matchesSearch = !q || customerName.includes(q) || env.includes(q) || brand.includes(q);
    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'overdue') return isOverdue(rem.scheduled_for_date) && rem.status !== 'scheduled' && rem.status !== 'dismissed';
    if (activeTab === 'upcoming') return isUpcoming(rem.scheduled_for_date) && rem.status !== 'scheduled' && rem.status !== 'dismissed';
    if (activeTab === 'contacted') return rem.status === 'contacted';
    if (activeTab === 'scheduled') return rem.status === 'scheduled';
    return true;
  });

  const overdueCount = reminders.filter((r) => isOverdue(r.scheduled_for_date) && r.status !== 'scheduled' && r.status !== 'dismissed').length;
  const upcomingCount = reminders.filter((r) => isUpcoming(r.scheduled_for_date) && r.status !== 'scheduled' && r.status !== 'dismissed').length;
  const contactedCount = reminders.filter((r) => r.status === 'contacted').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103778] flex items-center gap-2.5">
            <BellRing className="w-6 h-6 text-[#0754D8]" />
            <span>Radar de Higienização Preventiva</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhe o ciclo de 3 ou 6 meses de limpeza de cada ar-condicionado e entre em contato antes do cliente ligar
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-xs active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-[#0754D8] ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Sincronizando...' : 'Sincronizar Aparelhos'}</span>
        </button>
      </div>

      {/* METRIC BADGES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-red-700">Limpezas Atrasadas</p>
            <p className="text-xl font-bold text-red-900 mt-0.5">{overdueCount}</p>
          </div>
          <div className="p-2 bg-red-100 rounded-lg text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700">Próximos 30 Dias</p>
            <p className="text-xl font-bold text-amber-900 mt-0.5">{upcomingCount}</p>
          </div>
          <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700">Contatados</p>
            <p className="text-xl font-bold text-blue-900 mt-0.5">{contactedCount}</p>
          </div>
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700">Total no Radar</p>
            <p className="text-xl font-bold text-emerald-900 mt-0.5">{reminders.length}</p>
          </div>
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
            <AirVent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, cômodo ou marca..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-hidden focus:border-[#0754D8] focus:ring-1 focus:ring-[#0754D8]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: `Todos (${reminders.length})` },
            { id: 'overdue', label: `Atrasados (${overdueCount})` },
            { id: 'upcoming', label: `Próximos 30d (${upcomingCount})` },
            { id: 'contacted', label: `Contatados (${contactedCount})` },
            { id: 'scheduled', label: 'Agendados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#103778] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* LIST OF REMINDERS */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0754D8]" />
          <p className="text-sm">Carregando ciclo de higienizações...</p>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#103778]">Tudo em dia!</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Não há lembretes de higienização pendentes para esta categoria no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReminders.map((reminder) => {
            const customer = reminder.customer;
            const equipment = reminder.equipment;
            const overdue = isOverdue(reminder.scheduled_for_date);

            let statusBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                <Clock className="w-3 h-3" />
                Pendente
              </span>
            );

            if (overdue && reminder.status !== 'scheduled' && reminder.status !== 'dismissed') {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  Vencido
                </span>
              );
            } else if (reminder.status === 'contacted') {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  <Send className="w-3 h-3" />
                  Contatado
                </span>
              );
            } else if (reminder.status === 'scheduled') {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  <Check className="w-3 h-3" />
                  Visita Agendada
                </span>
              );
            }

            return (
              <div
                key={reminder.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-[#0754D8]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-[#EAF3FF] text-[#0754D8]">
                        <AirVent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#103778] text-base leading-tight">
                          {equipment?.environment || 'Aparelho'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {equipment?.brand || 'Sem marca'} • {equipment?.btu_capacity ? `${equipment.btu_capacity.toLocaleString()} BTUs` : 'Capacidade N/I'}
                        </p>
                      </div>
                    </div>
                    {statusBadge}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs text-slate-600 mb-4 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cliente:</span>
                      <Link
                        href={`/clientes/${customer?.id}`}
                        className="font-semibold text-[#0754D8] hover:underline flex items-center gap-1"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{customer?.name}</span>
                      </Link>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Data Prevista:</span>
                      <span className={`font-bold ${overdue ? 'text-red-600' : 'text-slate-700'}`}>
                        {formatDateBR(reminder.scheduled_for_date)}
                      </span>
                    </div>

                    {equipment?.last_cleaning_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Última Limpeza:</span>
                        <span>{formatDateBR(equipment.last_cleaning_date)}</span>
                      </div>
                    )}

                    {reminder.contacted_at && (
                      <div className="flex items-center justify-between text-blue-700 bg-blue-50/60 p-1.5 rounded-lg">
                        <span>Último Contato:</span>
                        <span>{new Date(reminder.contacted_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleSendWhatsApp(reminder)}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Lembrar no WhatsApp</span>
                  </button>

                  <Link
                    href={`/agenda/novo?customerId=${customer?.id || ''}&equipmentId=${equipment?.id || ''}`}
                    onClick={() => handleStatusChange(reminder.id, 'scheduled')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#0754D8] hover:bg-[#0642aa] text-white py-2.5 px-3 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Agendar Visita</span>
                  </Link>

                  {reminder.status !== 'dismissed' && (
                    <button
                      onClick={() => handleStatusChange(reminder.id, 'dismissed')}
                      title="Dispensar lembrete"
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </AppLayout>
  );
}

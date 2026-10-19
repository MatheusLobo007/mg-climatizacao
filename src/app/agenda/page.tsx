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
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getAppointments, updateAppointmentStatus } from '@/lib/api';
import { Appointment } from '@/lib/types';
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
    </AppLayout>
  );
}

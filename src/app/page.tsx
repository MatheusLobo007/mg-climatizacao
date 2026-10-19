'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ClipboardList,
  Users,
  AirVent,
  Plus,
  MessageCircle,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Wrench,
  DollarSign,
  FileText,
  BellRing,
  Package,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getDashboardSummary } from '@/lib/api';
import {
  formatCurrency,
  formatDate,
  getWhatsAppLink,
  getGoogleMapsLink,
  getMaintenanceUrgency,
  formatEquipmentType,
  formatAppointmentStatus,
} from '@/lib/formatters';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getDashboardSummary();
        setSummary(data);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <AppLayout>
      {/* HEADER DE BOAS-VINDAS & AÇÕES RÁPIDAS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0754D8] bg-[#EAF3FF] px-2.5 py-1 rounded-md">
            Painel Operacional
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#103778] tracking-tight mt-1">
            MG Climatização
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestão de serviços de ar-condicionado e elétrica residencial
          </p>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/ordens/nova"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova O.S.</span>
          </Link>
          <Link
            href="/orcamentos/novo"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#103778] border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4 text-[#0754D8]" />
            <span>Novo Orçamento</span>
          </Link>
          <Link
            href="/clientes/novo"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#103778] border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs active:scale-95 transition-all"
          >
            <Users className="w-4 h-4 text-[#0754D8]" />
            <span>Novo Cliente</span>
          </Link>
          <Link
            href="/agenda/novo"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#103778] border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs active:scale-95 transition-all"
          >
            <Calendar className="w-4 h-4 text-[#0754D8]" />
            <span>Agendar Visita</span>
          </Link>
        </div>
      </div>

      {/* ALERTA DE ESTOQUE BAIXO */}
      {summary?.lowStockCount > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">
                Atenção: {summary.lowStockCount} {summary.lowStockCount === 1 ? 'item atingiu' : 'itens atingiram'} o estoque mínimo
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Gases refrigerantes, filtros ou insumos precisam de reposição para evitar paradas em atendimentos.
              </p>
            </div>
          </div>
          <Link
            href="/estoque"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-all shadow-xs shrink-0"
          >
            <span>Ver Estoque</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* CARDS DE INDICADORES PRINCIPAIS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {/* Atendimentos Hoje */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs sm:text-sm font-medium">Agenda de Hoje</span>
            <div className="p-2 rounded-xl bg-[#EAF3FF] text-[#0754D8]">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#103778]">
              {loading ? '—' : summary?.todayAppointments?.length || 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">visitas programadas</p>
          </div>
        </div>

        {/* Ordens em Aberto */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs sm:text-sm font-medium">O.S. em Andamento</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#103778]">
              {loading ? '—' : summary?.openOrdersCount || 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">serviços em execução</p>
          </div>
        </div>

        {/* Orçamentos Pendentes */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs sm:text-sm font-medium">Orçamentos</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#103778]">
              {loading ? '—' : summary?.pendingQuotesCount || 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">propostas pendentes</p>
          </div>
        </div>

        {/* Total Recebido no Mês */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs sm:text-sm font-medium">Recebido no Mês</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg sm:text-xl font-extrabold text-emerald-700">
              {loading ? '—' : formatCurrency(summary?.totalReceivedMonth || 0)}
            </span>
            <p className="text-xs text-slate-500 mt-1">recebimentos confirmados</p>
          </div>
        </div>

        {/* Clientes Ativos */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs sm:text-sm font-medium">Base de Clientes</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#103778]">
              {loading ? '—' : summary?.activeCustomersCount || 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">clientes cadastrados</p>
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: AGENDA DE HOJE + ALERTAS DE HIGIENIZAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AGENDA RESUMIDA DE HOJE (OCUPA 2 COLUNAS) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#EAF3FF] text-[#0754D8]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#103778]">Atendimentos de Hoje</h2>
                <p className="text-xs text-slate-500">Compromissos agendados para a data atual</p>
              </div>
            </div>
            <Link
              href="/agenda"
              className="text-xs font-semibold text-[#0754D8] hover:underline flex items-center gap-1"
            >
              <span>Ver agenda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Carregando compromissos...</div>
          ) : summary?.todayAppointments && summary.todayAppointments.length > 0 ? (
            <div className="space-y-3">
              {summary.todayAppointments.map((app: any) => {
                const statusInfo = formatAppointmentStatus(app.status);
                const phone = app.customer?.whatsapp || app.customer?.phone;
                const waLink = getWhatsAppLink(
                  phone,
                  `Olá, ${app.customer?.name}! Sou da MG Climatização. Confirmando nosso atendimento agendado para hoje às ${app.scheduled_time}.`
                );
                const mapsLink = app.address ? getGoogleMapsLink(app.address) : null;

                return (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-[#EAF3FF]/30 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-[#103778] text-white font-bold text-xs py-1.5 px-2.5 rounded-lg text-center shrink-0">
                        {app.scheduled_time}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[#103778]">{app.customer?.name}</h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">{app.title}</p>
                        {app.address && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {app.address.street}, {app.address.number} - {app.address.neighborhood}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ações Rápidas do Atendimento */}
                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      {phone && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-2xs active:scale-95"
                          title="Enviar mensagem WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      {mapsLink && (
                        <a
                          href={mapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium py-1.5 px-2.5 rounded-lg active:scale-95"
                          title="Abrir no Google Maps"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#0754D8]" />
                          <span>Rota</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Nenhum atendimento agendado para hoje</p>
              <p className="text-xs text-slate-400 mt-0.5">Aproveite para prospectar ou programar novas manutenções.</p>
              <Link
                href="/agenda/novo"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#0754D8] bg-[#EAF3FF] hover:bg-[#d5e8ff] px-3 py-1.5 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agendar Atendimento</span>
              </Link>
            </div>
          )}
        </div>

        {/* RADAR DE PREVENTIVAS & LEMBRETES DE LIMPEZA (AR-CONDICIONADO) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-[#0754D8]">
                  <AirVent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#103778]">Radar de Higienização</h3>
                  <p className="text-xs text-slate-500">Próximas limpezas previstas</p>
                </div>
              </div>
              <Link
                href="/lembretes"
                className="text-xs font-semibold text-[#0754D8] hover:underline flex items-center gap-1"
              >
                <span>Central de Lembretes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-sm">Verificando histórico...</div>
            ) : summary?.upcomingMaintenance && summary.upcomingMaintenance.length > 0 ? (
              <div className="space-y-3">
                {summary.upcomingMaintenance.map((eq: any) => {
                  const urgency = getMaintenanceUrgency(eq.next_cleaning_date);
                  const phone = eq.customer?.whatsapp || eq.customer?.phone;
                  const waMsg = `Olá, ${eq.customer?.name}! Aqui é da MG Climatização. O período recomendado de limpeza preventiva do seu ar-condicionado ${eq.brand || ''} ${eq.environment} está chegando (${formatDate(eq.next_cleaning_date)}). Gostaria de garantir um horário esta semana?`;
                  const waLink = getWhatsAppLink(phone, waMsg);

                  return (
                    <div
                      key={eq.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-[#EAF3FF]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#103778] truncate">
                          {eq.customer?.name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border ${urgency.badgeClass}`}
                        >
                          {urgency.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {eq.environment} • {eq.brand || 'Ar Split'} {eq.btu_capacity ? `${eq.btu_capacity} BTU` : ''}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                        <span>Previsto: {formatDate(eq.next_cleaning_date)}</span>
                        {phone && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Lembrar cliente</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <AirVent className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">Nenhum equipamento cadastrado ainda</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Cadastre o ar-condicionado dos clientes para ativar o cálculo automático de retorno.</p>
                <Link
                  href="/equipamentos/novo"
                  className="inline-flex items-center gap-1 mt-2.5 text-xs font-semibold text-[#0754D8] bg-[#EAF3FF] px-2.5 py-1 rounded-md"
                >
                  <Plus className="w-3 h-3" />
                  <span>Adicionar Equipamento</span>
                </Link>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Intervalo padrão: 6 meses</span>
            <span className="text-[#0754D8] font-medium">Recálculo automático por O.S.</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

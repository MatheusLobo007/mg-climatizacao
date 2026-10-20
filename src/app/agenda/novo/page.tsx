'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  ArrowLeft,
  Save,
  Users,
  MapPin,
  Clock,
  AirVent,
  Zap,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getCustomers, createAppointment, getCompanySettings } from '@/lib/api';
import { Customer, ServiceCategory, AppointmentStatus } from '@/lib/types';

function NovoAgendamentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [isCustomTech, setIsCustomTech] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [addressId, setAddressId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('climatizacao');
  const [status, setStatus] = useState<AppointmentStatus>('confirmed');
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [durationMin, setDurationMin] = useState('90');
  const [technicianName, setTechnicianName] = useState('Matheus Lobo');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setScheduledDate(new Date().toISOString().split('T')[0]);
    async function fetchClients() {
      try {
        setLoading(true);
        const [data, company] = await Promise.all([
          getCustomers(),
          getCompanySettings(),
        ]);
        setCustomers(data);

        if (company) {
          const techList = Array.isArray(company.technicians) && company.technicians.length > 0
            ? company.technicians
            : ['Matheus Lobo', 'Técnico Auxiliar'];
          setTechnicians(techList);
          const defaultTech = company.default_technician || techList[0];
          setTechnicianName(defaultTech);
        }

        if (initialCustomerId) {
          const found = data.find((c) => c.id === initialCustomerId);
          if (found && found.addresses && found.addresses.length > 0) {
            setAddressId(found.addresses[0].id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar clientes:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, [initialCustomerId]);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setErrorMsg('Selecione o cliente para o atendimento.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Informe o motivo ou serviço a ser realizado.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      await createAppointment({
        customer_id: customerId,
        address_id: addressId || undefined,
        equipment_id: equipmentId || undefined,
        category,
        status,
        title: title.trim(),
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        estimated_duration_min: parseInt(durationMin, 10) || 90,
        technician_name: technicianName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      router.push('/agenda');
    } catch (err: any) {
      console.error('Erro ao agendar:', err);
      setErrorMsg(err.message || 'Falha ao agendar atendimento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/agenda"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0754D8] hover:border-[#0754D8] transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#103778] tracking-tight">
            Novo Agendamento
          </h1>
          <p className="text-xs text-slate-500">
            Programe a visita técnica e horário para a equipe
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Cliente *
          </label>
          <select
            required
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              const cust = customers.find((c) => c.id === e.target.value);
              if (cust?.addresses && cust.addresses.length > 0) {
                setAddressId(cust.addresses[0].id);
              } else {
                setAddressId('');
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
          >
            <option value="">Selecione um cliente...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedCustomer && selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Endereço da Visita
            </label>
            <select
              value={addressId}
              onChange={(e) => setAddressId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            >
              {selectedCustomer.addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label || 'Endereço'} — {a.street}, {a.number} ({a.neighborhood})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Categoria do Atendimento
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
              <span>Climatização / Ar</span>
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
              <span>Elétrica Residencial</span>
            </button>
          </div>
        </div>

        {category === 'climatizacao' && selectedCustomer?.equipment && selectedCustomer.equipment.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Equipamento Relacionado (Opcional)
            </label>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option value="">Nenhum aparelho específico</option>
              {selectedCustomer.equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.environment} — {eq.brand || 'Ar Split'} ({eq.btu_capacity || 'BTU'} BTU)
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Motivo / Serviço Previsto *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Higienização preventiva completa de 2 splits"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data da Visita *
            </label>
            <input
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Horário *
            </label>
            <input
              type="time"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-[#103778]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Duração Estimada
            </label>
            <select
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1 hora e 30 min</option>
              <option value="120">2 horas</option>
              <option value="180">3 horas</option>
              <option value="240">4 horas (Período)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Técnico Responsável
            </label>
            {!isCustomTech ? (
              <div className="flex gap-2">
                <select
                  value={technicianName}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomTech(true);
                      setTechnicianName('');
                    } else {
                      setTechnicianName(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium text-slate-800 focus:border-[#0754D8] outline-none"
                >
                  {technicians.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="__custom__">+ Outro técnico (digitar nome)</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  placeholder="Nome do técnico..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomTech(false);
                    if (technicians.length > 0) setTechnicianName(technicians[0]);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Lista
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Inicial
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option value="confirmed">Confirmado</option>
              <option value="awaiting_confirmation">Aguardando Confirmação</option>
              <option value="requested">Solicitado</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Observações Técnicas / Acesso
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Levar escada alta de 7 degraus; cliente pediu para ligar 30min antes."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/agenda"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Agendando...' : 'Confirmar Agendamento'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NovoAgendamentoPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="py-20 text-center text-slate-400">Carregando...</div>}>
        <NovoAgendamentoContent />
      </Suspense>
    </AppLayout>
  );
}

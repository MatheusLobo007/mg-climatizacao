'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AirVent,
  ArrowLeft,
  Save,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getCustomers, createEquipment } from '@/lib/api';
import { Customer } from '@/lib/types';
import { calculateNextCleaningDate, formatDate } from '@/lib/formatters';

function NovoEquipamentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [addressId, setAddressId] = useState('');
  const [environment, setEnvironment] = useState('');
  const [type, setType] = useState('split');
  const [brand, setBrand] = useState('Midea');
  const [model, setModel] = useState('');
  const [btuCapacity, setBtuCapacity] = useState('12000');
  const [serialNumber, setSerialNumber] = useState('');
  const [lastCleaningDate, setLastCleaningDate] = useState('');
  const [intervalMonths, setIntervalMonths] = useState(6);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setLastCleaningDate(new Date().toISOString().split('T')[0]);
    async function fetchClients() {
      try {
        setLoading(true);
        const data = await getCustomers();
        setCustomers(data);
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

  // Previsão em tempo real da próxima data de limpeza
  const predictedNextCleaning = lastCleaningDate
    ? calculateNextCleaningDate(lastCleaningDate, intervalMonths)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setErrorMsg('Selecione o cliente responsável pelo aparelho.');
      return;
    }
    if (!environment.trim()) {
      setErrorMsg('Informe o ambiente onde o aparelho está instalado.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      await createEquipment({
        customer_id: customerId,
        address_id: addressId || undefined,
        environment: environment.trim(),
        type,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        btu_capacity: btuCapacity ? parseInt(btuCapacity, 10) : undefined,
        serial_number: serialNumber.trim() || undefined,
        last_cleaning_date: lastCleaningDate || undefined,
        maintenance_interval_months: intervalMonths,
        notes: notes.trim() || undefined,
      });

      if (customerId) {
        router.push(`/clientes/${customerId}`);
      } else {
        router.push('/equipamentos');
      }
    } catch (err: any) {
      console.error('Erro ao salvar equipamento:', err);
      setErrorMsg(err.message || 'Falha ao cadastrar ar-condicionado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={customerId ? `/clientes/${customerId}` : '/equipamentos'}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0754D8] hover:border-[#0754D8] transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#103778] tracking-tight">
            Cadastrar Ar-Condicionado
          </h1>
          <p className="text-xs text-slate-500">
            Vincule o aparelho a um cliente e configure a periodicidade da higienização
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SEÇÃO 1: CLIENTE E LOCALIZAÇÃO */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#103778] flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-[#0754D8]" />
            <span>Cliente e Endereço do Aparelho</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cliente Responsável *
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
                <option value="">Selecione um cliente cadastrado...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer && selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço de Instalação
                </label>
                <select
                  value={addressId}
                  onChange={(e) => setAddressId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                >
                  {selectedCustomer.addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label || 'Endereço'} — {a.street}, {a.number} ({a.neighborhood})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ambiente / Cômodo *
              </label>
              <input
                type="text"
                required
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                placeholder="Ex: Suíte Casal, Sala de Estar, Quarto 2, Recepção"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: DADOS TÉCNICOS DO APARELHO */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#103778] flex items-center gap-2 mb-4">
            <AirVent className="w-4 h-4 text-[#0754D8]" />
            <span>Especificações Técnicas</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo do Equipamento
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
              >
                <option value="split">Split Hi-Wall Tradicional</option>
                <option value="inverter">Split Inverter</option>
                <option value="cassete">Cassete (Teto)</option>
                <option value="janela">Ar de Janela (ACJ)</option>
                <option value="piso_teto">Piso Teto</option>
                <option value="multi_split">Multi Split</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marca
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Midea, LG, Daikin, Gree, Consul"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Capacidade (BTU/h)
              </label>
              <select
                value={btuCapacity}
                onChange={(e) => setBtuCapacity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
              >
                <option value="7500">7.500 BTU/h</option>
                <option value="9000">9.000 BTU/h</option>
                <option value="12000">12.000 BTU/h</option>
                <option value="18000">18.000 BTU/h</option>
                <option value="24000">24.000 BTU/h</option>
                <option value="30000">30.000 BTU/h</option>
                <option value="36000">36.000 BTU/h</option>
                <option value="48000">48.000 BTU/h</option>
                <option value="60000">60.000 BTU/h</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Modelo / Gás Refrigerante (Opcional)
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: Dual Inverter Voice / Gás R32"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nº de Série (Opcional)
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Ex: 802KRLA00129"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: CRONOGRAMA DE MANUTENÇÃO PREVENTIVA */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#103778] flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#0754D8]" />
            <span>Configuração do Ciclo de Higienização</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data da Última Limpeza
              </label>
              <input
                type="date"
                value={lastCleaningDate}
                onChange={(e) => setLastCleaningDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Se for uma nova instalação ou serviço recente, marque a data atual.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Intervalo Recomendado para Nova Limpeza
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { m: 3, label: '3 meses (Comercial)' },
                  { m: 6, label: '6 meses (Padrão)' },
                  { m: 12, label: '12 meses (Pouco uso)' },
                ].map((item) => (
                  <button
                    key={item.m}
                    type="button"
                    onClick={() => setIntervalMonths(item.m)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                      intervalMonths === item.m
                        ? 'bg-[#0754D8] text-white border-[#0754D8] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PREVISÃO CALCULADA EM TEMPO REAL */}
          {predictedNextCleaning && (
            <div className="mt-4 p-4 rounded-xl bg-[#EAF3FF] border border-[#0754D8]/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#0754D8] shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#103778] block">
                    Próxima Higienização Prevista Automaticamente:
                  </span>
                  <span className="text-sm font-extrabold text-[#0754D8]">
                    {formatDate(predictedNextCleaning)}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                Aparecerá nos lembretes da central
              </span>
            </div>
          )}
        </div>

        {/* BOTÕES DE SUBMISSÃO */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={customerId ? `/clientes/${customerId}` : '/equipamentos'}
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
            <span>{saving ? 'Cadastrando...' : 'Salvar Ar-Condicionado'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NovoEquipamentoPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="py-20 text-center text-slate-400">Carregando...</div>}>
        <NovoEquipamentoContent />
      </Suspense>
    </AppLayout>
  );
}

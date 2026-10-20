'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  ArrowLeft,
  Building2,
  Calendar,
  AirVent,
  CheckCircle2,
  User,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getCustomers, createPMOCPlan, getCompanySettings } from '@/lib/api';
import { Customer, Equipment, PMOCPeriodicity } from '@/lib/types';

export default function NovoPMOCPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerEquipment, setCustomerEquipment] = useState<Equipment[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<{
    establishment_name: string;
    activity_type: string;
    responsible_technician: string;
    technician_crea_cft: string;
    periodicity: PMOCPeriodicity;
    start_date: string;
    valid_until: string;
    emergency_contact: string;
    notes: string;
  }>({
    establishment_name: '',
    activity_type: 'Comercial / Serviços',
    responsible_technician: 'Responsável Técnico',
    technician_crea_cft: 'CFT/CRT Especialista em Refrigeração',
    periodicity: 'mensal',
    start_date: '',
    valid_until: '',
    emergency_contact: '(84) 99461-3185',
    notes: 'Plano em conformidade com a Lei Federal nº 13.589/2018 e Portaria MS nº 3.523/1998.',
  });

  useEffect(() => {
    const today = new Date();
    const nextYear = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);

    setFormData((prev) => ({
      ...prev,
      start_date: today.toISOString().split('T')[0],
      valid_until: nextYear.toISOString().split('T')[0],
    }));

    async function load() {
      try {
        setLoading(true);
        const [data, company] = await Promise.all([
          getCustomers(),
          getCompanySettings(),
        ]);
        setCustomers(data);

        if (company) {
          setFormData((prev) => ({
            ...prev,
            responsible_technician: company.owner_name || company.default_technician || prev.responsible_technician,
            technician_crea_cft: company.technical_registry || prev.technician_crea_cft,
            emergency_contact: company.phone || company.whatsapp || prev.emergency_contact,
          }));
        }
      } catch (err) {
        console.error('Erro ao carregar clientes:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        establishment_name: cust.name,
      }));
      const eqs = cust.equipment || [];
      setCustomerEquipment(eqs);
      // Seleciona todos os aparelhos ativos por padrão
      setSelectedEquipmentIds(eqs.filter((e) => e.status === 'active').map((e) => e.id));
    } else {
      setCustomerEquipment([]);
      setSelectedEquipmentIds([]);
    }
  };

  const toggleEquipment = (id: string) => {
    setSelectedEquipmentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !formData.establishment_name.trim()) return;

    setSubmitting(true);
    try {
      const plan = await createPMOCPlan(
        {
          customer_id: selectedCustomerId,
          establishment_name: formData.establishment_name,
          activity_type: formData.activity_type,
          responsible_technician: formData.responsible_technician,
          technician_crea_cft: formData.technician_crea_cft,
          periodicity: formData.periodicity,
          start_date: formData.start_date,
          valid_until: formData.valid_until,
          emergency_contact: formData.emergency_contact,
          notes: formData.notes,
        },
        selectedEquipmentIds
      );

      router.push(`/pmoc/${plan.id}`);
    } catch (err) {
      console.error('Erro ao criar plano PMOC:', err);
      setSubmitting(false);
    }
  };

  const totalSelectedBtu = customerEquipment
    .filter((e) => selectedEquipmentIds.includes(e.id))
    .reduce((acc, curr) => acc + (curr.btu_capacity || 0), 0);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <Link
            href="/pmoc"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0754D8] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0754D8] bg-[#EAF3FF] px-2 py-0.5 rounded-md">
              Norma Legal
            </span>
            <h1 className="text-2xl font-bold text-[#103778] mt-1">Criar Novo Plano PMOC</h1>
            <p className="text-xs text-slate-500">
              Lei Federal nº 13.589/2018 para controle da qualidade do ar interior
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CLIENTE & ESTABELECIMENTO */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#103778] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0754D8]" />
              <span>1. Identificação do Edifício / Cliente</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cliente Comercial / Empresa Contratante *
              </label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0754D8] focus:outline-hidden"
              >
                <option value="">Selecione a empresa ou cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.document_cpf_cnpj ? `(${c.document_cpf_cnpj})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Estabelecimento / Edifício *
                </label>
                <input
                  type="text"
                  required
                  value={formData.establishment_name}
                  onChange={(e) => setFormData({ ...formData, establishment_name: e.target.value })}
                  placeholder="Ex: Clínica Odontológica Djalma Batista"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ramo de Atividade Desenvolvida
                </label>
                <input
                  type="text"
                  value={formData.activity_type}
                  onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                  placeholder="Ex: Clínica Médica / Escola / Escritório"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* DADOS TÉCNICOS & RESPONSÁVEL */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#103778] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0754D8]" />
              <span>2. Responsabilidade Técnica & Periodicidade</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsável Técnico Habilitado *
                </label>
                <input
                  type="text"
                  required
                  value={formData.responsible_technician}
                  onChange={(e) =>
                    setFormData({ ...formData, responsible_technician: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registro CFT / CRT / CREA
                </label>
                <input
                  type="text"
                  value={formData.technician_crea_cft}
                  onChange={(e) =>
                    setFormData({ ...formData, technician_crea_cft: e.target.value })
                  }
                  placeholder="Ex: CFT nº 045892-AM"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Periodicidade das Visitas
                </label>
                <select
                  value={formData.periodicity}
                  onChange={(e) =>
                    setFormData({ ...formData, periodicity: e.target.value as PMOCPeriodicity })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0754D8] focus:outline-hidden"
                >
                  <option value="mensal">Mensal (Padrão ANVISA)</option>
                  <option value="bimestral">Bimestral</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Início
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Válido Até (1 ano)
                </label>
                <input
                  type="date"
                  required
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0754D8] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* EQUIPAMENTOS INCLUÍDOS NO PLANO */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#103778] flex items-center gap-2">
                  <AirVent className="w-5 h-5 text-[#0754D8]" />
                  <span>3. Inventário de Aparelhos Climatizados</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecione os ar-condicionados que farão parte deste plano de manutenção
                </p>
              </div>

              {selectedEquipmentIds.length > 0 && (
                <div className="text-right">
                  <span className="text-xs font-bold text-[#0754D8] bg-[#EAF3FF] px-2.5 py-1 rounded-md">
                    Total: {totalSelectedBtu.toLocaleString()} BTUs
                  </span>
                </div>
              )}
            </div>

            {selectedCustomerId && customerEquipment.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                Este cliente ainda não possui aparelhos cadastrados.
                <br />
                <Link
                  href="/equipamentos/novo"
                  className="text-[#0754D8] font-bold underline mt-1 inline-block"
                >
                  Cadastrar aparelho para o cliente
                </Link>
              </div>
            ) : !selectedCustomerId ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">
                Selecione um cliente acima para listar os aparelhos cadastrados.
              </div>
            ) : (
              <div className="space-y-2">
                {customerEquipment.map((eq) => {
                  const isChecked = selectedEquipmentIds.includes(eq.id);
                  return (
                    <div
                      key={eq.id}
                      onClick={() => toggleEquipment(eq.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isChecked
                          ? 'border-[#0754D8] bg-[#EAF3FF]/40 ring-1 ring-[#0754D8]/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-[#0754D8] border-[#0754D8] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#103778]">{eq.environment}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {eq.brand || 'Sem marca'} • {eq.type.toUpperCase()} •{' '}
                            {eq.btu_capacity ? `${eq.btu_capacity.toLocaleString()} BTUs` : 'Capacidade N/I'}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-slate-600 font-mono">
                        {eq.btu_capacity ? `${eq.btu_capacity.toLocaleString()} BTU` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BOTÕES */}
          <div className="flex gap-3">
            <Link
              href="/pmoc"
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 text-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting || !selectedCustomerId}
              className="flex-1 py-3 rounded-xl bg-[#0754D8] text-white font-semibold text-sm hover:bg-[#0642aa] shadow-md transition-all disabled:opacity-50"
            >
              {submitting ? 'Gerando Plano PMOC...' : 'Salvar e Visualizar Laudo PMOC'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

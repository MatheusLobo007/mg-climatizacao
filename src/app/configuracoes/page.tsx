'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getCompanySettings, updateCompanySettings } from '@/lib/api';
import { CompanySettings } from '@/lib/types';
import { maskPhone, maskCpfCnpj } from '@/lib/formatters';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  UserCheck,
  Users,
  Plus,
  Trash2,
  Check,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Star,
  Globe,
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings State
  const [settingsId, setSettingsId] = useState<string>('');
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [cityState, setCityState] = useState('');

  // Responsável & PMOC
  const [ownerName, setOwnerName] = useState('');
  const [technicalRegistry, setTechnicalRegistry] = useState('');
  const [maintenanceInterval, setMaintenanceInterval] = useState(6);

  // Equipe Técnica
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [defaultTechnician, setDefaultTechnician] = useState<string>('');
  const [newTechnicianName, setNewTechnicianName] = useState('');

  // Tab ativa: 'empresa' | 'responsavel' | 'equipe'
  const [activeTab, setActiveTab] = useState<'empresa' | 'responsavel' | 'equipe'>('empresa');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getCompanySettings();
      if (data) {
        setSettingsId(data.id);
        setName(data.name || '');
        setSlogan(data.slogan || '');
        setCnpjCpf(data.cnpj_cpf || '');
        setPhone(data.phone || '');
        setWhatsapp(data.whatsapp || '');
        setEmail(data.email || '');
        setAddress(data.address || '');
        setCityState(data.city_state || 'Manaus - AM');
        setOwnerName(data.owner_name || 'Responsável Técnico');
        setTechnicalRegistry(data.technical_registry || 'CFT/CRT Especialista em Refrigeração');
        setMaintenanceInterval(data.default_maintenance_interval_months || 6);

        const techList = Array.isArray(data.technicians) && data.technicians.length > 0
          ? data.technicians
          : ['Técnico Principal', 'Técnico Auxiliar'];
        setTechnicians(techList);
        setDefaultTechnician(data.default_technician || techList[0] || 'Técnico Principal');
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setErrorMsg('Não foi possível carregar as configurações do sistema.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTechnician = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTechnicianName.trim();
    if (!trimmed) return;
    if (technicians.includes(trimmed)) {
      setErrorMsg('Esse técnico já está cadastrado na lista.');
      return;
    }

    const updated = [...technicians, trimmed];
    setTechnicians(updated);
    setNewTechnicianName('');
    setErrorMsg(null);
  };

  const handleRemoveTechnician = (techToRemove: string) => {
    if (technicians.length <= 1) {
      setErrorMsg('É necessário manter pelo menos um técnico cadastrado no sistema.');
      return;
    }
    const updated = technicians.filter((t) => t !== techToRemove);
    setTechnicians(updated);

    if (defaultTechnician === techToRemove) {
      setDefaultTechnician(updated[0]);
    }
    setErrorMsg(null);
  };

  const handleSetDefaultTechnician = (tech: string) => {
    setDefaultTechnician(tech);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg('O Nome da Empresa não pode ficar vazio.');
      return;
    }
    if (technicians.length === 0) {
      setErrorMsg('Adicione ao menos um técnico na equipe.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updates: Partial<CompanySettings> = {
        name: name.trim(),
        slogan: slogan.trim() || null,
        cnpj_cpf: cnpjCpf.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        city_state: cityState.trim() || 'Manaus - AM',
        owner_name: ownerName.trim() || null,
        technical_registry: technicalRegistry.trim() || null,
        default_maintenance_interval_months: Number(maintenanceInterval) || 6,
        technicians: technicians,
        default_technician: defaultTechnician || technicians[0],
      };

      const res = await updateCompanySettings(settingsId, updates);
      if (res.success) {
        setSuccessMsg('Configurações salvas com sucesso! As alterações já estão ativas na Landing Page, O.S. e documentos.');
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(`Erro ao salvar as configurações: ${res.error || 'Verifique as permissões do Firestore.'}`);
      }
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err);
      setErrorMsg(`Ocorreu um erro inesperado ao salvar: ${err?.message || String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* CABEÇALHO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-100 text-[#0754D8]">
                <Building2 className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-[#103778] tracking-tight">
                Configurações da Empresa & Equipe
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie dados comerciais, contatos, registro técnico e equipe de atendimento. As alterações refletem na Landing Page e no painel.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center justify-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>

        {/* FEEDBACK MENSAGENS */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{successMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{errorMsg}</div>
          </div>
        )}

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('empresa')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'empresa'
                ? 'border-[#0754D8] text-[#0754D8]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Dados da Empresa & Contato</span>
          </button>

          <button
            onClick={() => setActiveTab('equipe')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'equipe'
                ? 'border-[#0754D8] text-[#0754D8]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Equipe Técnica ({technicians.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('responsavel')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'responsavel'
                ? 'border-[#0754D8] text-[#0754D8]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Responsável & PMOC</span>
          </button>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0754D8]" />
            <span className="text-sm font-medium">Carregando configurações...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ABA 1: DADOS DA EMPRESA & CONTATO */}
            {activeTab === 'empresa' && (
              <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80 space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Globe className="w-4 h-4 text-[#0754D8]" />
                  <h2 className="text-base font-bold text-[#103778]">
                    Identificação Comercial & Exibição no Site
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nome da Empresa / Razão Social *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: MG Climatização & Elétrica Residencial"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0754D8] focus:ring-2 focus:ring-[#0754D8]/20 outline-none text-sm transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Slogan / Descrição Curta
                    </label>
                    <input
                      type="text"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      placeholder="Ex: Especialistas em Conforto Térmico & Segurança Elétrica"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0754D8] focus:ring-2 focus:ring-[#0754D8]/20 outline-none text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      CNPJ ou CPF (para Documentos e Garantia)
                    </label>
                    <input
                      type="text"
                      value={cnpjCpf}
                      onChange={(e) => setCnpjCpf(maskCpfCnpj(e.target.value))}
                      placeholder="Ex: 45.123.456/0001-78"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0754D8] focus:ring-2 focus:ring-[#0754D8]/20 outline-none text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Cidade & Estado de Atuação
                    </label>
                    <input
                      type="text"
                      value={cityState}
                      onChange={(e) => setCityState(e.target.value)}
                      placeholder="Ex: Manaus - AM"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0754D8] focus:ring-2 focus:ring-[#0754D8]/20 outline-none text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <span>WhatsApp de Atendimento *</span>
                      <span className="text-[10px] font-normal text-slate-400 lowercase">(exibido no site e botão flutuante)</span>
                    </label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                      placeholder="Ex: (92) 99123-4567"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0754D8] focus:ring-2 focus:ring-[#0754D8]/20 outline-none text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Telefone Fixo / Comercial (Ligar)
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                      placeholder="Ex: (92) 3234-5678"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0754D8] focus:ring-2 focus:ring-[#0754D8]/20 outline-none text-sm transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      E-mail Oficial da Empresa
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: contato@mgclimatizacao.com.br"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0754D8] focus:ring-2 focus:ring-[#0754D8]/20 outline-none text-sm transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Endereço Completo (Sede / Escritório / Oficina)
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex: Rua Principal, 100 - Adrianópolis, Manaus - AM"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0754D8] focus:ring-2 focus:ring-[#0754D8]/20 outline-none text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: EQUIPE TÉCNICA */}
            {activeTab === 'equipe' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* CARD DE SELEÇÃO DO TÉCNICO PADRÃO */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-3xl p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#0754D8] text-white shrink-0 mt-0.5">
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-[#103778]">
                        Técnico Padrão do Sistema
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Este técnico virá automaticamente selecionado ao abrir uma <strong>Nova Ordem de Serviço</strong> ou agendar um novo atendimento na <strong>Agenda</strong>.
                      </p>

                      <div className="mt-3 max-w-sm">
                        <select
                          value={defaultTechnician}
                          onChange={(e) => handleSetDefaultTechnician(e.target.value)}
                          className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-blue-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#0754D8]/20 outline-none"
                        >
                          {technicians.map((tech) => (
                            <option key={tech} value={tech}>
                              {tech} {tech === defaultTechnician ? '(Atual Padrão)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LISTA E CADASTRO DE TÉCNICOS */}
                <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80 space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#0754D8]" />
                      <h2 className="text-base font-bold text-[#103778]">
                        Técnicos Habilitados na Empresa
                      </h2>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      Total: {technicians.length}
                    </span>
                  </div>

                  {/* FORMULÁRIO RÁPIDO PARA ADICIONAR NOVO TÉCNICO */}
                  <form onSubmit={handleAddTechnician} className="flex gap-2">
                    <input
                      type="text"
                      value={newTechnicianName}
                      onChange={(e) => setNewTechnicianName(e.target.value)}
                      placeholder="Nome do novo técnico..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0754D8] focus:ring-2 focus:ring-[#0754D8]/20 outline-none text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!newTechnicianName.trim()}
                      className="flex items-center gap-1.5 bg-[#103778] hover:bg-[#0754D8] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar</span>
                    </button>
                  </form>

                  {/* GRID DOS TÉCNICOS CADASTRADOS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {technicians.map((tech) => {
                      const isDefault = tech === defaultTechnician;
                      return (
                        <div
                          key={tech}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isDefault
                              ? 'bg-blue-50/50 border-blue-200 shadow-xs'
                              : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                                isDefault
                                  ? 'bg-[#0754D8] text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {tech.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-slate-800 truncate">{tech}</p>
                              {isDefault ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0754D8]">
                                  <Star className="w-3 h-3 fill-current" /> Técnico Padrão
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Técnico da Equipe</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultTechnician(tech)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#0754D8] hover:bg-white border border-slate-200 transition-all cursor-pointer"
                                title="Tornar Técnico Padrão"
                              >
                                Tornar Padrão
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveTechnician(tech)}
                              disabled={technicians.length <= 1}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30 cursor-pointer"
                              title="Remover Técnico"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: RESPONSÁVEL & PMOC */}
            {activeTab === 'responsavel' && (
              <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80 space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <UserCheck className="w-4 h-4 text-[#0754D8]" />
                  <h2 className="text-base font-bold text-[#103778]">
                    Responsabilidade Técnica & Conformidade PMOC
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nome do Responsável Legal / Técnico Principal
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Ex: Nome do Responsável Técnico"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0754D8] focus:ring-2 focus:ring-[#0754D8]/20 outline-none text-sm transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Registro de Habilitação Técnica (CFT / CRT / CREA)
                    </label>
                    <input
                      type="text"
                      value={technicalRegistry}
                      onChange={(e) => setTechnicalRegistry(e.target.value)}
                      placeholder="Ex: CFT/CRT Especialista em Refrigeração"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0754D8] focus:ring-2 focus:ring-[#0754D8]/20 outline-none text-sm transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Intervalo Padrão de Manutenção Preventiva (em meses)
                    </label>
                    <div className="max-w-xs">
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={maintenanceInterval}
                        onChange={(e) => setMaintenanceInterval(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0754D8] focus:ring-2 focus:ring-[#0754D8]/20 outline-none text-sm transition-all"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">
                      Utilizado para prever automaticamente o próximo ciclo de higienização de aparelhos residenciais e comerciais (Recomendado: 6 meses).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BOTTOM SAVE BAR */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando Dados...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Printer,
  ArrowLeft,
  Share2,
  FileSpreadsheet,
  Building2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  AirVent,
  MessageCircle,
  Clock,
  User,
  Wrench,
  Check,
} from 'lucide-react';
import { LogoMG } from '@/components/brand/LogoMG';
import { getPMOCPlanById, getCompanySettings } from '@/lib/api';
import { PMOCPlan, CompanySettings } from '@/lib/types';
import { formatDate } from '@/lib/formatters';

function PMOCDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const [plan, setPlan] = useState<PMOCPlan | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const [planData, setts] = await Promise.all([
          getPMOCPlanById(id),
          getCompanySettings(),
        ]);
        setPlan(planData);
        setSettings(setts);
      } catch (err) {
        console.error('Erro ao carregar PMOC:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500">
        Carregando Plano PMOC...
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-[#103778]">Plano PMOC não encontrado</h2>
        <Link href="/pmoc" className="mt-4 text-[#0754D8] font-semibold underline text-sm">
          Voltar para a lista de planos
        </Link>
      </div>
    );
  }

  const customer = plan.customer;
  const address = customer?.addresses?.[0];
  const equipmentLinks = plan.equipment_links || [];

  const handleSendWhatsApp = () => {
    if (!customer) return;
    const phone = customer.whatsapp || customer.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const companyName = settings?.name || 'MG Climatização';
    const text = `Olá, *${customer.name}*!\n\nAqui é da *${companyName}* ❄️🔧\n\nDisponibilizamos o documento oficial do seu *Plano de Manutenção, Operação e Controle (PMOC)* em total conformidade com a *Lei Federal nº 13.589/2018*:\n\n📋 *Registro PMOC:* ${plan.code}\n🏢 *Estabelecimento:* ${plan.establishment_name}\n❄️ *Capacidade Climatizada:* ${plan.total_refrigeration_capacity_btu.toLocaleString()} BTUs (${equipmentLinks.length} aparelhos)\n📅 *Vigência:* ${formatDate(plan.start_date)} até ${formatDate(plan.valid_until)}\n👨‍🔧 *Resp. Técnico:* ${plan.responsible_technician} (${plan.technician_crea_cft || 'CFT/CRT'})\n\nO documento comprova a assepsia do ar perante a Vigilância Sanitária (ANVISA) e Corpo de Bombeiros. Estamos à disposição para qualquer auditoria!`;

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
      {/* BARRA DE AÇÕES SUPERIOR (OCULTA NA IMPRESSÃO) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <Link
          href="/pmoc"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#103778]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Planos PMOC</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSendWhatsApp}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3.5 rounded-xl text-xs font-semibold shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar no WhatsApp</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#103778] hover:bg-[#0754D8] text-white py-2 px-4 rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* FOLHA FORMAL TIMBRADA PMOC */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-lg border border-slate-200/80 print:shadow-none print:border-none print:p-6 print:rounded-none">
        {/* CABEÇALHO FORMAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b-2 border-[#103778]">
          <div>
            <LogoMG size="md" variant="full" />
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
              Climatização & Elétrica Residencial e Comercial
            </h2>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-600 space-y-0.5">
            <p className="font-bold text-[#103778] text-sm">
              {settings?.name || 'MG Climatização'}
            </p>
            {settings?.cnpj_cpf && <p>CNPJ/CPF: {settings.cnpj_cpf}</p>}
            <p>{settings?.address || settings?.city_state || 'Manaus - AM'} • Atendimento Especializado</p>
            <p className="font-medium text-[#0754D8]">
              Contato: {settings?.phone || settings?.whatsapp || '(92) 99123-4567'}
            </p>
          </div>
        </div>

        {/* TÍTULO DO LAUDO PMOC */}
        <div className="text-center my-6">
          <span className="text-xs font-bold text-[#0754D8] bg-[#EAF3FF] px-3 py-1 rounded-full uppercase tracking-wider">
            Conformidade Legal • Lei Federal Nº 13.589/2018
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#103778] mt-2">
            PLANO DE MANUTENÇÃO, OPERAÇÃO E CONTROLE (PMOC)
          </h1>
          <p className="font-mono text-sm font-bold text-slate-500 mt-1">
            Registro Oficial: {plan.code}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Portaria MS nº 3.523/1998 e Resolução ANVISA RE nº 09/2003
          </p>
        </div>

        {/* 1. DADOS DO ESTABELECIMENTO */}
        <div className="mb-6">
          <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5 pb-1 border-b border-slate-200">
            <Building2 className="w-4 h-4 text-[#0754D8]" />
            <span>1. IDENTIFICAÇÃO DO ESTABELECIMENTO / EDIFÍCIO</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Nome do Estabelecimento</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{plan.establishment_name}</p>
              <p className="text-slate-600 mt-1">
                <span className="font-semibold">Atividade:</span> {plan.activity_type}
              </p>
              {customer?.document_cpf_cnpj && (
                <p className="text-slate-600 mt-0.5">
                  <span className="font-semibold">CNPJ/CPF:</span> {customer.document_cpf_cnpj}
                </p>
              )}
            </div>

            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Localização & Contato</p>
              {address ? (
                <p className="text-slate-700 mt-0.5">
                  {address.street}, {address.number} {address.complement ? `- ${address.complement}` : ''}
                  <br />
                  {address.neighborhood} • {address.city}/{address.state}
                </p>
              ) : (
                <p className="text-slate-700 mt-0.5">Manaus - AM</p>
              )}
              {customer?.phone && (
                <p className="text-slate-600 mt-1">
                  <span className="font-semibold">Telefone:</span> {customer.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2. DADOS DA EMPRESA MANTENEDORA E RESPONSÁVEL TÉCNICO */}
        <div className="mb-6">
          <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5 pb-1 border-b border-slate-200">
            <ShieldCheck className="w-4 h-4 text-[#0754D8]" />
            <span>2. RESPONSABILIDADE TÉCNICA E VIGÊNCIA</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Responsável Técnico</p>
              <p className="font-bold text-slate-800 mt-0.5">{plan.responsible_technician}</p>
              <p className="text-slate-600 text-[11px] mt-0.5">{plan.technician_crea_cft || 'Habilitado'}</p>
            </div>

            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Periodicidade de Inspeção</p>
              <p className="font-bold text-[#0754D8] mt-0.5 uppercase tracking-wide">
                Visitas {plan.periodicity}s
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">Inspeção e higienização física</p>
            </div>

            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Vigência do Plano</p>
              <p className="text-slate-700 mt-0.5">
                Início: <span className="font-bold">{formatDate(plan.start_date)}</span>
              </p>
              <p className="text-slate-700 mt-0.5">
                Válido até: <span className="font-bold text-emerald-700">{formatDate(plan.valid_until)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 3. INVENTÁRIO DE APARELHOS CLIMATIZADOS */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <AirVent className="w-4 h-4 text-[#0754D8]" />
              <span>3. INVENTÁRIO DE EQUIPAMENTOS E CARGA TÉRMICA</span>
            </h3>
            <span className="text-xs font-bold text-[#0754D8] bg-[#EAF3FF] px-2.5 py-0.5 rounded-md">
              Carga Total: {plan.total_refrigeration_capacity_btu.toLocaleString()} BTUs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-[#103778] text-white">
                <tr>
                  <th className="p-2.5 font-semibold">TAG</th>
                  <th className="p-2.5 font-semibold">Ambiente Climatizado</th>
                  <th className="p-2.5 font-semibold">Tipo</th>
                  <th className="p-2.5 font-semibold">Marca / Modelo</th>
                  <th className="p-2.5 font-semibold text-right">Capacidade</th>
                  <th className="p-2.5 font-semibold text-center">Filtro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {equipmentLinks.map((link, idx) => {
                  const eq = link.equipment;
                  return (
                    <tr key={link.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-[#0754D8]">
                        {link.tag_code || `TAG-AC-${String(idx + 1).padStart(2, '0')}`}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800">{eq?.environment}</td>
                      <td className="p-2.5 text-slate-600 uppercase">{eq?.type || 'Split'}</td>
                      <td className="p-2.5 text-slate-600">
                        {eq?.brand || 'Ar-Condicionado'} {eq?.model ? `• ${eq.model}` : ''}
                      </td>
                      <td className="p-2.5 font-bold text-slate-800 text-right">
                        {eq?.btu_capacity ? `${eq.btu_capacity.toLocaleString()} BTU` : '—'}
                      </td>
                      <td className="p-2.5 text-center text-slate-500">G1 Lavável</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. ROTINAS DE MANUTENÇÃO PREVENTIVA (ANVISA) */}
        <div className="mb-6">
          <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5 pb-1 border-b border-slate-200">
            <Wrench className="w-4 h-4 text-[#0754D8]" />
            <span>4. ROTINA OPERACIONAL DE HIGIENIZAÇÃO E MANUTENÇÃO</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <h4 className="font-bold text-[#103778] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unidade Evaporadora (Interna)</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                <li>Remoção, lavagem e desinfecção dos filtros de ar com bactericida biodegradável.</li>
                <li>Limpeza mecânica e aplicação de desincrustante nas aletas da serpentina.</li>
                <li>Desobstrução e lavagem da bandeja de condensado e linha de dreno de água.</li>
                <li>Inspeção de ruídos, alinhamento e balanceamento da turbina do ventilador.</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <h4 className="font-bold text-[#103778] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unidade Condensadora (Externa)</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                <li>Limpeza das aletas de troca térmica com jato controlado e ar comprimido.</li>
                <li>Medição da corrente elétrica nominal (A) do compressor em pleno funcionamento.</li>
                <li>Verificação das pressões de sucção/descarga e cálculo de superaquecimento do gás.</li>
                <li>Reaperto de bornes elétricos, terminais e conferência de fiação de aterramento.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 5. PARÂMETROS DA QUALIDADE DO AR */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 mb-8 space-y-1">
          <p className="font-bold text-slate-800">
            Conformidade com os Padrões Referenciais da Resolução ANVISA RE nº 09/2003:
          </p>
          <p className="text-[11px] leading-relaxed">
            As rotinas deste plano visam assegurar temperatura de conforto térmico entre 23°C e 26°C no verão, umidade relativa entre 40% e 65%, taxa de renovação de ar constante e ausência de biofilmes bacterianos ou fúngicos nas superfícies internas dos sistemas de ar-condicionado.
          </p>
        </div>

        {/* ASSINATURAS */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="border-b border-slate-400 w-4/5 mx-auto mb-2" />
            <p className="font-bold text-slate-800">{plan.responsible_technician}</p>
            <p className="text-slate-500 text-[11px]">{plan.technician_crea_cft || 'Responsável Técnico'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">MG Climatização</p>
          </div>

          <div>
            <div className="border-b border-slate-400 w-4/5 mx-auto mb-2" />
            <p className="font-bold text-slate-800">{plan.establishment_name}</p>
            <p className="text-slate-500 text-[11px]">Representante Legal do Estabelecimento</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{customer?.document_cpf_cnpj || 'Contratante'}</p>
          </div>
        </div>

        {/* RODAPÉ DO DOCUMENTO */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
          MG Climatização • Sistema Integrado de Gestão • Manaus/AM • Lei Federal nº 13.589/2018
        </div>
      </div>
    </div>
  );
}

export default function PMOCDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500">
          Carregando...
        </div>
      }
    >
      <PMOCDetailContent />
    </Suspense>
  );
}

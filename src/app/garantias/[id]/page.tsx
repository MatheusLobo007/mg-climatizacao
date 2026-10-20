'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Printer,
  ArrowLeft,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MapPin,
  Calendar,
  AirVent,
  MessageCircle,
} from 'lucide-react';
import { LogoMG } from '@/components/brand/LogoMG';
import { getWarrantyTermById, getCompanySettings } from '@/lib/api';
import { WarrantyTerm, CompanySettings } from '@/lib/types';
import { formatDate } from '@/lib/formatters';

function WarrantyDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const [term, setTerm] = useState<WarrantyTerm | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const [termData, setts] = await Promise.all([
          getWarrantyTermById(id),
          getCompanySettings(),
        ]);
        setTerm(termData);
        setSettings(setts);
      } catch (err) {
        console.error('Erro ao carregar termo de garantia:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500">
        Carregando certificado de garantia...
      </div>
    );
  }

  if (!term) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-[#103778]">Certificado não encontrado</h2>
        <Link href="/garantias" className="mt-4 text-[#0754D8] font-semibold underline text-sm">
          Voltar para a lista de garantias
        </Link>
      </div>
    );
  }

  const customer = term.customer;
  const order = term.service_order;
  const equipment = term.equipment;

  const handleSendWhatsApp = () => {
    if (!customer) return;
    const phone = customer.whatsapp || customer.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const text = `Olá, *${customer.name}*!\n\nAqui é da *MG Climatização*.\n\nSegue o seu *Certificado de Garantia Oficial* referente aos serviços prestados na Ordem de Serviço *${order?.code || ''}*:\n\n📜 *Código do Certificado:* ${term.code}\n⏱️ *Prazo de Vigência:* ${term.duration_days} dias\n📅 *Válido até:* ${formatDate(term.end_date)}\n\nNossos serviços contam com suporte técnico dedicado para sua total tranquilidade. Qualquer dúvida, estamos sempre à disposição!`;

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
      {/* BARRA DE AÇÕES SUPERIOR (OCULTA NA IMPRESSÃO) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <Link
          href="/garantias"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#103778]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Garantias</span>
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

      {/* FOLHA FORMAL TIMBRADA DO CERTIFICADO */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-lg border border-slate-200/80 print:shadow-none print:border-none print:p-6 print:rounded-none">
        {/* CABEÇALHO FORMAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b-2 border-[#103778]">
          <div>
            <LogoMG size="md" variant="full" />
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
              Climatização & Elétrica Residencial
            </h2>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-600 space-y-0.5">
            <p className="font-bold text-[#103778] text-sm">
              {settings?.name || 'MG Climatização'}
            </p>
            {settings?.cnpj_cpf && <p>CNPJ/CPF: {settings.cnpj_cpf}</p>}
            <p>{settings?.address || settings?.city_state || 'Tangará - RN'} • Atendimento Especializado</p>
            <p className="font-medium text-[#0754D8]">
              WhatsApp: {settings?.whatsapp || '(84) 99461-3185'}
            </p>
          </div>
        </div>

        {/* TÍTULO DO DOCUMENTO */}
        <div className="text-center my-6">
          <span className="text-xs font-bold text-[#0754D8] bg-[#EAF3FF] px-3 py-1 rounded-full uppercase tracking-wider">
            Documento de Conformidade Técnica
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#103778] mt-2">
            CERTIFICADO DE GARANTIA
          </h1>
          <p className="font-mono text-sm font-bold text-slate-500 mt-1">
            Certificado Nº: {term.code}
          </p>
        </div>

        {/* DADOS DO CLIENTE E ATENDIMENTO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs mb-6">
          <div>
            <p className="text-slate-400 font-semibold uppercase text-[10px]">Cliente / Titular</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{customer?.name}</p>
            {customer?.phone && <p className="text-slate-600 mt-0.5">Contato: {customer.phone}</p>}
            {customer?.document_cpf_cnpj && (
              <p className="text-slate-600 mt-0.5">CPF/CNPJ: {customer.document_cpf_cnpj}</p>
            )}
          </div>

          <div>
            <p className="text-slate-400 font-semibold uppercase text-[10px]">Dados do Serviço</p>
            <p className="text-slate-700 mt-0.5">
              <span className="font-semibold">Ordem de Serviço:</span>{' '}
              <span className="font-mono font-bold text-[#0754D8]">{order?.code}</span>
            </p>
            {equipment && (
              <p className="text-slate-700 mt-0.5">
                <span className="font-semibold">Equipamento:</span> {equipment.environment} (
                {equipment.brand || 'Ar-Condicionado'}{' '}
                {equipment.btu_capacity ? `${equipment.btu_capacity} BTUs` : ''})
              </p>
            )}
            <p className="text-slate-700 mt-0.5">
              <span className="font-semibold">Data de Conclusão:</span> {formatDate(term.start_date)}
            </p>
          </div>
        </div>

        {/* VIGÊNCIA DA GARANTIA */}
        <div className="p-4 rounded-xl bg-[#EAF3FF]/60 border border-[#0754D8]/30 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#103778] uppercase tracking-wide">
              Período de Cobertura Garantido
            </p>
            <p className="text-lg font-extrabold text-[#0754D8] mt-0.5">
              {term.duration_days} DIAS CORRIDOS
            </p>
          </div>

          <div className="text-right text-xs">
            <p className="text-slate-500">
              Início: <span className="font-bold text-slate-800">{formatDate(term.start_date)}</span>
            </p>
            <p className="text-slate-500 mt-0.5">
              Término: <span className="font-bold text-emerald-700">{formatDate(term.end_date)}</span>
            </p>
          </div>
        </div>

        {/* TERMOS E CONDIÇÕES */}
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed mb-8">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>1. Cobertura Assegurada</span>
            </h3>
            <p className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
              {term.coverage_details}
            </p>
          </div>

          {term.exclusions && (
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0754D8]" />
                <span>2. Exclusões e Hipóteses de Perda da Garantia</span>
              </h3>
              <p className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                {term.exclusions}
              </p>
            </div>
          )}

          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              3. Procedimento em Caso de Dúvidas ou Chamado Técnico
            </h3>
            <p className="text-slate-600">
              Para acionar este certificado de garantia dentro do período de vigência, entre em contato direto pelo WhatsApp de suporte técnico informando o número deste certificado (<strong>{term.code}</strong>) e o relato do ocorrido para priorização imediata do atendimento.
            </p>
          </div>
        </div>

        {/* ASSINATURAS */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="border-b border-slate-400 w-4/5 mx-auto mb-2" />
            <p className="font-bold text-slate-800">{settings?.name || 'MG Climatização'}</p>
            <p className="text-slate-500 text-[11px]">Responsável Técnico</p>
          </div>

          <div>
            <div className="border-b border-slate-400 w-4/5 mx-auto mb-2" />
            <p className="font-bold text-slate-800">{customer?.name}</p>
            <p className="text-slate-500 text-[11px]">Cliente / Contratante</p>
          </div>
        </div>

        {/* RODAPÉ DO DOCUMENTO */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
          MG Climatização • Serviços Profissionais em Ar-Condicionado e Elétrica Residencial • Tangará/RN
        </div>
      </div>
    </div>
  );
}

export default function WarrantyDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500">
          Carregando...
        </div>
      }
    >
      <WarrantyDetailContent />
    </Suspense>
  );
}

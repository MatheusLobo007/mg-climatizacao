'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  MapPin,
  AirVent,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getCustomers } from '@/lib/api';
import { Customer } from '@/lib/types';
import {
  formatPhone,
  getWhatsAppLink,
  getGoogleMapsLink,
} from '@/lib/formatters';

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadCustomers(query?: string) {
    try {
      setLoading(true);
      const data = await getCustomers(query);
      setCustomers(data);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers(search);
  };

  return (
    <AppLayout>
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0754D8] uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Gestão Comercial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#103778] tracking-tight mt-1">
            Clientes Cadastrados
          </h1>
          <p className="text-sm text-slate-500">
            {customers.length} {customers.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
          </p>
        </div>

        <Link
          href="/clientes/novo"
          className="inline-flex items-center justify-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Cliente</span>
        </Link>
      </div>

      {/* BARRA DE PESQUISA */}
      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone ou documento..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-[#263447] placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8] focus:border-transparent transition-all shadow-2xs"
          />
        </div>
        <button
          type="submit"
          className="bg-[#103778] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0a234e] active:scale-95 transition-all shrink-0"
        >
          Buscar
        </button>
      </form>

      {/* LISTAGEM DE CLIENTES */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Carregando lista de clientes...</div>
      ) : customers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => {
            const primaryAddr = c.addresses?.find((a) => a.is_primary) || c.addresses?.[0];
            const phone = c.whatsapp || c.phone;
            const waLink = getWhatsAppLink(phone, `Olá, ${c.name}! Tudo bem? Sou da MG Climatização.`);
            const mapsLink = primaryAddr ? getGoogleMapsLink(primaryAddr) : null;
            const equipmentCount = c.equipment?.length || 0;

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-[#0754D8]/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-[#103778] leading-tight">
                        {c.name}
                      </h3>
                      {c.document_cpf_cnpj && (
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {c.document_cpf_cnpj}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        c.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {c.status === 'active' ? 'Ativo' : 'Arquivado'}
                    </span>
                  </div>

                  {/* Informações de Endereço e Equipamentos */}
                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    {phone && (
                      <p className="flex items-center gap-2 text-slate-700 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatPhone(phone)}</span>
                      </p>
                    )}

                    {primaryAddr ? (
                      <p className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {primaryAddr.street}, {primaryAddr.number}
                          {primaryAddr.neighborhood ? ` - ${primaryAddr.neighborhood}` : ''}
                          {primaryAddr.city ? `, ${primaryAddr.city}` : ''}
                        </span>
                      </p>
                    ) : (
                      <p className="flex items-center gap-2 text-slate-400 italic">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>Nenhum endereço cadastrado</span>
                      </p>
                    )}

                    <div className="pt-2 flex items-center gap-2 text-[#0754D8] font-semibold">
                      <AirVent className="w-3.5 h-3.5" />
                      <span>
                        {equipmentCount}{' '}
                        {equipmentCount === 1 ? 'ar-condicionado' : 'aparelhos de ar-condicionado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO RÁPIDA MOBILE */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {phone && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all"
                        title="Conversar no WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    {mapsLink && (
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-blue-50 text-[#0754D8] hover:bg-blue-100 active:scale-95 transition-all"
                        title="Abrir no Google Maps"
                      >
                        <MapPin className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <Link
                    href={`/clientes/${c.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#103778] hover:text-[#0754D8] bg-slate-50 hover:bg-[#EAF3FF] px-3 py-2 rounded-xl transition-all"
                  >
                    <span>Ver detalhes</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhum cliente encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Cadastre os primeiros clientes da MG Climatização para vincular equipamentos e ordens de serviço.
          </p>
          <Link
            href="/clientes/novo"
            className="inline-flex items-center gap-2 mt-4 bg-[#0754D8] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Cliente</span>
          </Link>
        </div>
      )}
    </AppLayout>
  );
}

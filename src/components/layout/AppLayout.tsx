'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  Wrench,
  AirVent,
  Plus,
  Settings,
  Menu,
  X,
  PhoneCall,
  MapPin,
  Clock,
  Sparkles,
  FileText,
  BellRing,
  Package,
  DollarSign,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { LogoMG } from '@/components/brand/LogoMG';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Início', icon: LayoutDashboard },
    { href: '/agenda', label: 'Agenda', icon: Calendar },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/ordens', label: 'Ordens', icon: ClipboardList },
    { href: '/lembretes', label: 'Lembretes', icon: BellRing },
  ];

  const moreItems = [
    { href: '/pmoc', label: 'PMOC (Lei 13.589)', icon: FileSpreadsheet, description: 'Laudos técnicos corporativos para ANVISA e empresas' },
    { href: '/financeiro', label: 'Fluxo de Caixa', icon: DollarSign, description: 'Receitas de serviços, despesas de rota e saldo real' },
    { href: '/garantias', label: 'Termos de Garantia', icon: ShieldCheck, description: 'Certificados timbrados de 30 a 90 dias' },
    { href: '/lembretes', label: 'Lembretes de Limpeza', icon: BellRing, description: 'Radar de manutenções preventivas e retorno ao cliente' },
    { href: '/estoque', label: 'Estoque & Materiais', icon: Package, description: 'Gás refrigerante, bactericidas, peças e fornecedores' },
    { href: '/orcamentos', label: 'Orçamentos', icon: FileText, description: 'Propostas comerciais e conversão em O.S.' },
    { href: '/equipamentos', label: 'Ar-Condicionado', icon: AirVent, description: 'Aparelhos cadastrados e histórico' },
    { href: '/servicos', label: 'Catálogo de Serviços', icon: Wrench, description: 'Tabela de preços e serviços elétricos' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row pb-20 md:pb-0">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-[#103778] text-white shrink-0 border-r border-[#0754D8]/20 sticky top-0 h-screen shadow-lg">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <LogoMG variant="white" size="sm" />
          </Link>
        </div>

        {/* Quick CTA Desktop */}
        <div className="p-4">
          <Link
            href="/ordens/nova"
            className="w-full flex items-center justify-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white py-2.5 px-4 rounded-xl font-medium text-sm transition-all shadow-md active:scale-95 border border-white/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Ordem de Serviço</span>
          </Link>
        </div>

        {/* Navigation Links Desktop */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50 px-3 py-2">
            Operação
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  active
                    ? 'bg-[#0754D8] text-white shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-white/70'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50 px-3 pt-5 pb-2">
            Gestão & Cadastros
          </div>
          {moreItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  active
                    ? 'bg-[#0754D8] text-white shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-white/70'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-white/10 text-xs text-white/60 flex items-center justify-between">
          <div>
            <p className="font-semibold text-white/90">MG Climatização</p>
            <p className="text-[10px] text-white/50">Manaus - AM</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Sistema Online" />
        </div>
      </aside>

      {/* TOP HEADER MOBILE */}
      <header className="md:hidden sticky top-0 z-30 bg-[#103778] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/" className="flex items-center">
          <LogoMG variant="white" size="sm" />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/ordens/nova"
            className="flex items-center gap-1.5 bg-[#0754D8] text-white py-1.5 px-3 rounded-lg text-xs font-semibold shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova OS</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-white hover:bg-white/10 active:bg-white/20"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* DRAWER MENU MOBILE (QUANDO ABERTO) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col">
            <div className="p-4 bg-[#103778] text-white flex items-center justify-between">
              <LogoMG variant="white" size="sm" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded text-white/80 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Módulos do Sistema
              </p>

              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-[#EAF3FF] border border-slate-200/60 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-[#0754D8] text-white shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-[#103778]">{item.label}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                  </Link>
                );
              })}

              <div className="pt-4 border-t border-slate-100">
                <Link
                  href="/clientes/novo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-xl text-slate-700 font-medium text-sm hover:bg-slate-100"
                >
                  <Users className="w-4 h-4 text-[#0754D8]" />
                  <span>Cadastrar Novo Cliente</span>
                </Link>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 text-center">
              MG Climatização • v1.0.0
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>

      {/* BOTTOM NAVIGATION BAR MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all min-h-[48px] touch-press ${
                active
                  ? 'text-[#0754D8] font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-full transition-colors ${
                  active ? 'bg-[#EAF3FF]' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-[#0754D8]' : 'text-slate-500'}`} />
              </div>
              <span className="text-[11px] leading-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* Botão Extra Mais no Mobile */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 rounded-xl text-slate-500 font-medium min-h-[48px] touch-press"
        >
          <div className="p-1 rounded-full">
            <Menu className="w-5 h-5 text-slate-500" />
          </div>
          <span className="text-[11px] leading-tight mt-0.5">Mais</span>
        </button>
      </nav>
    </div>
  );
};

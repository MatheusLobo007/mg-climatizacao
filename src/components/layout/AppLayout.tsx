'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  LogOut,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { LogoMG } from '@/components/brand/LogoMG';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Verificação e proteção de sessão de autenticação com Firebase Auth
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isMounted) return;

      if (!user) {
        setUserEmail(null);
        router.replace('/login');
      } else {
        setUserEmail(user.email || 'Técnico');
        setCheckingAuth(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (err) {
      console.error('Erro ao deslogar:', err);
      router.replace('/login');
    }
  };

  const navItems = [
    { href: '/painel', label: 'Início', icon: LayoutDashboard },
    { href: '/agenda', label: 'Agenda', icon: Calendar },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/ordens', label: 'Ordens', icon: ClipboardList },
    { href: '/lembretes', label: 'Lembretes', icon: BellRing },
  ];

  const moreItems = [
    { href: '/orcamentos', label: 'Orçamentos', icon: FileText, description: 'Propostas comerciais e conversão em O.S.' },
    { href: '/estoque', label: 'Estoque & Materiais', icon: Package, description: 'Gás refrigerante, bactericidas, peças e fornecedores' },
    { href: '/financeiro', label: 'Fluxo de Caixa', icon: DollarSign, description: 'Receitas de serviços, despesas de rota e saldo real' },
    { href: '/pmoc', label: 'PMOC (Lei 13.589)', icon: FileSpreadsheet, description: 'Laudos técnicos corporativos para ANVISA e empresas' },
    { href: '/garantias', label: 'Termos de Garantia', icon: ShieldCheck, description: 'Certificados timbrados de 30 a 90 dias' },
    { href: '/equipamentos', label: 'Ar-Condicionado', icon: AirVent, description: 'Aparelhos cadastrados e histórico' },
    { href: '/servicos', label: 'Catálogo de Serviços', icon: Wrench, description: 'Tabela de preços e serviços elétricos' },
  ];

  const isActive = (path: string) => {
    if (path === '/painel' && (pathname === '/painel' || pathname === '/')) return true;
    if (path !== '/painel' && pathname.startsWith(path)) return true;
    return false;
  };

  // Enquanto valida a sessão, exibe tela de carregamento suave
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <LogoMG variant="full" size="lg" />
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#0754D8]" />
            <span>Validando credenciais de acesso...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row pb-20 md:pb-0">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-[#103778] text-white shrink-0 border-r border-[#0754D8]/20 sticky top-0 h-screen shadow-lg">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/painel" className="flex items-center">
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

        {/* Footer Sidebar com Usuário, Logout e Link do Site */}
        <div className="p-3 border-t border-white/10 space-y-2 bg-[#0d2f66]">
          <div className="px-2 py-1 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="font-bold text-white text-xs truncate" title={userEmail || 'Técnico'}>
                {userEmail || 'Técnico'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-blue-200/70">Acesso autorizado</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-white/70 hover:text-red-300 hover:bg-white/10 transition-colors cursor-pointer"
              title="Sair do Sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between px-2 text-[11px]">
            <Link
              href="/"
              target="_blank"
              className="text-blue-200/80 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Ver Site Público</span>
            </Link>
            <span className="text-[10px] text-white/40">Manaus - AM</span>
          </div>
        </div>
      </aside>

      {/* TOP HEADER MOBILE */}
      <header className="md:hidden sticky top-0 z-30 bg-[#103778] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/painel" className="flex items-center">
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
          <div className="w-[85%] max-w-xs bg-[#103778] text-white h-full shadow-2xl flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <LogoMG variant="white" size="sm" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick CTA Mobile */}
            <div className="p-3 border-b border-white/10">
              <Link
                href="/ordens/nova"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-[#0754D8] text-white py-2 px-3 rounded-xl font-medium text-xs shadow-md active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Ordem de Serviço</span>
              </Link>
            </div>

            {/* Links no Drawer */}
            <div className="flex-1 p-3 space-y-1 overflow-y-auto">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50 px-3 py-1">
                Operação & Atendimento
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs ${
                      active ? 'bg-[#0754D8] text-white' : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50 px-3 pt-3 pb-1">
                Gestão & Cadastros
              </div>
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                      active ? 'bg-[#0754D8] text-white' : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <div className="p-1 rounded-lg bg-white/10 text-white shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs leading-none">{item.label}</div>
                      <div className="text-[10px] text-white/60 mt-1 leading-snug">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Rodapé Drawer com Logout */}
            <div className="p-4 border-t border-white/10 bg-[#0d2f66] space-y-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-white text-xs truncate">{userEmail || 'Técnico'}</p>
                  <span className="text-[10px] text-emerald-400 font-semibold">● Sessão Ativa</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>

              <Link
                href="/"
                target="_blank"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ir para o Site Público</span>
              </Link>
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

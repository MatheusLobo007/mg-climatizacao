'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, MessageCircle, LogIn } from 'lucide-react';

const NAV_LINKS = [
  { href: '#servicos', label: 'Serviços' },
  { href: '#higienizacao', label: 'Higienização' },
  { href: '#como-funciona', label: 'Como Funciona' },
  { href: '#empresas', label: 'Empresas & PMOC' },
  { href: '#duvidas', label: 'Dúvidas' },
];

export function SiteHeader({ whatsappUrl }: { whatsappUrl: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        open
          ? 'bg-white shadow-[0_4px_30px_rgba(16,55,120,0.08)]'
          : solid
            ? 'bg-white/90 backdrop-blur-md shadow-[0_4px_30px_rgba(16,55,120,0.08)]'
            : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-18 sm:h-20 flex items-center justify-between">
        <a href="#inicio" className="flex items-center gap-3" aria-label="MG Climatização - início">
          <Image
            src={solid ? '/logo-mg-navy.png' : '/logo-mg-white.png'}
            alt=""
            width={1019}
            height={403}
            priority
            className="h-9 sm:h-10 w-auto"
          />
          <span className="flex flex-col leading-none">
            <span
              className={`text-base sm:text-lg font-extrabold tracking-tight font-[family-name:var(--font-heading)] transition-colors ${
                solid ? 'text-[#103778]' : 'text-white'
              }`}
            >
              MG Climatização
            </span>
            <span
              className={`mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${
                solid ? 'text-[#0754D8]' : 'text-blue-200/80'
              }`}
            >
              Refrigeração &amp; Elétrica
            </span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-8" aria-label="Navegação principal">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm font-semibold transition-colors ${
                solid ? 'text-[#263447] hover:text-[#0754D8]' : 'text-white/85 hover:text-white'
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            id="header-cta-login"
            href="/login"
            className={`hidden md:inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all border ${
              solid
                ? 'text-[#103778] border-slate-200 hover:border-[#0754D8] hover:bg-[#EAF3FF]'
                : 'text-white border-white/30 hover:border-white hover:bg-white/10'
            }`}
            title="Acesso restrito para técnicos e administração"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar</span>
          </Link>

          <a
            id="header-cta-orcamento"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden sm:inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all active:scale-95 ${
              solid
                ? 'bg-[#0754D8] text-white hover:bg-[#0646b5] shadow-lg shadow-[#0754D8]/25'
                : 'bg-white text-[#103778] hover:bg-[#EAF3FF]'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Pedir orçamento
          </a>
          <button
            id="header-menu-toggle"
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            className={`lg:hidden p-2.5 rounded-xl transition-colors ${
              solid ? 'text-[#103778] hover:bg-[#EAF3FF]' : 'text-white hover:bg-white/10'
            }`}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </header>

      {/* Menu mobile (fora do header para o position: fixed ocupar a tela toda) */}
      <div
        className={`lg:hidden fixed inset-x-0 top-18 sm:top-20 bottom-0 z-40 overflow-y-auto bg-white transition-all duration-300 ${
          open ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col px-6 py-6 gap-1" aria-label="Navegação mobile">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-4 text-lg font-bold text-[#103778] border-b border-slate-100 font-[family-name:var(--font-heading)]"
            >
              {l.label}
            </a>
          ))}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0754D8] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#0754D8]/25"
          >
            <MessageCircle className="w-5 h-5" />
            Pedir orçamento no WhatsApp
          </a>

          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3.5 text-sm font-bold text-[#103778] hover:bg-[#EAF3FF]"
          >
            <LogIn className="w-4 h-4 text-[#0754D8]" />
            Acessar Sistema (Entrar)
          </Link>
        </nav>
      </div>
    </>
  );
}

/** Ativa a animação de revelação em todos os elementos `.mg-reveal` da página. */
export function RevealOnScroll() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.mg-reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

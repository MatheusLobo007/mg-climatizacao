import type { Metadata } from 'next';
import Image from 'next/image';
import {
  AirVent,
  Sparkles,
  Wrench,
  Zap,
  ShieldCheck,
  Building2,
  Snowflake,
  ClipboardCheck,
  CalendarCheck,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  BadgeCheck,
  MapPin,
  Phone,
  Plus,
  Wind,
  Droplets,
  Gauge,
  FileText,
  Stethoscope,
} from 'lucide-react';
import './site/site.css';
import { SiteHeader, RevealOnScroll } from './site/SiteClient';

export const metadata: Metadata = {
  title: 'MG Climatização | Instalação, Higienização de Ar-Condicionado e Elétrica em Manaus',
  description:
    'Instalação, higienização, manutenção preventiva e PMOC de ar-condicionado, além de serviços de elétrica residencial em Manaus. Orçamento rápido pelo WhatsApp e garantia por escrito.',
  openGraph: {
    title: 'MG Climatização | Refrigeração, Climatização e Elétrica',
    description:
      'Ar-condicionado instalado, limpo e funcionando como novo. Atendimento técnico profissional com garantia.',
    images: ['/site/hero-instalacao.jpg'],
    locale: 'pt_BR',
    type: 'website',
  },
};

// ⚠️ Número de exemplo — troque pelo WhatsApp oficial da empresa (apenas dígitos, com DDI 55 + DDD)
const WHATSAPP_NUMBER = '5592999999999';
const WHATSAPP_DISPLAY = '(92) 99999-9999';
const CITY = 'Manaus - AM';

const wa = (msg: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
const WA_DEFAULT = wa('Olá, MG Climatização! Gostaria de solicitar um orçamento.');

const SERVICES = [
  {
    icon: AirVent,
    title: 'Instalação de Ar-Condicionado',
    desc: 'Instalação de splits e multi-splits com tubulação correta, vácuo no sistema e teste de funcionamento.',
    tag: 'Mais procurado',
    msg: 'Olá! Quero um orçamento de instalação de ar-condicionado.',
  },
  {
    icon: Sparkles,
    title: 'Higienização Completa',
    desc: 'Limpeza profunda de filtros, serpentina, turbina e bandeja com produtos bactericidas. Ar mais puro e saudável.',
    msg: 'Olá! Quero agendar uma higienização de ar-condicionado.',
  },
  {
    icon: Snowflake,
    title: 'Manutenção & Carga de Gás',
    desc: 'Manutenção preventiva e corretiva, verificação de pressão e recarga de gás R410A / R32.',
    msg: 'Olá! Preciso de manutenção / carga de gás no ar-condicionado.',
  },
  {
    icon: Stethoscope,
    title: 'Diagnóstico Técnico',
    desc: 'Ar não gela, pinga ou faz barulho? Identificamos a causa com testes elétricos e de desempenho.',
    msg: 'Olá! Meu ar-condicionado está com problema e preciso de um diagnóstico.',
  },
  {
    icon: Zap,
    title: 'Elétrica Residencial',
    desc: 'Quadros de distribuição, disjuntores, tomadas, iluminação e circuitos dedicados para seu ar-condicionado.',
    msg: 'Olá! Preciso de um serviço de elétrica residencial.',
  },
  {
    icon: Building2,
    title: 'PMOC para Empresas',
    desc: 'Plano de Manutenção, Operação e Controle conforme a Lei 13.589/2018 para clínicas, escritórios e comércios.',
    msg: 'Olá! Gostaria de informações sobre PMOC para minha empresa.',
  },
];

const STEPS = [
  { icon: MessageCircle, title: 'Fale com a gente', desc: 'Chame no WhatsApp e conte o que precisa. Respondemos rápido.' },
  { icon: FileText, title: 'Receba o orçamento', desc: 'Orçamento claro e sem compromisso, com tudo discriminado.' },
  { icon: CalendarCheck, title: 'Agende a visita', desc: 'Escolha o melhor dia e horário. Chegamos pontualmente.' },
  { icon: BadgeCheck, title: 'Serviço com garantia', desc: 'Execução com checklist técnico, fotos e termo de garantia.' },
];

const DIFFERENTIALS = [
  { icon: ShieldCheck, title: 'Garantia por escrito', desc: 'Todo serviço sai com termo de garantia formal.' },
  { icon: ClipboardCheck, title: 'Checklist técnico', desc: 'Cada etapa conferida e registrada na ordem de serviço.' },
  { icon: Clock, title: 'Pontualidade', desc: 'Respeitamos seu tempo e o horário combinado.' },
  { icon: Wrench, title: 'Equipamentos profissionais', desc: 'Bomba de vácuo, manifold e ferramentas adequadas.' },
];

const FAQ = [
  {
    q: 'De quanto em quanto tempo devo higienizar o ar-condicionado?',
    a: 'Para uso residencial, recomendamos a higienização a cada 6 meses. Em ambientes com uso intenso, poeira ou pessoas com alergias, o ideal é a cada 3 a 4 meses.',
  },
  {
    q: 'Meu ar não está gelando. Pode ser falta de gás?',
    a: 'Pode, mas nem sempre. Filtros sujos, capacitor com defeito ou problemas elétricos também causam isso. Por isso fazemos um diagnóstico antes de qualquer recarga.',
  },
  {
    q: 'Vocês emitem garantia dos serviços?',
    a: 'Sim. Todos os serviços são registrados em ordem de serviço e acompanhados de termo de garantia por escrito.',
  },
  {
    q: 'O que é PMOC e quem precisa ter?',
    a: 'É o Plano de Manutenção, Operação e Controle exigido pela Lei 13.589/2018 para ambientes de uso público e coletivo climatizados — como clínicas, escritórios, lojas e escolas.',
  },
  {
    q: 'Vocês também fazem a parte elétrica para instalar o ar?',
    a: 'Sim! Fazemos o circuito dedicado, disjuntor e toda a adequação elétrica necessária para o equipamento funcionar com segurança.',
  },
];

function SectionTag({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${
        light ? 'bg-white/10 text-[#9cc8ff] ring-1 ring-white/15' : 'bg-[#EAF3FF] text-[#0754D8]'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${light ? 'bg-[#9cc8ff]' : 'bg-[#0754D8]'}`} />
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="mg-site bg-white text-[#263447]">
      <SiteHeader whatsappUrl={WA_DEFAULT} />
      <RevealOnScroll />

      <main>
        {/* ================= HERO ================= */}
        <section
          id="inicio"
          className="relative isolate overflow-hidden bg-[#0a2a5e] pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-44 lg:pb-32"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,#0754D8_0%,#103778_45%,#081f46_100%)]" />
          <div className="absolute inset-0 -z-10 mg-hero-grid" />
          <div className="absolute -top-40 -right-40 -z-10 h-[520px] w-[520px] rounded-full bg-[#0754D8]/40 blur-[120px]" />
          <div className="mg-breeze hidden lg:block top-[38%] left-[45%]" style={{ animationDelay: '0s' }} />
          <div className="mg-breeze hidden lg:block top-[60%] left-[45%]" style={{ animationDelay: '1.8s' }} />
          <div className="mg-breeze hidden lg:block top-[82%] left-[40%]" style={{ animationDelay: '3.2s' }} />

          <div className="mx-auto max-w-7xl px-5 sm:px-8 grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">
            <div className="mg-reveal is-visible">
              <SectionTag light>
                <MapPin className="w-3.5 h-3.5 -ml-1" /> Atendimento em {CITY}
              </SectionTag>
              <h1 className="mt-6 text-[2.15rem] sm:text-5xl lg:text-[3.3rem] font-extrabold leading-[1.1] tracking-tight text-white">
                Seu <span className="whitespace-nowrap">ar-condicionado</span>{' '}
                <span className="mg-gradient-text">gelando como novo</span>, com quem entende.
              </h1>
              <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-blue-100/85">
                Instalação, higienização, manutenção e elétrica residencial com técnicos qualificados, checklist
                profissional e garantia por escrito em cada serviço.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <a
                  id="hero-cta-whatsapp"
                  href={WA_DEFAULT}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white px-7 py-4 text-base font-bold text-[#103778] shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5 hover:shadow-2xl active:scale-95"
                >
                  <MessageCircle className="w-5 h-5 text-[#0754D8]" />
                  Solicitar orçamento grátis
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  id="hero-cta-servicos"
                  href="#servicos"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-bold text-white ring-1 ring-white/25 transition-all hover:bg-white/10"
                >
                  Ver serviços
                </a>
              </div>

              <ul className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
                {['Orçamento sem compromisso', 'Garantia por escrito', 'Técnicos qualificados'].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm font-medium text-blue-100/90">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#5aa2ff] shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Imagem + cards flutuantes */}
            <div className="relative mg-reveal is-visible" style={{ ['--reveal-delay' as string]: '150ms' }}>
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                <div className="absolute -inset-3 rounded-[2.2rem] bg-gradient-to-br from-[#5aa2ff]/40 to-transparent blur-xl" />
                <div className="relative overflow-hidden rounded-[2rem] ring-1 ring-white/20 shadow-2xl shadow-black/40">
                  <Image
                    src="/site/hero-instalacao.jpg"
                    alt="Técnico da MG Climatização instalando um ar-condicionado split"
                    width={1200}
                    height={896}
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="h-auto w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081f46]/50 via-transparent to-transparent" />
                </div>

                <div className="mg-float absolute -left-3 sm:-left-8 top-8 flex items-center gap-3 rounded-2xl bg-white/95 backdrop-blur px-4 py-3 shadow-xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FF]">
                    <Snowflake className="w-5 h-5 text-[#0754D8]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Temperatura</p>
                    <p className="text-lg font-extrabold text-[#103778] font-[family-name:var(--font-heading)]">
                      18°C
                    </p>
                  </div>
                </div>

                <div className="mg-float-delay absolute -right-2 sm:-right-6 bottom-8 flex items-center gap-3 rounded-2xl bg-white/95 backdrop-blur px-4 py-3 shadow-xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Serviço</p>
                    <p className="text-sm font-extrabold text-[#103778]">Com garantia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FAIXA DE CONFIANÇA ================= */}
        <section className="relative -mt-10 z-10 px-5 sm:px-8">
          <div className="mx-auto max-w-6xl grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-3xl bg-slate-200/70 shadow-[0_20px_60px_-20px_rgba(16,55,120,0.25)] ring-1 ring-slate-200">
            {[
              { icon: AirVent, title: 'Climatização', sub: 'Residencial e comercial' },
              { icon: Zap, title: 'Elétrica', sub: 'Segura e dentro da norma' },
              { icon: ClipboardCheck, title: 'PMOC', sub: 'Lei 13.589/2018' },
              { icon: ShieldCheck, title: 'Garantia', sub: 'Termo por escrito' },
            ].map((s, i) => (
              <div
                key={s.title}
                className="mg-reveal flex items-center gap-3 sm:gap-4 bg-white p-5 sm:p-6"
                style={{ ['--reveal-delay' as string]: `${i * 80}ms` }}
              >
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0754D8] to-[#103778] text-white shadow-lg shadow-[#0754D8]/25">
                  <s.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-[#103778] text-sm sm:text-base font-[family-name:var(--font-heading)]">
                    {s.title}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= SERVIÇOS ================= */}
        <section id="servicos" className="scroll-mt-20 py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center mg-reveal">
              <SectionTag>Nossos serviços</SectionTag>
              <h2 className="mt-5 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold leading-tight text-[#103778]">
                Tudo o que seu <span className="whitespace-nowrap">ar-condicionado</span> e sua elétrica precisam
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-500">
                Da instalação à manutenção, cuidamos de cada detalhe para você ter conforto, economia de energia e
                segurança.
              </p>
            </div>

            <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {SERVICES.map((s, i) => (
                <article
                  key={s.title}
                  className="mg-reveal group relative flex flex-col rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#0754D8]/30 hover:shadow-[0_24px_60px_-20px_rgba(7,84,216,0.35)]"
                  style={{ ['--reveal-delay' as string]: `${(i % 3) * 90}ms` }}
                >
                  {s.tag && (
                    <span className="absolute right-6 top-6 rounded-full bg-[#0754D8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {s.tag}
                    </span>
                  )}
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#0754D8] transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-[#0754D8] group-hover:to-[#103778] group-hover:text-white group-hover:scale-110 group-hover:rotate-3">
                    <s.icon className="w-7 h-7" />
                  </div>
                  <h3 className="mt-6 text-xl font-extrabold text-[#103778]">{s.title}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-slate-500">{s.desc}</p>
                  <a
                    href={wa(s.msg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#0754D8] transition-all group-hover:gap-2.5"
                  >
                    Solicitar orçamento <ArrowRight className="w-4 h-4" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================= DESTAQUE HIGIENIZAÇÃO ================= */}
        <section id="higienizacao" className="scroll-mt-20 py-24 sm:py-32 bg-[#F4F8FE]">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <div className="relative mg-reveal order-2 lg:order-1">
              <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-[#103778]/20">
                <Image
                  src="/site/higienizacao.jpg"
                  alt="Higienização completa da serpentina de um ar-condicionado split"
                  width={1200}
                  height={896}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="h-auto w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 right-4 sm:-right-6 rounded-3xl bg-[#103778] p-5 sm:p-6 text-white shadow-2xl max-w-[220px]">
                <Wind className="w-7 h-7 text-[#5aa2ff]" />
                <p className="mt-3 text-sm font-semibold leading-snug">
                  Recomendado a cada <span className="text-[#9cc8ff] font-extrabold">6 meses</span> para uso
                  residencial
                </p>
              </div>
            </div>

            <div className="mg-reveal order-1 lg:order-2">
              <SectionTag>Higienização completa</SectionTag>
              <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold leading-tight text-[#103778]">
                Ar mais limpo, saudável e uma conta de luz menor
              </h2>
              <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-500">
                Um aparelho sujo acumula fungos, bactérias e ácaros, gasta mais energia e gela menos. Nossa
                higienização vai além da limpeza do filtro.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  { icon: Droplets, t: 'Lavagem de filtros, carenagem e bandeja coletora' },
                  { icon: Sparkles, t: 'Bactericida e sanitizante na serpentina' },
                  { icon: Wind, t: 'Limpeza profunda da turbina de ventilação' },
                  { icon: Gauge, t: 'Teste de dreno, temperatura e pressão do gás' },
                ].map((b) => (
                  <li key={b.t} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0754D8] shadow-sm ring-1 ring-slate-200">
                      <b.icon className="w-5 h-5" />
                    </span>
                    <span className="pt-2 text-[15px] font-semibold text-[#263447]">{b.t}</span>
                  </li>
                ))}
              </ul>

              <a
                href={wa('Olá! Quero agendar uma higienização de ar-condicionado.')}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-flex items-center gap-2.5 rounded-2xl bg-[#0754D8] px-7 py-4 text-base font-bold text-white shadow-xl shadow-[#0754D8]/30 transition-all hover:-translate-y-0.5 hover:bg-[#0646b5] active:scale-95"
              >
                <CalendarCheck className="w-5 h-5" />
                Agendar higienização
              </a>
            </div>
          </div>
        </section>

        {/* ================= ELÉTRICA ================= */}
        <section className="py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <div className="mg-reveal">
              <SectionTag>Elétrica residencial</SectionTag>
              <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold leading-tight text-[#103778]">
                Instalações elétricas seguras para sua casa
              </h2>
              <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-500">
                Do circuito dedicado do ar-condicionado à revisão completa do quadro de luz, trabalhamos com
                segurança, testes e acabamento caprichado.
              </p>
              <div className="mt-8 grid sm:grid-cols-2 gap-3">
                {[
                  'Quadro de distribuição (QDC)',
                  'Troca de disjuntores e DR',
                  'Tomadas e interruptores',
                  'Iluminação e luminárias',
                  'Circuito dedicado para ar',
                  'Aterramento e reaperto',
                ].map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-semibold text-[#263447]"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#0754D8] shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
              <a
                href={wa('Olá! Preciso de um serviço de elétrica residencial.')}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-flex items-center gap-2 text-base font-bold text-[#0754D8] hover:gap-3 transition-all"
              >
                Falar com um eletricista <ArrowRight className="w-5 h-5" />
              </a>
            </div>

            <div className="relative mg-reveal">
              <div className="absolute -top-6 -left-6 h-32 w-32 rounded-3xl bg-[#EAF3FF] -z-0" />
              <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-[#103778]/20">
                <Image
                  src="/site/eletrica.jpg"
                  alt="Profissional realizando medições em um quadro de distribuição elétrica"
                  width={1200}
                  height={896}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="h-auto w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-5 left-6 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl ring-1 ring-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-sm font-bold text-[#103778]">Segurança em 1º lugar</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= COMO FUNCIONA ================= */}
        <section id="como-funciona" className="scroll-mt-20 relative overflow-hidden py-24 sm:py-32 bg-[#103778]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,#0754D8_0%,transparent_60%)] opacity-60" />
          <div className="absolute inset-0 mg-hero-grid" />
          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center mg-reveal">
              <SectionTag light>Como funciona</SectionTag>
              <h2 className="mt-5 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold leading-tight text-white">
                Simples, rápido e sem dor de cabeça
              </h2>
            </div>

            <ol className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {STEPS.map((s, i) => (
                <li
                  key={s.title}
                  className="mg-reveal relative rounded-3xl bg-white/[0.06] p-7 ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/[0.1]"
                  style={{ ['--reveal-delay' as string]: `${i * 100}ms` }}
                >
                  <span className="absolute right-6 top-5 text-5xl font-extrabold text-white/10 font-[family-name:var(--font-heading)]">
                    0{i + 1}
                  </span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0754D8] shadow-lg">
                    <s.icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-6 text-lg font-extrabold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-blue-100/75">{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ================= DIFERENCIAIS ================= */}
        <section className="py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20 items-start">
              <div className="mg-reveal lg:sticky lg:top-28">
                <SectionTag>Por que a MG</SectionTag>
                <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold leading-tight text-[#103778]">
                  Profissionalismo do orçamento à garantia
                </h2>
                <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-500">
                  Trabalhamos com ordem de serviço, checklist técnico, registro fotográfico de antes e depois e
                  lembrete da próxima manutenção. Você sabe exatamente o que foi feito.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                {DIFFERENTIALS.map((d, i) => (
                  <div
                    key={d.title}
                    className="mg-reveal rounded-3xl bg-[#F4F8FE] p-7 ring-1 ring-[#0754D8]/5 transition-all hover:bg-[#EAF3FF] hover:-translate-y-1"
                    style={{ ['--reveal-delay' as string]: `${i * 80}ms` }}
                  >
                    <d.icon className="w-8 h-8 text-[#0754D8]" />
                    <h3 className="mt-5 text-lg font-extrabold text-[#103778]">{d.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= EMPRESAS / PMOC ================= */}
        <section id="empresas" className="scroll-mt-20 px-5 sm:px-8 pb-24 sm:pb-32 bg-white">
          <div className="mg-reveal relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0754D8] via-[#0a4bbf] to-[#103778] px-7 py-14 sm:px-14 sm:py-16 lg:px-20">
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-[#5aa2ff]/20 blur-3xl" />
            <div className="relative grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
              <div>
                <SectionTag light>
                  <Building2 className="w-3.5 h-3.5 -ml-1" /> Para empresas
                </SectionTag>
                <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold leading-tight text-white">
                  Sua empresa em dia com o PMOC
                </h2>
                <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-blue-100/85">
                  Clínicas, escritórios, lojas e escolas climatizados precisam de um Plano de Manutenção, Operação e
                  Controle. Elaboramos o plano, executamos as manutenções e mantemos os registros organizados.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {['Plano conforme Lei 13.589/2018', 'Cronograma de manutenção', 'Relatórios e registros técnicos'].map(
                  (t) => (
                    <div
                      key={t}
                      className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15 backdrop-blur"
                    >
                      <CheckCircle2 className="w-5 h-5 text-[#9cc8ff] shrink-0" />
                      <span className="text-sm sm:text-base font-semibold text-white">{t}</span>
                    </div>
                  )
                )}
                <a
                  href={wa('Olá! Gostaria de um orçamento de PMOC para minha empresa.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-bold text-[#103778] shadow-xl transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  Solicitar proposta de PMOC <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FAQ ================= */}
        <section id="duvidas" className="scroll-mt-20 py-24 sm:py-32 bg-[#F4F8FE]">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <div className="text-center mg-reveal">
              <SectionTag>Dúvidas frequentes</SectionTag>
              <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold leading-tight text-[#103778]">
                Perguntas que sempre recebemos
              </h2>
            </div>
            <div className="mt-12 space-y-3">
              {FAQ.map((f, i) => (
                <details
                  key={f.q}
                  className="mg-faq mg-reveal group rounded-2xl bg-white ring-1 ring-slate-200/80 transition-shadow open:shadow-lg open:shadow-[#103778]/5"
                  style={{ ['--reveal-delay' as string]: `${i * 60}ms` }}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
                    <span className="text-[15px] sm:text-base font-bold text-[#103778]">{f.q}</span>
                    <span className="mg-faq-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF3FF] text-[#0754D8] transition-transform duration-300">
                      <Plus className="w-4 h-4" />
                    </span>
                  </summary>
                  <p className="px-6 pb-6 -mt-1 text-[15px] leading-relaxed text-slate-500">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CTA FINAL ================= */}
        <section className="relative overflow-hidden bg-[#081f46] py-24 sm:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0754D8_0%,transparent_65%)] opacity-50" />
          <div className="relative mx-auto max-w-3xl px-5 sm:px-8 text-center mg-reveal">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
              Pronto para sentir a diferença?
            </h2>
            <p className="mt-5 text-base sm:text-lg text-blue-100/80">
              Chame agora no WhatsApp e receba seu orçamento sem compromisso.
            </p>
            <a
              id="final-cta-whatsapp"
              href={WA_DEFAULT}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-[#25D366] px-8 py-5 text-lg font-bold text-white shadow-2xl shadow-[#25D366]/30 transition-all hover:-translate-y-1 hover:bg-[#1fbf5b] active:scale-95"
            >
              <MessageCircle className="w-6 h-6" />
              Chamar no WhatsApp
            </a>
          </div>
        </section>
      </main>

      {/* ================= RODAPÉ ================= */}
      <footer className="bg-[#061833] text-blue-100/70">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <Image src="/logo-mg-white.png" alt="" width={1019} height={403} className="h-10 w-auto" />
              <span className="text-lg font-extrabold text-white font-[family-name:var(--font-heading)]">
                MG Climatização
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed">
              Refrigeração, climatização e elétrica residencial. Conforto e segurança para sua casa e sua empresa.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Serviços</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {['Instalação', 'Higienização', 'Manutenção & Gás', 'Elétrica Residencial', 'PMOC'].map((s) => (
                <li key={s}>
                  <a href="#servicos" className="hover:text-white transition-colors">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Contato</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href={WA_DEFAULT} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-white">
                  <MessageCircle className="w-4 h-4 text-[#5aa2ff]" /> {WHATSAPP_DISPLAY}
                </a>
              </li>
              <li>
                <a href={`tel:+${WHATSAPP_NUMBER}`} className="flex items-center gap-2.5 hover:text-white">
                  <Phone className="w-4 h-4 text-[#5aa2ff]" /> Ligar agora
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#5aa2ff]" /> {CITY}
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 py-6 text-xs text-blue-100/50 flex flex-col sm:flex-row justify-between gap-2">
            <p>© 2026 MG Climatização. Todos os direitos reservados.</p>
            <p>Refrigeração • Climatização • Elétrica</p>
          </div>
        </div>
      </footer>

      {/* Botão flutuante do WhatsApp */}
      <a
        id="floating-whatsapp"
        href={WA_DEFAULT}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="mg-pulse fixed bottom-5 right-5 z-30 isolate flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/20 transition-transform hover:scale-110"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
}

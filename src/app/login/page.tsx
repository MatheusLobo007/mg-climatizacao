'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Redireciona para o painel se já estiver com sessão ativa no Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/painel');
      } else {
        setCheckingSession(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Por favor, informe seu e-mail e sua senha.');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      router.replace('/painel');
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-email'
      ) {
        setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Muitas tentativas sem sucesso. Aguarde alguns instantes e tente novamente.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Erro de conexão com o Firebase. Verifique sua internet.');
      } else {
        setErrorMsg(err?.message || 'Falha ao autenticar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo-mg-navy.png"
            alt="MG Climatização"
            width={1019}
            height={403}
            priority
            className="h-12 w-auto animate-pulse"
          />
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-[#0754D8]" />
            <span>Verificando acesso...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2a5e] via-[#103778] to-[#0754D8] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Topo: Voltar ao site */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full ring-1 ring-white/15 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao site público</span>
        </Link>
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-blue-200/80">
          <ShieldCheck className="w-4 h-4 text-[#5aa2ff]" />
          <span>Ambiente Seguro SSL</span>
        </div>
      </div>

      {/* Card Central de Login */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 border border-white/20 p-7 sm:p-9 backdrop-blur-md">
          {/* Logo e Cabeçalho */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center p-2 mb-3">
              <Image
                src="/logo-mg-navy.png"
                alt="MG Climatização"
                width={1019}
                height={403}
                priority
                className="h-12 w-auto"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#103778] font-[family-name:var(--font-heading)]">
              Acesso ao Sistema
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Painel interno de gestão operacional, ordens de serviço e financeiro
            </p>
          </div>

          {/* Alerta de Erro */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs font-semibold text-red-700 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#103778] uppercase tracking-wider mb-1.5">
                E-mail de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@mgclimatizacao.com.br"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#0754D8] focus:ring-2 focus:ring-[#0754D8]/20 outline-hidden text-sm font-semibold text-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#103778] uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 focus:border-[#0754D8] focus:ring-2 focus:ring-[#0754D8]/20 outline-hidden text-sm font-semibold text-slate-800 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0754D8] hover:bg-[#0642aa] text-white py-3.5 px-5 text-sm font-bold shadow-lg shadow-[#0754D8]/30 transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Aviso de Sistema Privado (Sem cadastro público) */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-500">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Sistema exclusivo para técnicos autorizados</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Não possui acesso? Solicite suas credenciais diretamente ao administrador da MG Climatização.
            </p>
          </div>
        </div>
      </div>

      {/* Rodapé sutil */}
      <div className="w-full max-w-6xl mx-auto text-center text-xs text-white/50 py-2">
        © 2026 MG Climatização • Todos os direitos reservados.
      </div>
    </div>
  );
}

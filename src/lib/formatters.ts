/**
 * Utilitários de Formatação para MG Climatização & Elétrica
 * Moeda em Reais (R$), Datas DD/MM/AAAA, Telefones brasileiros e links rápidos
 */

export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value || 0);
  if (isNaN(num)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
export const formatCurrencyBRL = formatCurrency;

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}
export const formatDateBR = formatDate;

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function cleanPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = cleanPhone(phone);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Máscara dinâmica para inputs de Telefone / WhatsApp enquanto o usuário digita:
 * - Fixo (10 dígitos): (92) 3234-5678
 * - Celular/WhatsApp (11 dígitos): (92) 99123-4567
 */
export function maskPhone(value: string | null | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Máscara dinâmica para inputs de CPF (11 dígitos) e CNPJ (14 dígitos)
 */
export function maskCpfCnpj(value: string | null | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export function getWhatsAppLink(phone: string | null | undefined, message?: string): string {
  const digits = cleanPhone(phone);
  if (!digits) return '#';
  const countryCode = digits.startsWith('55') ? digits : `55${digits}`;
  const encodedMsg = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${countryCode}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
}

export function getGoogleMapsLink(address: {
  street?: string;
  number?: string;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}): string {
  const parts = [
    address.street,
    address.number,
    address.neighborhood,
    address.city,
    address.state,
  ].filter(Boolean);
  const query = encodeURIComponent(parts.join(', '));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function calculateNextCleaningDate(fromDateStr: string, intervalMonths: number = 6): string {
  try {
    const parts = fromDateStr.split('T')[0].split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const d = new Date(year, month, day);
    d.setMonth(d.getMonth() + intervalMonths);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  } catch {
    return fromDateStr;
  }
}

export type MaintenanceUrgency = 'overdue' | 'today' | 'soon_15' | 'ok' | 'none';

export function getMaintenanceUrgency(nextCleaningDate: string | null | undefined): {
  urgency: MaintenanceUrgency;
  label: string;
  badgeClass: string;
  daysRemaining: number | null;
} {
  if (!nextCleaningDate) {
    return {
      urgency: 'none',
      label: 'Não definida',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      daysRemaining: null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = nextCleaningDate.split('T')[0].split('-');
  const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      urgency: 'overdue',
      label: `Atrasada (${Math.abs(diffDays)}d)`,
      badgeClass: 'bg-red-50 text-red-700 border-red-200 font-semibold',
      daysRemaining: diffDays,
    };
  }
  if (diffDays === 0) {
    return {
      urgency: 'today',
      label: 'Vence Hoje!',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold animate-pulse',
      daysRemaining: 0,
    };
  }
  if (diffDays <= 15) {
    return {
      urgency: 'soon_15',
      label: `Vence em ${diffDays}d`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      daysRemaining: diffDays,
    };
  }
  return {
    urgency: 'ok',
    label: `Em dia (${diffDays}d)`,
    badgeClass: 'bg-blue-50 text-[#0754D8] border-blue-100',
    daysRemaining: diffDays,
  };
}

export function formatEquipmentType(type: string): string {
  const map: Record<string, string> = {
    split: 'Split Hi-Wall',
    inverter: 'Split Inverter',
    cassete: 'Cassete',
    janela: 'Ar de Janela (ACJ)',
    piso_teto: 'Piso Teto',
    multi_split: 'Multi Split',
  };
  return map[type] || type;
}

export function formatOrderStatus(status: string): { label: string; color: string; bg: string; border: string } {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    open: { label: 'Aberta', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    scheduled: { label: 'Agendada', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
    confirmed: { label: 'Confirmada', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    in_progress: { label: 'Em Atendimento', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    awaiting_quote: { label: 'Aguardando Orçamento', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
    awaiting_parts: { label: 'Aguardando Peça', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
    completed: { label: 'Concluída', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    cancelled: { label: 'Cancelada', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  };
  return map[status] || { label: status, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' };
}

export function formatAppointmentStatus(status: string): { label: string; color: string; bg: string } {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    requested: { label: 'Solicitado', color: 'text-amber-700', bg: 'bg-amber-50' },
    awaiting_confirmation: { label: 'Aguardando Confirmação', color: 'text-yellow-700', bg: 'bg-yellow-50' },
    confirmed: { label: 'Confirmado', color: 'text-blue-700', bg: 'bg-blue-50' },
    in_transit: { label: 'Em Deslocamento', color: 'text-purple-700', bg: 'bg-purple-50' },
    in_progress: { label: 'Em Atendimento', color: 'text-orange-700', bg: 'bg-orange-50' },
    completed: { label: 'Concluído', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    cancelled: { label: 'Cancelado', color: 'text-rose-700', bg: 'bg-rose-50' },
    missed: { label: 'Não Realizado', color: 'text-red-700', bg: 'bg-red-50' },
  };
  return map[status] || { label: status, color: 'text-slate-700', bg: 'bg-slate-50' };
}

export function formatQuoteStatus(status: string): { label: string; color: string; bg: string; border: string } {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    draft: { label: 'Rascunho', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
    sent: { label: 'Enviado', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    awaiting_approval: { label: 'Aguardando Aprovação', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    approved: { label: 'Aprovado', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    rejected: { label: 'Recusado', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
    expired: { label: 'Expirado', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
    cancelled: { label: 'Cancelado', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
  };
  return map[status] || { label: status, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' };
}


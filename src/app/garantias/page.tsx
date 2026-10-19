'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  AirVent,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  ArrowRight,
  FileText,
  X,
  MessageCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  getWarrantyTerms,
  getServiceOrders,
  createWarrantyTerm,
} from '@/lib/api';
import { WarrantyTerm, WarrantyType, ServiceOrder } from '@/lib/types';
import { formatDate } from '@/lib/formatters';

export default function GarantiasPage() {
  const [terms, setTerms] = useState<WarrantyTerm[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Novo Termo
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);

  const [formData, setFormData] = useState<{
    service_order_id: string;
    warranty_type: WarrantyType;
    duration_days: number;
    coverage_details: string;
    exclusions: string;
    notes: string;
  }>({
    service_order_id: '',
    warranty_type: 'servico',
    duration_days: 90,
    coverage_details:
      'Garantia legal e contratual sobre os serviços de instalação, limpeza técnica e mão de obra executada conforme Ordem de Serviço.',
    exclusions:
      'A garantia perde a validade em caso de intervenção ou conserto realizado por terceiros não autorizados, descargas atmosféricas/raios, picos e oscilações severas na rede elétrica da concessionária.',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [termsData, ordersData] = await Promise.all([
        getWarrantyTerms(),
        getServiceOrders(),
      ]);
      setTerms(termsData);
      setServiceOrders(ordersData);
    } catch (err) {
      console.error('Erro ao buscar garantias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOrderChange = (orderId: string) => {
    const ord = serviceOrders.find((o) => o.id === orderId) || null;
    setSelectedOrder(ord);
    setFormData((prev) => ({
      ...prev,
      service_order_id: orderId,
      coverage_details: ord
        ? `Garantia técnica referente aos serviços executados na O.S. ${ord.code} (${ord.problem_description || 'Serviço prestado'}), cobrindo estanqueidade de conexões, funcionamento dos componentes e mão de obra.`
        : prev.coverage_details,
    }));
  };

  const handleCreateWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.service_order_id || !selectedOrder) return;

    setSubmitting(true);
    try {
      await createWarrantyTerm({
        service_order_id: selectedOrder.id,
        customer_id: selectedOrder.customer_id,
        equipment_id: selectedOrder.equipment_id || undefined,
        warranty_type: formData.warranty_type,
        duration_days: Number(formData.duration_days),
        coverage_details: formData.coverage_details,
        exclusions: formData.exclusions,
        notes: formData.notes,
      });

      setShowModal(false);
      setSelectedOrder(null);
      await loadData();
    } catch (err) {
      console.error('Erro ao emitir termo de garantia:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTerms = terms.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const code = t.code.toLowerCase();
    const customer = t.customer?.name?.toLowerCase() || '';
    const os = t.service_order?.code?.toLowerCase() || '';
    return code.includes(q) || customer.includes(q) || os.includes(q);
  });

  const isExpired = (endDateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return endDateStr < today;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#103778] flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-[#0754D8]" />
              <span>Certificados de Garantia</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Emissão formal de termos de garantia de 30 a 90 dias com cobertura, exclusões e envio ao cliente
            </p>
          </div>

          <button
            onClick={() => {
              if (serviceOrders.length > 0) {
                handleOrderChange(serviceOrders[0].id);
              }
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white py-2.5 px-4 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Certificado de Garantia</span>
          </button>
        </div>

        {/* SEARCH */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código (GAR-2026-XXXX), cliente ou número de O.S...."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-hidden focus:border-[#0754D8]"
          />
        </div>

        {/* LIST */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Carregando termos de garantia...</div>
        ) : filteredTerms.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#103778]">Nenhum termo de garantia emitido</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Emita certificados formais para transmitir segurança aos clientes após a conclusão de instalações e manutenções.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerms.map((term) => {
              const expired = isExpired(term.end_date);
              return (
                <div
                  key={term.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-[#0754D8]/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-[#0754D8] bg-[#EAF3FF] px-2.5 py-1 rounded-md">
                        {term.code}
                      </span>

                      {expired ? (
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Expirado
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Vigente ({term.duration_days} dias)
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-[#103778] text-base mt-2">
                      {term.customer?.name}
                    </h3>

                    {term.service_order && (
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Referente a O.S.: </span>
                        <Link
                          href={`/ordens/${term.service_order.id}`}
                          className="font-semibold text-[#0754D8] hover:underline"
                        >
                          {term.service_order.code}
                        </Link>
                      </p>
                    )}

                    {term.equipment && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <AirVent className="w-3.5 h-3.5 text-slate-400" />
                        <span>{term.equipment.environment} ({term.equipment.brand || 'Ar Split'})</span>
                      </p>
                    )}

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Início:</span>
                        <span className="font-semibold">{formatDate(term.start_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Validade Até:</span>
                        <span className={`font-bold ${expired ? 'text-slate-400' : 'text-emerald-700'}`}>
                          {formatDate(term.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex gap-2">
                    <Link
                      href={`/garantias/${term.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#0754D8] hover:bg-[#0642aa] text-white py-2 px-3 rounded-xl text-xs font-semibold transition-all shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Ver Certificado Timbrado</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: NOVO CERTIFICADO */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-lg text-[#103778] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0754D8]" />
                  <span>Emitir Termo de Garantia</span>
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateWarranty} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selecione a Ordem de Serviço *
                  </label>
                  <select
                    required
                    value={formData.service_order_id}
                    onChange={(e) => handleOrderChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0754D8] focus:outline-hidden"
                  >
                    <option value="">Selecione uma O.S.</option>
                    {serviceOrders.map((os) => (
                      <option key={os.id} value={os.id}>
                        {os.code} - {os.customer?.name} ({os.problem_description || 'Serviço'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tipo de Garantia
                    </label>
                    <select
                      value={formData.warranty_type}
                      onChange={(e) =>
                        setFormData({ ...formData, warranty_type: e.target.value as WarrantyType })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0754D8] focus:outline-hidden"
                    >
                      <option value="servico">Mão de Obra / Serviço</option>
                      <option value="instalacao">Instalação Completa</option>
                      <option value="peca">Peça / Componente</option>
                      <option value="geral">Geral (Peça + Serviço)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prazo de Vigência
                    </label>
                    <div className="flex gap-1.5">
                      {[30, 90, 180].map((days) => (
                        <button
                          type="button"
                          key={days}
                          onClick={() => setFormData({ ...formData, duration_days: days })}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                            formData.duration_days === days
                              ? 'bg-[#103778] text-white border-[#103778]'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {days}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cobertura Técnica Assegurada *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.coverage_details}
                    onChange={(e) =>
                      setFormData({ ...formData, coverage_details: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Exclusões e Hipóteses de Perda da Garantia
                  </label>
                  <textarea
                    rows={3}
                    value={formData.exclusions}
                    onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#0754D8] focus:outline-hidden"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#0754D8] text-white text-sm font-semibold hover:bg-[#0642aa] disabled:opacity-50"
                  >
                    {submitting ? 'Emitindo...' : 'Emitir Certificado'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

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
  Trash2,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getCustomers, deleteCustomer, updateCustomer } from '@/lib/api';
import { Customer, CustomerStatus } from '@/lib/types';
import {
  formatPhone,
  getWhatsAppLink,
  getGoogleMapsLink,
} from '@/lib/formatters';

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal de Edição de Cliente
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    document_cpf_cnpj: '',
    origin: '',
    status: 'active' as CustomerStatus,
    notes: '',
  });

  const openEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setCustomerForm({
      name: c.name || '',
      phone: c.phone || '',
      whatsapp: c.whatsapp || '',
      email: c.email || '',
      document_cpf_cnpj: c.document_cpf_cnpj || '',
      origin: c.origin || 'indicacao',
      status: c.status || 'active',
      notes: c.notes || '',
    });
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !customerForm.name.trim()) return;
    try {
      setSavingCustomer(true);
      await updateCustomer(editingCustomer.id, {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim() || null,
        whatsapp: customerForm.whatsapp.trim() || null,
        email: customerForm.email.trim() || null,
        document_cpf_cnpj: customerForm.document_cpf_cnpj.trim() || null,
        origin: customerForm.origin.trim() || null,
        status: customerForm.status,
        notes: customerForm.notes.trim() || null,
      });
      setEditingCustomer(null);
      await loadCustomers(search);
    } catch (err: any) {
      console.error('Erro ao atualizar cliente:', err);
      alert(err.message || 'Erro ao salvar alterações do cliente.');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await deleteCustomer(itemToDelete.id);
      setItemToDelete(null);
      await loadCustomers(search);
    } catch (err: any) {
      console.error('Erro ao excluir cliente:', err);
      alert(err.message || 'Erro ao excluir cliente.');
    } finally {
      setDeleting(false);
    }
  };

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

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditCustomer(c)}
                      className="p-2 rounded-xl text-slate-500 hover:text-[#0754D8] hover:bg-blue-50 border border-slate-200 transition-all active:scale-95"
                      title="Editar dados cadastrais do cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      href={`/clientes/${c.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#103778] hover:text-[#0754D8] bg-slate-50 hover:bg-[#EAF3FF] px-3 py-2 rounded-xl transition-all"
                    >
                      <span>Ver detalhes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(c)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all active:scale-95"
                      title="Excluir cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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

      {/* MODAL DE EDIÇÃO DE CLIENTE */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-[#0754D8]">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#103778]">Editar Cliente</h3>
                  <p className="text-xs text-slate-500">Altere contatos e dados sem afetar registros já existentes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="Nome do cliente ou empresa"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp (Principal)
                  </label>
                  <input
                    type="text"
                    value={customerForm.whatsapp}
                    onChange={(e) => setCustomerForm({ ...customerForm, whatsapp: e.target.value })}
                    placeholder="(84) 99999-9999"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone Secundário
                  </label>
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="(84) 3333-3333"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="cliente@email.com"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={customerForm.document_cpf_cnpj}
                    onChange={(e) => setCustomerForm({ ...customerForm, document_cpf_cnpj: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Origem do Cliente
                  </label>
                  <input
                    type="text"
                    value={customerForm.origin}
                    onChange={(e) => setCustomerForm({ ...customerForm, origin: e.target.value })}
                    placeholder="Ex: Indicação, Instagram, Google"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status do Cadastro
                  </label>
                  <select
                    value={customerForm.status}
                    onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value as CustomerStatus })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  >
                    <option value="active">Ativo (Em atendimento regular)</option>
                    <option value="archived">Arquivado (Inativo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações Gerais
                </label>
                <textarea
                  rows={3}
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                  placeholder="Instruções de acesso, preferências do cliente, etc."
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  disabled={savingCustomer}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0754D8] hover:bg-[#0642aa] text-white shadow-xs active:scale-95 transition-all disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingCustomer ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-3 bg-red-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Excluir Cliente</h3>
                <p className="text-xs text-slate-500">Ação irreversível com cascata</p>
              </div>
            </div>

            <div className="my-4 space-y-2">
              <p className="text-sm text-slate-600">
                Tem certeza que deseja excluir o cliente <strong className="text-slate-900">{itemToDelete.name}</strong>?
              </p>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                ⚠️ <strong>Atenção:</strong> Ao remover este cliente, todos os seus endereços, aparelhos de ar-condicionado cadastrados, orçamentos e históricos vinculados também serão removidos do sistema.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

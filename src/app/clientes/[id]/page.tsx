'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Users,
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  AirVent,
  Plus,
  ClipboardList,
  Calendar,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  FileText,
  Trash2,
  Edit2,
  Save,
  X,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  getCustomerById,
  getServiceOrders,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  deleteEquipment,
  updateCustomer,
  updateEquipment,
} from '@/lib/api';
import {
  Customer,
  ServiceOrder,
  Equipment,
  CustomerAddress,
  EquipmentType,
  EquipmentStatus,
  CustomerStatus,
} from '@/lib/types';
import {
  formatPhone,
  formatDate,
  formatCurrency,
  getWhatsAppLink,
  getGoogleMapsLink,
  getMaintenanceUrgency,
  formatOrderStatus,
  formatEquipmentType,
} from '@/lib/formatters';

function ClienteDetalheContent() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const [deletingEq, setDeletingEq] = useState(false);

  // Modal Edição Cliente
  const [showEditCustomer, setShowEditCustomer] = useState(false);
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

  // Modal para adicionar endereço extra
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newCity, setNewCity] = useState('Tangará');
  const [newState, setNewState] = useState('RN');
  const [newLabel, setNewLabel] = useState('Comercial');
  const [savingAddr, setSavingAddr] = useState(false);

  // Modal Edição Endereço
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [savingEditAddr, setSavingEditAddr] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'Tangará',
    state: 'RN',
    zip_code: '',
    reference_point: '',
    is_primary: false,
  });

  // Modal Edição Equipamento
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [savingEditEq, setSavingEditEq] = useState(false);
  const [equipmentForm, setEquipmentForm] = useState<{
    environment: string;
    type: EquipmentType;
    brand: string;
    model: string;
    btu_capacity: string | number;
    serial_number: string;
    installation_date: string;
    last_cleaning_date: string;
    maintenance_interval_months: number;
    status: EquipmentStatus;
    notes: string;
  }>({
    environment: '',
    type: 'split',
    brand: '',
    model: '',
    btu_capacity: '9000',
    serial_number: '',
    installation_date: '',
    last_cleaning_date: '',
    maintenance_interval_months: 6,
    status: 'active',
    notes: '',
  });

  async function loadData() {
    try {
      setLoading(true);
      const [cData, oData] = await Promise.all([
        getCustomerById(customerId),
        getServiceOrders({ customerId }),
      ]);
      setCustomer(cData);
      setOrders(oData);
    } catch (err) {
      console.error('Erro ao carregar detalhes do cliente:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (customerId) {
      loadData();
    }
  }, [customerId]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet || !newNumber) return;

    try {
      setSavingAddr(true);
      await addCustomerAddress({
        customer_id: customerId,
        label: newLabel,
        street: newStreet,
        number: newNumber,
        neighborhood: newNeighborhood,
        city: newCity,
        state: newState,
        is_primary: false,
      });
      setShowAddAddress(false);
      setNewStreet('');
      setNewNumber('');
      setNewNeighborhood('');
      loadData();
    } catch (err) {
      console.error('Erro ao adicionar endereço:', err);
    } finally {
      setSavingAddr(false);
    }
  };

  const handleConfirmDeleteEquipment = async () => {
    if (!equipmentToDelete) return;
    try {
      setDeletingEq(true);
      await deleteEquipment(equipmentToDelete.id);
      setEquipmentToDelete(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir equipamento.');
    } finally {
      setDeletingEq(false);
    }
  };

  const openEditCustomer = () => {
    if (!customer) return;
    setCustomerForm({
      name: customer.name || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      email: customer.email || '',
      document_cpf_cnpj: customer.document_cpf_cnpj || '',
      origin: customer.origin || 'indicacao',
      status: customer.status || 'active',
      notes: customer.notes || '',
    });
    setShowEditCustomer(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim()) return;
    try {
      setSavingCustomer(true);
      await updateCustomer(customerId, {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim() || null,
        whatsapp: customerForm.whatsapp.trim() || null,
        email: customerForm.email.trim() || null,
        document_cpf_cnpj: customerForm.document_cpf_cnpj.trim() || null,
        origin: customerForm.origin.trim() || null,
        status: customerForm.status,
        notes: customerForm.notes.trim() || null,
      });
      setShowEditCustomer(false);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao atualizar cliente:', err);
      alert(err.message || 'Erro ao salvar alterações do cliente.');
    } finally {
      setSavingCustomer(false);
    }
  };

  const openEditAddress = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label || 'Principal',
      street: addr.street || '',
      number: addr.number || '',
      complement: addr.complement || '',
      neighborhood: addr.neighborhood || '',
      city: addr.city || 'Tangará',
      state: addr.state || 'RN',
      zip_code: addr.zip_code || '',
      reference_point: addr.reference_point || '',
      is_primary: addr.is_primary ?? false,
    });
  };

  const handleSaveEditAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddress || !addressForm.street.trim() || !addressForm.number.trim()) return;
    try {
      setSavingEditAddr(true);
      await updateCustomerAddress(editingAddress.id, {
        label: addressForm.label.trim() || 'Endereço',
        street: addressForm.street.trim(),
        number: addressForm.number.trim(),
        complement: addressForm.complement.trim() || null,
        neighborhood: addressForm.neighborhood.trim() || null,
        city: addressForm.city.trim() || 'Tangará',
        state: addressForm.state.trim() || 'RN',
        zip_code: addressForm.zip_code.trim() || null,
        reference_point: addressForm.reference_point.trim() || null,
        is_primary: addressForm.is_primary,
      });
      setEditingAddress(null);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao atualizar endereço:', err);
      alert(err.message || 'Erro ao atualizar endereço.');
    } finally {
      setSavingEditAddr(false);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!confirm('Deseja realmente excluir este endereço?')) return;
    try {
      await deleteCustomerAddress(addrId);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao excluir endereço:', err);
      alert(err.message || 'Erro ao excluir endereço.');
    }
  };

  const openEditEquipment = (eq: Equipment) => {
    setEditingEquipment(eq);
    setEquipmentForm({
      environment: eq.environment || '',
      type: eq.type || 'split',
      brand: eq.brand || '',
      model: eq.model || '',
      btu_capacity: eq.btu_capacity ? String(eq.btu_capacity) : '9000',
      serial_number: eq.serial_number || '',
      installation_date: eq.installation_date || '',
      last_cleaning_date: eq.last_cleaning_date || '',
      maintenance_interval_months: eq.maintenance_interval_months || 6,
      status: eq.status || 'active',
      notes: eq.notes || '',
    });
  };

  const handleSaveEditEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment || !equipmentForm.environment.trim()) return;
    try {
      setSavingEditEq(true);
      await updateEquipment(editingEquipment.id, {
        environment: equipmentForm.environment.trim(),
        type: equipmentForm.type,
        brand: equipmentForm.brand.trim() || null,
        model: equipmentForm.model.trim() || null,
        btu_capacity: equipmentForm.btu_capacity ? parseInt(String(equipmentForm.btu_capacity), 10) : null,
        serial_number: equipmentForm.serial_number.trim() || null,
        installation_date: equipmentForm.installation_date || null,
        last_cleaning_date: equipmentForm.last_cleaning_date || null,
        maintenance_interval_months: Number(equipmentForm.maintenance_interval_months) || 6,
        status: equipmentForm.status,
        notes: equipmentForm.notes.trim() || null,
      });
      setEditingEquipment(null);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao atualizar aparelho:', err);
      alert(err.message || 'Erro ao atualizar aparelho.');
    } finally {
      setSavingEditEq(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-slate-400 text-sm">
          Carregando dados do cliente...
        </div>
      </AppLayout>
    );
  }

  if (!customer) {
    return (
      <AppLayout>
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-700">Cliente não encontrado</h2>
          <Link
            href="/clientes"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#0754D8] bg-[#EAF3FF] px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Clientes</span>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const phone = customer.whatsapp || customer.phone;
  const waLink = getWhatsAppLink(phone, `Olá, ${customer.name}! Sou da MG Climatização.`);

  return (
    <AppLayout>
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/clientes"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0754D8] hover:border-[#0754D8] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-[#103778] tracking-tight">
                {customer.name}
              </h1>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  customer.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {customer.status === 'active' ? 'Ativo' : 'Arquivado'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cadastrado em {formatDate(customer.created_at)} • Origem: {customer.origin || 'Não informada'}
            </p>
          </div>
        </div>

        {/* Ações Diretas */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botão Editar Cliente */}
          <button
            type="button"
            onClick={openEditCustomer}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all"
            title="Editar informações cadastrais do cliente"
          >
            <Edit2 className="w-4 h-4 text-[#0754D8]" />
            <span>Editar Cliente</span>
          </button>

          {phone && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          )}
          <Link
            href={`/ordens/nova?customerId=${customer.id}`}
            className="flex items-center gap-1.5 bg-[#0754D8] hover:bg-[#0642aa] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Criar O.S.</span>
          </Link>
          <Link
            href={`/agenda/novo?customerId=${customer.id}`}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-[#103778] border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all"
          >
            <Calendar className="w-4 h-4 text-[#0754D8]" />
            <span>Agendar</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA: CONTATO E ENDEREÇOS */}
        <div className="space-y-6">
          {/* Card Contato */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#103778] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0754D8]" />
                <span>Contatos e Informações</span>
              </h3>
              <button
                type="button"
                onClick={openEditCustomer}
                className="text-[11px] font-bold text-[#0754D8] hover:underline flex items-center gap-1"
                title="Editar dados cadastrais"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              {customer.phone && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Telefone</span>
                  <span className="font-semibold text-slate-800">{formatPhone(customer.phone)}</span>
                </div>
              )}
              {customer.whatsapp && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">WhatsApp</span>
                  <span className="font-semibold text-slate-800">{formatPhone(customer.whatsapp)}</span>
                </div>
              )}
              {customer.email && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">E-mail</span>
                  <span className="font-semibold text-slate-800">{customer.email}</span>
                </div>
              )}
              {customer.document_cpf_cnpj && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">CPF / CNPJ</span>
                  <span className="font-mono text-slate-800">{customer.document_cpf_cnpj}</span>
                </div>
              )}
              {customer.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Observações</span>
                  <p className="text-slate-700 italic mt-0.5">{customer.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Card Endereços de Atendimento */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#103778] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0754D8]" />
                <span>Endereços ({customer.addresses?.length || 0})</span>
              </h3>
              <button
                onClick={() => setShowAddAddress(true)}
                className="text-[11px] font-bold text-[#0754D8] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>

            {customer.addresses && customer.addresses.length > 0 ? (
              <div className="space-y-3">
                {customer.addresses.map((addr) => {
                  const mapsLink = getGoogleMapsLink(addr);
                  return (
                    <div
                      key={addr.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#103778]">{addr.label || 'Endereço'}</span>
                        {addr.is_primary && (
                          <span className="text-[10px] bg-[#EAF3FF] text-[#0754D8] font-bold px-2 py-0.5 rounded-md">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700">
                        {addr.street}, {addr.number}
                        {addr.complement ? ` (${addr.complement})` : ''}
                      </p>
                      <p className="text-slate-500">
                        {addr.neighborhood} - {addr.city}/{addr.state}
                      </p>
                      {addr.reference_point && (
                        <p className="text-slate-400 text-[11px] mt-1 italic">
                          Ref: {addr.reference_point}
                        </p>
                      )}
                      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditAddress(addr)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-[#0754D8] transition-colors"
                            title="Editar este endereço"
                          >
                            <Edit2 className="w-3 h-3 text-[#0754D8]" />
                            <span>Editar</span>
                          </button>
                          {customer.addresses && customer.addresses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-600 transition-colors"
                              title="Excluir endereço"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <a
                          href={mapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0754D8] hover:underline"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>Abrir no Maps</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Nenhum endereço cadastrado</p>
            )}

            {/* Modal Adicionar Endereço */}
            {showAddAddress && (
              <form onSubmit={handleAddAddress} className="mt-3 p-3.5 rounded-xl border border-[#0754D8]/30 bg-[#EAF3FF]/30 space-y-2.5">
                <span className="block text-xs font-bold text-[#103778]">Novo Endereço</span>
                <input
                  type="text"
                  placeholder="Identificação (Ex: Casa, Escritório)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Rua / Avenida *"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Número *"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Bairro"
                    value={newNeighborhood}
                    onChange={(e) => setNewNeighborhood(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddr}
                    className="text-xs bg-[#0754D8] text-white font-semibold px-3 py-1.5 rounded-lg"
                  >
                    {savingAddr ? 'Salvando...' : 'Salvar Endereço'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: EQUIPAMENTOS DE AR-CONDICIONADO & HISTÓRICO DE O.S. (OCUPA 2 COLUNAS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SEÇÃO 1: AR-CONDICIONADO INSTALADOS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-[#0754D8]">
                  <AirVent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#103778]">Aparelhos de Ar-Condicionado</h3>
                  <p className="text-xs text-slate-500">Histórico de higienização e manutenção preventiva</p>
                </div>
              </div>
              <Link
                href={`/equipamentos/novo?customerId=${customer.id}`}
                className="inline-flex items-center gap-1.5 bg-[#0754D8] hover:bg-[#0642aa] text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Aparelho</span>
              </Link>
            </div>

            {customer.equipment && customer.equipment.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customer.equipment.map((eq) => {
                  const urgency = getMaintenanceUrgency(eq.next_cleaning_date);
                  return (
                    <div
                      key={eq.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-[#EAF3FF]/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-bold text-sm text-[#103778]">
                            {eq.environment}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md border ${urgency.badgeClass}`}
                          >
                            {urgency.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium">
                          {eq.brand || 'Marca não informada'} • {formatEquipmentType(eq.type)}
                        </p>
                        {eq.btu_capacity && (
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            {eq.btu_capacity.toLocaleString('pt-BR')} BTU/h
                          </p>
                        )}
                        <div className="mt-3 space-y-1 text-[11px] text-slate-500 border-t border-slate-200 pt-2">
                          <div>
                            Última Limpeza: <span className="font-semibold text-slate-700">{formatDate(eq.last_cleaning_date)}</span>
                          </div>
                          <div>
                            Próxima Limpeza: <span className="font-semibold text-[#0754D8]">{formatDate(eq.next_cleaning_date)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditEquipment(eq)}
                            className="text-xs font-semibold text-slate-600 hover:text-[#0754D8] hover:bg-blue-50 py-1 px-2 rounded-lg transition-colors flex items-center gap-1"
                            title="Editar este ar-condicionado"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#0754D8]" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEquipmentToDelete(eq)}
                            className="text-xs font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 py-1 px-2 rounded-lg transition-colors flex items-center gap-1"
                            title="Excluir este ar-condicionado"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        </div>

                        <Link
                          href={`/ordens/nova?customerId=${customer.id}&equipmentId=${eq.id}`}
                          className="text-xs font-bold text-[#0754D8] hover:underline inline-flex items-center gap-1"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Abrir O.S.</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <AirVent className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">Nenhum ar-condicionado cadastrado</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Adicione os aparelhos para rastrear os períodos de limpeza e manutenções.</p>
                <Link
                  href={`/equipamentos/novo?customerId=${customer.id}`}
                  className="inline-flex items-center gap-1 mt-2.5 text-xs font-bold text-[#0754D8] bg-[#EAF3FF] px-3 py-1.5 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Equipamento</span>
                </Link>
              </div>
            )}
          </div>

          {/* SEÇÃO 2: HISTÓRICO DE ORDENS DE SERVIÇO */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#103778]">Ordens de Serviço ({orders.length})</h3>
                  <p className="text-xs text-slate-500">Histórico de atendimentos executados e em andamento</p>
                </div>
              </div>
              <Link
                href={`/ordens/nova?customerId=${customer.id}`}
                className="inline-flex items-center gap-1.5 bg-[#0754D8] text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova O.S.</span>
              </Link>
            </div>

            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((ord) => {
                  const statusInfo = formatOrderStatus(ord.status);
                  return (
                    <Link
                      key={ord.id}
                      href={`/ordens/${ord.id}`}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-[#EAF3FF]/30 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 block"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0754D8] font-mono">
                            {ord.code}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${statusInfo.bg} ${statusInfo.color} border ${statusInfo.border}`}
                          >
                            {statusInfo.label}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 uppercase">
                            • {ord.category === 'climatizacao' ? 'Climatização' : 'Elétrica'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium mt-1">
                          {ord.problem_description || 'Serviço sob demanda'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Criada em: {formatDate(ord.created_at)}
                          {ord.completed_at ? ` • Concluída em: ${formatDate(ord.completed_at)}` : ''}
                        </p>
                      </div>

                      <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                        <span className="text-sm font-extrabold text-[#103778] block">
                          {formatCurrency(ord.total_amount)}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {ord.payment_status === 'paid' ? 'Pago' : ord.payment_status === 'partial' ? 'Parcial' : 'Pendente'}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">Nenhuma ordem de serviço registrada para este cliente</p>
                <Link
                  href={`/ordens/nova?customerId=${customer.id}`}
                  className="inline-flex items-center gap-1 mt-2.5 text-xs font-bold text-[#0754D8] bg-[#EAF3FF] px-3 py-1.5 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar Primeira Ordem de Serviço</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE APARELHO */}
      {equipmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-800 text-center">
              Excluir Ar-Condicionado?
            </h3>
            <p className="text-sm text-slate-500 text-center mt-2">
              Tem certeza que deseja remover o aparelho{' '}
              <strong className="text-slate-800">{equipmentToDelete.environment}</strong>
              {equipmentToDelete.brand ? ` (${equipmentToDelete.brand})` : ''} da ficha deste cliente?
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-3 text-center">
              Aviso: Os lembretes de higienização do radar associados a este aparelho também serão removidos.
            </p>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                disabled={deletingEq}
                onClick={() => setEquipmentToDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingEq}
                onClick={handleConfirmDeleteEquipment}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {deletingEq ? (
                  <span>Excluindo...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: EDITAR INFORMAÇÕES DO CLIENTE */}
      {showEditCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-[#0754D8]">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#103778]">Editar Informações do Cliente</h3>
                  <p className="text-xs text-slate-500">Altere contatos, documentos e notas sem perder dados</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditCustomer(false)}
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
                  onClick={() => setShowEditCustomer(false)}
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

      {/* MODAL 2: EDITAR ENDEREÇO */}
      {editingAddress && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-[#0754D8]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#103778]">Editar Endereço</h3>
                  <p className="text-xs text-slate-500">Corrija os dados de atendimento do imóvel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAddress(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAddress} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Identificação do Local
                </label>
                <input
                  type="text"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  placeholder="Ex: Casa, Escritório, Sede"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rua / Avenida *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  placeholder="Nome da rua ou avenida"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.number}
                    onChange={(e) => setAddressForm({ ...addressForm, number: e.target.value })}
                    placeholder="Nº ou S/N"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={addressForm.complement}
                    onChange={(e) => setAddressForm({ ...addressForm, complement: e.target.value })}
                    placeholder="Apto, Bloco, Sala"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={addressForm.neighborhood}
                    onChange={(e) => setAddressForm({ ...addressForm, neighborhood: e.target.value })}
                    placeholder="Bairro"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cidade / UF
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="Cidade"
                      className="col-span-2 w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                    />
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      placeholder="UF"
                      className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ponto de Referência
                </label>
                <input
                  type="text"
                  value={addressForm.reference_point}
                  onChange={(e) => setAddressForm({ ...addressForm, reference_point: e.target.value })}
                  placeholder="Ex: Próximo à praça central, em frente à farmácia"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.is_primary}
                    onChange={(e) => setAddressForm({ ...addressForm, is_primary: e.target.checked })}
                    className="rounded border-slate-300 text-[#0754D8] focus:ring-[#0754D8]"
                  />
                  <span className="text-xs font-medium text-slate-700">Definir como endereço principal</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAddress(null)}
                  disabled={savingEditAddr}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEditAddr}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0754D8] hover:bg-[#0642aa] text-white shadow-xs active:scale-95 transition-all disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingEditAddr ? 'Salvando...' : 'Salvar Endereço'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDITAR APARELHO DE AR-CONDICIONADO */}
      {editingEquipment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-[#0754D8]">
                  <AirVent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#103778]">Editar Ar-Condicionado</h3>
                  <p className="text-xs text-slate-500">Altere dados técnicos, ciclo preventivo e ambiente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEquipment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEquipment} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ambiente / Cômodo *
                  </label>
                  <input
                    type="text"
                    required
                    value={equipmentForm.environment}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, environment: e.target.value })}
                    placeholder="Ex: Suíte Master, Sala, Recepção"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Aparelho
                  </label>
                  <select
                    value={equipmentForm.type}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, type: e.target.value as EquipmentType })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  >
                    <option value="split">Split Hi-Wall</option>
                    <option value="inverter">Split Inverter</option>
                    <option value="cassete">Cassete</option>
                    <option value="piso_teto">Piso Teto</option>
                    <option value="janela">Janela (ACJ)</option>
                    <option value="multi_split">Multi Split</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={equipmentForm.brand}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, brand: e.target.value })}
                    placeholder="Ex: Gree, LG, Midea"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={equipmentForm.model}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, model: e.target.value })}
                    placeholder="Ex: Eco Garden"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Capacidade (BTUs)
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={equipmentForm.btu_capacity}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, btu_capacity: e.target.value })}
                    placeholder="Ex: 9000, 12000"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Série
                  </label>
                  <input
                    type="text"
                    value={equipmentForm.serial_number}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, serial_number: e.target.value })}
                    placeholder="Opcional"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Instalação
                  </label>
                  <input
                    type="date"
                    value={equipmentForm.installation_date}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, installation_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
              </div>

              {/* Bloco de Ciclo de Limpeza Preventiva */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <span className="block text-xs font-bold text-[#103778]">
                  Ciclo Preventivo & Lembrete de Higienização
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Data da Última Limpeza
                    </label>
                    <input
                      type="date"
                      value={equipmentForm.last_cleaning_date}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, last_cleaning_date: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Intervalo de Manutenção
                    </label>
                    <select
                      value={equipmentForm.maintenance_interval_months}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, maintenance_interval_months: Number(e.target.value) })}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value={3}>A cada 3 meses (Comércio intenso)</option>
                      <option value={6}>A cada 6 meses (Padrão residencial)</option>
                      <option value={12}>A cada 12 meses (Uso esporádico)</option>
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  * A próxima data de limpeza e o lembrete preventivo no WhatsApp serão recalculados automaticamente ao salvar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status do Aparelho
                  </label>
                  <select
                    value={equipmentForm.status}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, status: e.target.value as EquipmentStatus })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  >
                    <option value="active">Ativo (Em funcionamento)</option>
                    <option value="inactive">Inativo (Desativado / Aguardando troca)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notas Técnicas
                  </label>
                  <input
                    type="text"
                    value={equipmentForm.notes}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, notes: e.target.value })}
                    placeholder="Ex: Gás R410A, 220V"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0754D8]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEquipment(null)}
                  disabled={savingEditEq}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEditEq}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0754D8] hover:bg-[#0642aa] text-white shadow-xs active:scale-95 transition-all disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingEditEq ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function ClienteDetalhePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Carregando dados do cliente...</div>}>
      <ClienteDetalheContent />
    </Suspense>
  );
}

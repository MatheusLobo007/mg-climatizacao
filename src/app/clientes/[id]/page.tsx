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
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getCustomerById, getServiceOrders, addCustomerAddress, deleteEquipment } from '@/lib/api';
import { Customer, ServiceOrder, Equipment } from '@/lib/types';
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

  // Modal para adicionar endereço extra
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newCity, setNewCity] = useState('Manaus');
  const [newState, setNewState] = useState('AM');
  const [newLabel, setNewLabel] = useState('Comercial');
  const [savingAddr, setSavingAddr] = useState(false);

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
            <h3 className="text-sm font-bold text-[#103778] mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0754D8]" />
              <span>Contatos e Informações</span>
            </h3>

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
                      <div className="mt-2 pt-2 border-t border-slate-200 flex justify-end">
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
                        <button
                          type="button"
                          onClick={() => setEquipmentToDelete(eq)}
                          className="text-xs font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 py-1 px-2 rounded-lg transition-colors flex items-center gap-1"
                          title="Excluir este ar-condicionado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>

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

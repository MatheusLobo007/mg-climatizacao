'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ClipboardList,
  ArrowLeft,
  Users,
  MapPin,
  AirVent,
  Zap,
  Phone,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  DollarSign,
  AlertCircle,
  Sparkles,
  Trash2,
  Edit2,
  Save,
  X,
  Plus,
  RotateCcw,
  Receipt,
  Check,
  CheckSquare,
  Package,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  getServiceOrderById,
  completeServiceOrder,
  getCompanySettings,
  deleteServiceOrder,
  updateServiceOrder,
  getServiceCatalog,
} from '@/lib/api';
import {
  ServiceOrder,
  CompanySettings,
  ServiceCatalogItem,
  ServiceOrderStatus,
  PaymentStatus,
  ServiceCategory,
} from '@/lib/types';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  getWhatsAppLink,
  getGoogleMapsLink,
  formatOrderStatus,
  formatEquipmentType,
} from '@/lib/formatters';
import { LogoMG } from '@/components/brand/LogoMG';

const CLIMATIZACAO_CHECKLIST_ITEMS = [
  { key: 'inspecao_inicial', label: 'Avaliação inicial de ruídos, vibração e funcionamento do compressor' },
  { key: 'limpeza_filtros', label: 'Higienização e lavagem dos filtros de ar e carenagem plástica' },
  { key: 'bactericida_serpentina', label: 'Aplicação de produto bactericida e sanitizante na serpentina' },
  { key: 'turbina_bandeja', label: 'Limpeza profunda da turbina de ventilação e bandeja coletora' },
  { key: 'teste_dreno', label: 'Desobstrução do dreno e teste com água para verificar escoamento livre' },
  { key: 'unidade_externa', label: 'Inspeção e lavagem da serpentina da unidade condensadora externa' },
  { key: 'teste_eletrico_gas', label: 'Verificação da fiação, capacitor e teste de pressão do gás refrigerante' },
  { key: 'teste_temperatura', label: 'Medição da temperatura de insuflamento e retorno com termômetro' },
];

const ELETRICA_CHECKLIST_ITEMS = [
  { key: 'desligar_disjuntor', label: 'Desligamento seguro e bloqueio do circuito no quadro de luz (QDC)' },
  { key: 'teste_tensao', label: 'Teste de ausência de tensão elétrica com multímetro / chave teste' },
  { key: 'reaperto_conexoes', label: 'Reaperto de bornes, barramentos e inspeção de fiação superaquecida' },
  { key: 'teste_aterramento', label: 'Verificação do condutor de proteção (fio terra) e continuidade' },
  { key: 'substituicao_pecas', label: 'Instalação / substituição correta dos componentes e conectores' },
  { key: 'teste_funcionamento', label: 'Religamento seguro e teste de funcionamento sob carga normal' },
];

function OrdemDetalheContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [closing, setClosing] = useState(false);
  const [closeSuccess, setCloseSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Estados do Modal de Edição Completa da O.S. & Financeiro
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTab, setEditTab] = useState<'finance' | 'general' | 'items'>('finance');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // Campos de Edição Geral
  const [editStatus, setEditStatus] = useState<ServiceOrderStatus>('open');
  const [editCategory, setEditCategory] = useState<ServiceCategory>('climatizacao');
  const [editTechnician, setEditTechnician] = useState('');
  const [isCustomEditTech, setIsCustomEditTech] = useState(false);
  const [editScheduledDate, setEditScheduledDate] = useState('');
  const [editIsCleaning, setEditIsCleaning] = useState(false);
  const [editProblem, setEditProblem] = useState('');
  const [editDiagnosis, setEditDiagnosis] = useState('');
  const [editRecommendations, setEditRecommendations] = useState('');
  const [editWarranty, setEditWarranty] = useState('');

  // Campos de Edição Financeira (Destaque Principal)
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('pending');
  const [editPaymentMethod, setEditPaymentMethod] = useState('Pix');
  const [editTotalServices, setEditTotalServices] = useState('0');
  const [editTotalMaterials, setEditTotalMaterials] = useState('0');
  const [editDiscount, setEditDiscount] = useState('0');
  const [editTotalAmount, setEditTotalAmount] = useState('0');
  const [editAmountPaid, setEditAmountPaid] = useState('0');

  // Itens da O.S. na Edição
  const [editItems, setEditItems] = useState<
    Array<{
      id?: string;
      item_type: 'service' | 'material';
      catalog_service_id?: string | null;
      name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>
  >([]);

  // Campos de Encerramento Rápido
  const [diagnosis, setDiagnosis] = useState('');
  const [clientRecs, setClientRecs] = useState('');
  const [warranty, setWarranty] = useState('90 dias de garantia sobre o serviço executado');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'partial' | 'paid'>('paid');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [amountPaid, setAmountPaid] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const [data, compData, catList] = await Promise.all([
        getServiceOrderById(orderId),
        getCompanySettings(),
        getServiceCatalog(),
      ]);
      setOrder(data);
      setCompany(compData);
      setCatalog(catList);

      if (data) {
        setDiagnosis(data.technical_diagnosis || '');
        setClientRecs(data.client_recommendations || '');
        if (data.warranty_terms) setWarranty(data.warranty_terms);
        setPaymentStatus(data.payment_status || 'paid');
        setPaymentMethod(data.payment_method || 'Pix');
        setAmountPaid(String(data.amount_paid || data.total_amount || 0));

        if (data.checklist_data) {
          setChecklist(data.checklist_data as Record<string, boolean>);
        } else {
          // Iniciar checklist padrão conforme a categoria
          if (data.category === 'climatizacao') {
            setChecklist({
              'inspecao_inicial': true,
              'limpeza_filtros': true,
              'bactericida_serpentina': true,
              'turbina_bandeja': true,
              'teste_dreno': true,
              'unidade_externa': true,
              'teste_temperatura': true,
            });
          } else {
            setChecklist({
              'desligar_disjuntor': true,
              'teste_tensao': true,
              'reaperto_conexoes': true,
              'teste_aterramento': true,
              'teste_funcionamento': true,
            });
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar O.S.:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (orderId) {
      loadData();
    }
  }, [orderId]);

  const currentChecklistItems = order?.category === 'climatizacao' ? CLIMATIZACAO_CHECKLIST_ITEMS : ELETRICA_CHECKLIST_ITEMS;
  const checkedChecklistCount = currentChecklistItems.filter((i) => !!checklist[i.key]).length;
  const totalChecklistCount = currentChecklistItems.length;
  const areAllChecklistChecked = totalChecklistCount > 0 && checkedChecklistCount === totalChecklistCount;

  const toggleChecklistItem = async (key: string) => {
    if (order?.status === 'completed') return;
    const nextChecklist = {
      ...checklist,
      [key]: !checklist[key],
    };
    setChecklist(nextChecklist);
    if (order?.id) {
      try {
        await updateServiceOrder(order.id, { checklist_data: nextChecklist });
      } catch (e) {
        console.error('Erro ao salvar item do checklist:', e);
      }
    }
  };

  const toggleAllChecklist = async () => {
    if (order?.status === 'completed') return;
    const shouldCheckAll = !areAllChecklistChecked;
    const nextChecklist = { ...checklist };

    currentChecklistItems.forEach((item) => {
      nextChecklist[item.key] = shouldCheckAll;
    });

    setChecklist(nextChecklist);
    if (order?.id) {
      try {
        await updateServiceOrder(order.id, { checklist_data: nextChecklist });
      } catch (e) {
        console.error('Erro ao salvar checklist completo:', e);
      }
    }
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    try {
      setClosing(true);
      const paid = parseFloat(amountPaid) || order.total_amount || 0;

      const success = await completeServiceOrder(order.id, {
        technical_diagnosis: diagnosis.trim() || undefined,
        client_recommendations: clientRecs.trim() || undefined,
        warranty_terms: warranty.trim() || undefined,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        amount_paid: paid,
        checklist_data: checklist,
      });

      if (success) {
        setCloseSuccess(true);
        loadData();
      }
    } catch (err) {
      console.error('Erro ao concluir O.S.:', err);
    } finally {
      setClosing(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!order) return;
    try {
      setDeleting(true);
      await deleteServiceOrder(order.id);
      router.push('/ordens');
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir ordem de serviço.');
      setDeleting(false);
    }
  };

  // Abrir Modal de Edição
  const openEditModal = (tab: 'finance' | 'general' | 'items' = 'finance') => {
    if (!order) return;
    setEditTab(tab);
    setEditStatus(order.status);
    setEditCategory(order.category);
    setEditTechnician(order.technician_name || '');
    setEditScheduledDate(order.scheduled_date ? order.scheduled_date.split('T')[0] : '');
    setEditIsCleaning(!!order.is_cleaning);
    setEditProblem(order.problem_description || '');
    setEditDiagnosis(order.technical_diagnosis || '');
    setEditRecommendations(order.client_recommendations || '');
    setEditWarranty(order.warranty_terms || '');
    setEditPaymentStatus(order.payment_status || 'pending');
    setEditPaymentMethod(order.payment_method || 'Pix');
    setEditTotalServices(String(order.total_services ?? 0));
    setEditTotalMaterials(String(order.total_materials ?? 0));
    setEditDiscount(String(order.discount ?? 0));
    setEditTotalAmount(String(order.total_amount ?? 0));
    setEditAmountPaid(String(order.amount_paid ?? 0));
    setEditItems(
      order.items
        ? order.items.map((i) => ({
            id: i.id,
            item_type: i.item_type,
            catalog_service_id: i.catalog_service_id,
            name: i.name,
            quantity: Number(i.quantity) || 1,
            unit_price: Number(i.unit_price) || 0,
            total_price: Number(i.total_price) || 0,
          }))
        : []
    );
    setShowEditModal(true);
  };

  // Abrir modal automaticamente se houver ?edit= na URL
  useEffect(() => {
    const editParam = searchParams.get('edit');
    if (editParam && order && !showEditModal) {
      openEditModal(editParam === 'items' ? 'items' : editParam === 'general' ? 'general' : 'finance');
    }
  }, [searchParams, order?.id]);

  // Recalcular totais a partir dos itens
  const handleRecalculateFromItems = (itemsList = editItems, currentDiscount = editDiscount) => {
    const serv = itemsList
      .filter((i) => i.item_type === 'service')
      .reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
    const mat = itemsList
      .filter((i) => i.item_type === 'material')
      .reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
    const disc = parseFloat(currentDiscount) || 0;
    const tot = Math.max(0, serv + mat - disc);

    setEditTotalServices(String(serv));
    setEditTotalMaterials(String(mat));
    setEditTotalAmount(String(tot));
  };

  // Atualizar campo financeiro com recálculo automático
  const updateFinanceField = (field: 'services' | 'materials' | 'discount', value: string) => {
    const serv = field === 'services' ? parseFloat(value) || 0 : parseFloat(editTotalServices) || 0;
    const mat = field === 'materials' ? parseFloat(value) || 0 : parseFloat(editTotalMaterials) || 0;
    const disc = field === 'discount' ? parseFloat(value) || 0 : parseFloat(editDiscount) || 0;

    if (field === 'services') setEditTotalServices(value);
    if (field === 'materials') setEditTotalMaterials(value);
    if (field === 'discount') setEditDiscount(value);

    const newTotal = Math.max(0, serv + mat - disc);
    setEditTotalAmount(String(newTotal));
  };

  // Atalho rápido de status de pagamento
  const handleSetQuickPayment = (status: PaymentStatus) => {
    setEditPaymentStatus(status);
    const tot = parseFloat(editTotalAmount) || 0;
    if (status === 'paid') {
      setEditAmountPaid(String(tot));
    } else if (status === 'pending') {
      setEditAmountPaid('0');
    }
  };

  // Manipulação de Itens no Modal
  const handleAddCatalogItem = (serviceId: string) => {
    const s = catalog.find((c) => c.id === serviceId);
    if (!s) return;
    const price = Number(s.default_price || 0);
    const newItem = {
      item_type: 'service' as const,
      catalog_service_id: s.id,
      name: s.name,
      quantity: 1,
      unit_price: price,
      total_price: price,
    };
    const updated = [...editItems, newItem];
    setEditItems(updated);
    handleRecalculateFromItems(updated);
  };

  const handleAddBlankItem = (type: 'service' | 'material') => {
    const newItem = {
      item_type: type,
      name: type === 'service' ? 'Novo Serviço' : 'Nova Peça / Insumo',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    };
    const updated = [...editItems, newItem];
    setEditItems(updated);
  };

  const handleRemoveEditItem = (index: number) => {
    const updated = editItems.filter((_, i) => i !== index);
    setEditItems(updated);
    handleRecalculateFromItems(updated);
  };

  const handleUpdateEditItem = (index: number, qty: number, unitPrice: number, name?: string) => {
    const updated = editItems.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          name: name !== undefined ? name : item.name,
          quantity: qty,
          unit_price: unitPrice,
          total_price: qty * unitPrice,
        };
      }
      return item;
    });
    setEditItems(updated);
    handleRecalculateFromItems(updated);
  };

  // Salvar Edição da Ordem de Serviço
  const handleSaveEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    try {
      setSavingEdit(true);
      const serv = parseFloat(editTotalServices) || 0;
      const mat = parseFloat(editTotalMaterials) || 0;
      const disc = parseFloat(editDiscount) || 0;
      const tot = parseFloat(editTotalAmount) || Math.max(0, serv + mat - disc);
      const paid = parseFloat(editAmountPaid) || 0;

      const updated = await updateServiceOrder(order.id, {
        status: editStatus,
        category: editCategory,
        technician_name: editTechnician.trim() || null,
        scheduled_date: editScheduledDate || null,
        is_cleaning: editIsCleaning,
        problem_description: editProblem.trim() || null,
        technical_diagnosis: editDiagnosis.trim() || null,
        client_recommendations: editRecommendations.trim() || null,
        warranty_terms: editWarranty.trim() || null,
        total_services: serv,
        total_materials: mat,
        discount: disc,
        total_amount: tot,
        payment_status: editPaymentStatus,
        payment_method: editPaymentMethod,
        amount_paid: paid,
        items: editItems,
      });

      setOrder(updated);
      setDiagnosis(updated.technical_diagnosis || '');
      setClientRecs(updated.client_recommendations || '');
      if (updated.warranty_terms) setWarranty(updated.warranty_terms);
      setPaymentStatus(updated.payment_status || 'paid');
      setPaymentMethod(updated.payment_method || 'Pix');
      setAmountPaid(String(updated.amount_paid || updated.total_amount || 0));

      setShowEditModal(false);
      setEditSuccessMsg('Ordem de Serviço e dados financeiros atualizados com sucesso!');
      setTimeout(() => setEditSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar alterações da Ordem de Serviço.');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-slate-400 text-sm">Carregando detalhes da O.S...</div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-700">Ordem de Serviço não encontrada</h2>
          <Link
            href="/ordens"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#0754D8] bg-[#EAF3FF] px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Ordens</span>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const statusInfo = formatOrderStatus(order.status);
  const phone = order.customer?.whatsapp || order.customer?.phone;
  const waMsg = `Olá, ${order.customer?.name}! Aqui é da MG Climatização a respeito da sua Ordem de Serviço ${order.code}.`;
  const waLink = getWhatsAppLink(phone, waMsg);
  const mapsLink = order.address ? getGoogleMapsLink(order.address) : null;
  const isCompleted = order.status === 'completed';

  return (
    <AppLayout>
      {/* CABEÇALHO FORMAL PARA IMPRESSÃO */}
      <div className="hidden print:flex items-center justify-between pb-6 mb-6 border-b border-slate-300">
        <LogoMG size="md" />
        <div className="text-right text-xs text-slate-600">
          <p className="font-bold text-sm text-[#103778]">{company?.name || 'MG Climatização'}</p>
          <p>{company?.slogan || 'Refrigeração, Climatização e Elétrica Residencial'}</p>
          <p>{company?.address || company?.city_state || 'Manaus - AM'} • Tel/WhatsApp: {company?.phone || company?.whatsapp || '(92) 99123-4567'}</p>
          {company?.cnpj_cpf && <p className="text-[11px] text-slate-500">CNPJ/CPF: {company.cnpj_cpf}</p>}
        </div>
      </div>

      {/* CABEÇALHO DA O.S. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/ordens"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0754D8] hover:border-[#0754D8] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-extrabold text-[#0754D8] font-mono tracking-tight">
                {order.code}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-md border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
              >
                {statusInfo.label}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase">
                • {order.category === 'climatizacao' ? 'Climatização' : 'Elétrica'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Criada em {formatDateTime(order.created_at)}
              {order.completed_at ? ` • Concluída em ${formatDateTime(order.completed_at)}` : ''}
            </p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* BOTÃO PRINCIPAL DE EDITAR O.S. & FINANCEIRO */}
          <button
            type="button"
            onClick={() => openEditModal('finance')}
            className="flex items-center gap-1.5 bg-[#103778] hover:bg-[#0754D8] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all print:hidden cursor-pointer"
            title="Editar valores financeiros, itens e dados técnicos da O.S."
          >
            <Edit2 className="w-4 h-4" />
            <span>Editar O.S. & Financeiro</span>
          </button>

          {phone && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          )}
          {mapsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all"
            >
              <MapPin className="w-4 h-4 text-[#0754D8]" />
              <span>Abrir Rota</span>
            </a>
          )}
          {isCompleted && (
            <Link
              href={`/garantias`}
              className="flex items-center gap-1.5 bg-[#EAF3FF] hover:bg-blue-100 text-[#0754D8] border border-[#0754D8]/30 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-[#0754D8]" />
              <span>Garantia</span>
            </Link>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all print:hidden"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir</span>
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all print:hidden"
            title="Excluir Ordem de Serviço"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>Excluir</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK DE EDIÇÃO BEM-SUCEDIDA */}
      {editSuccessMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#0754D8] shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-sm text-[#103778]">
              Atualização Confirmada!
            </h4>
            <p className="mt-0.5 font-medium">{editSuccessMsg}</p>
          </div>
        </div>
      )}

      {/* FEEDBACK DE CONCLUSÃO COM REGRA DE NEGÓCIO ATIVADA */}
      {closeSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-sm text-emerald-900">
              Ordem de Serviço Concluída com Sucesso!
            </h4>
            <p className="mt-0.5">
              {order.is_cleaning && order.equipment_id
                ? 'A data de última limpeza do aparelho foi atualizada para hoje e a próxima preventiva já foi recalculada automaticamente no radar da MG Climatização!'
                : 'O atendimento foi registrado no histórico do cliente e os valores foram consolidados no financeiro.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA: CLIENTE, LOCAL & EQUIPAMENTO */}
        <div className="space-y-6">
          {/* Card Cliente */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#103778] mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0754D8]" />
              <span>Dados do Cliente</span>
            </h3>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-sm text-[#103778]">
                {order.customer?.name}
              </p>
              {phone && (
                <p className="text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{phone}</span>
                </p>
              )}
              {order.address && (
                <p className="text-slate-600 flex items-start gap-1.5 pt-2 border-t border-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {order.address.street}, {order.address.number}
                    {order.address.complement ? ` (${order.address.complement})` : ''} -{' '}
                    {order.address.neighborhood}, {order.address.city}/{order.address.state}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Card Equipamento (se houver) */}
          {order.equipment && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-[#103778] mb-3 flex items-center gap-2">
                <AirVent className="w-4 h-4 text-[#0754D8]" />
                <span>Ar-Condicionado Atendido</span>
              </h3>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    {order.equipment.environment}
                  </span>
                  <span className="bg-[#EAF3FF] text-[#0754D8] font-bold text-[10px] px-2 py-0.5 rounded-md">
                    {formatEquipmentType(order.equipment.type)}
                  </span>
                </div>
                <p>
                  Marca: <span className="font-semibold text-slate-800">{order.equipment.brand || '—'}</span>
                </p>
                {order.equipment.btu_capacity && (
                  <p>
                    Capacidade: <span className="font-semibold text-slate-800">{order.equipment.btu_capacity.toLocaleString('pt-BR')} BTU/h</span>
                  </p>
                )}
                {order.is_cleaning && (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Higienização com recálculo automático ativo</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card Resumo Financeiro com Edição Direta */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#103778] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#0754D8]" />
                <span>Resumo Financeiro</span>
              </h3>
              <button
                type="button"
                onClick={() => openEditModal('finance')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0754D8] hover:text-[#0642aa] hover:bg-[#EAF3FF] px-2.5 py-1 rounded-lg border border-[#0754D8]/20 transition-all cursor-pointer shadow-2xs"
                title="Editar valores financeiros e forma de pagamento"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Financeiro</span>
              </button>
            </div>

            {/* Badge de Situação Financeira */}
            <div className="mb-3">
              {order.payment_status === 'paid' ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Pagamento Quitado (Totalmente Pago)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md text-emerald-900 font-extrabold">
                    100%
                  </span>
                </div>
              ) : order.payment_status === 'partial' ? (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Pagamento Parcial (Entrada Paga)</span>
                  </span>
                  <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded-md text-amber-900 font-extrabold">
                    Parcial
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Pagamento Pendente (A Receber)</span>
                  </span>
                  <span className="text-[10px] bg-red-100 px-2 py-0.5 rounded-md text-red-900 font-extrabold">
                    A Receber
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Serviços Realizados:</span>
                <span className="font-bold text-slate-800">{formatCurrency(order.total_services)}</span>
              </div>
              {Number(order.total_materials || 0) > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Peças / Materiais:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(order.total_materials)}</span>
                </div>
              )}
              {Number(order.discount || 0) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto Concedido:</span>
                  <span className="font-bold">- {formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-[#103778]">
                <span>Total Líquido da O.S.:</span>
                <span className="text-[#0754D8] text-base">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
                <span className="text-slate-500">Valor Efetivamente Pago:</span>
                <span className="font-bold text-emerald-700">{formatCurrency(order.amount_paid)}</span>
              </div>

              {Number(order.total_amount || 0) > Number(order.amount_paid || 0) && (
                <div className="flex justify-between text-xs bg-amber-50/90 p-2.5 rounded-xl border border-amber-200/80 font-semibold text-amber-800">
                  <span>Saldo Restante a Receber:</span>
                  <span className="font-extrabold text-amber-900">
                    {formatCurrency(Math.max(0, Number(order.total_amount || 0) - Number(order.amount_paid || 0)))}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-xs pt-1">
                <span className="text-slate-500">Forma de Pagamento:</span>
                <span className="font-semibold text-slate-700">{order.payment_method || 'A combinar'}</span>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-slate-400" />
                <span>Fluxo de Caixa</span>
              </span>
              <Link href="/financeiro" className="text-[#0754D8] font-bold hover:underline">
                Ver no Financeiro &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: CHECKLIST TÉCNICO & ENCERRAMENTO (OCUPA 2 COLUNAS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SEÇÃO 1: CHECKLIST TÉCNICO PROFISSIONAL */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#103778] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#0754D8]" />
                  <span>Checklist Técnico Operacional</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {checkedChecklistCount}/{totalChecklistCount} concluídos
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Marque os itens conferidos e testados durante a execução do serviço
                </p>
              </div>

              {!isCompleted && (
                <button
                  type="button"
                  onClick={toggleAllChecklist}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                    areAllChecklistChecked
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-[#EAF3FF] hover:bg-[#d6e7ff] text-[#0754D8] border-[#0754D8]/30 shadow-xs'
                  }`}
                  title={areAllChecklistChecked ? 'Desmarcar todos os itens' : 'Marcar todos os itens de uma vez'}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>{areAllChecklistChecked ? 'Desmarcar Todos' : 'Marcar Todos'}</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {currentChecklistItems.map((item) => (
                <label
                  key={item.key}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    checklist[item.key]
                      ? 'bg-[#EAF3FF]/40 border-[#0754D8]/30 text-[#103778]'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checklist[item.key]}
                    disabled={isCompleted}
                    onChange={() => toggleChecklistItem(item.key)}
                    className="w-4 h-4 text-[#0754D8] rounded border-slate-300 focus:ring-[#0754D8] mt-0.5 shrink-0 cursor-pointer"
                  />
                  <span className="text-xs font-semibold select-none leading-relaxed">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* SEÇÃO 2: ITENS DA ORDEM */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-[#103778] flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#0754D8]" />
                <span>Itens e Serviços Discriminados</span>
              </h3>
              <button
                type="button"
                onClick={() => openEditModal('items')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0754D8] hover:text-[#0642aa] hover:bg-[#EAF3FF] px-2.5 py-1 rounded-lg border border-[#0754D8]/20 transition-all cursor-pointer shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Gerenciar Itens</span>
              </button>
            </div>

            {order.items && order.items.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {order.items.map((i) => (
                  <div key={i.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{i.name}</span>
                      <span className="text-slate-400 text-[10px]">
                        {i.quantity} un x {formatCurrency(i.unit_price)}
                      </span>
                    </div>
                    <span className="font-bold text-[#103778]">
                      {formatCurrency(i.total_price)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Nenhum item discriminado.</p>
            )}
          </div>

          {/* SEÇÃO 3: ENCERRAMENTO E CONCLUSÃO DA O.S. */}
          {!isCompleted ? (
            <form onSubmit={handleCompleteOrder} className="bg-white rounded-2xl border border-[#0754D8]/30 p-5 sm:p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#0754D8]" />
                <h3 className="text-base font-bold text-[#103778]">
                  Finalizar e Concluir Ordem de Serviço
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Ao concluir, os históricos serão gravados e o ciclo de manutenção do equipamento será atualizado automaticamente.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diagnóstico Técnico / Serviços Efetivamente Executados
                </label>
                <textarea
                  rows={2}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Ex: Realizada desmontagem completa, lavagem química e carga de fluido. Pressões estabilizadas."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0754D8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recomendações e Orientações para o Cliente
                </label>
                <textarea
                  rows={2}
                  value={clientRecs}
                  onChange={(e) => setClientRecs(e.target.value)}
                  placeholder="Ex: Manter portas fechadas durante o uso; lavar telas quinzenalmente."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0754D8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Situação do Pagamento
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e: any) => setPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold text-[#103778]"
                  >
                    <option value="paid">Totalmente Pago</option>
                    <option value="partial">Pagamento Parcial (Entrada)</option>
                    <option value="pending">Pendente (A pagar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Recebido (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Termo de Garantia Informado
                </label>
                <input
                  type="text"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  placeholder="Ex: 90 dias sobre a mão de obra"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={closing}
                  className="inline-flex items-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white px-6 py-2.5 rounded-xl text-sm font-extrabold shadow-md active:scale-95 transition-all disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{closing ? 'Concluindo O.S...' : 'Concluir Atendimento'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white rounded-2xl border border-emerald-200 p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <h4 className="font-bold text-sm">Ordem Concluída e Arquivada</h4>
              </div>
              {order.technical_diagnosis && (
                <div className="text-xs text-slate-600">
                  <span className="font-semibold block text-slate-800">Diagnóstico Técnico Registrado:</span>
                  <p className="mt-0.5">{order.technical_diagnosis}</p>
                </div>
              )}
              {order.client_recommendations && (
                <div className="text-xs text-slate-600">
                  <span className="font-semibold block text-slate-800">Recomendações ao Cliente:</span>
                  <p className="mt-0.5">{order.client_recommendations}</p>
                </div>
              )}
              {order.warranty_terms && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-[#0754D8]" />
                  <span>Garantia: {order.warranty_terms}</span>
                </div>
              )}
            </div>
          )}

          {/* RODAPÉ E ASSINATURAS PARA RELATÓRIO TÉCNICO IMPRESSO */}
          <div className="hidden print:block pt-12 text-xs text-slate-600">
            <div className="grid grid-cols-2 gap-10 pt-10 text-center">
              <div>
                <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
                  {order.technician_name || 'Técnico MG Climatização'}
                </div>
                <p className="text-[10px] text-slate-400">Responsável Técnico</p>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
                  {order.customer?.name}
                </div>
                <p className="text-[10px] text-slate-400">Cliente / Recebimento do Serviço</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO COMPLETA DA ORDEM DE SERVIÇO & FINANCEIRO */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:hidden">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 my-6 max-h-[92vh] flex flex-col">
            {/* Header do Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#EAF3FF] text-[#0754D8]">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-[#103778]">
                      Editar Ordem de Serviço
                    </h3>
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#EAF3FF] text-[#0754D8]">
                      {order.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cliente: <strong className="text-slate-700">{order.customer?.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas do Modal */}
            <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-100 overflow-x-auto text-xs shrink-0">
              <button
                type="button"
                onClick={() => setEditTab('finance')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
                  editTab === 'finance'
                    ? 'bg-[#103778] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Financeiro & Pagamento</span>
              </button>
              <button
                type="button"
                onClick={() => setEditTab('general')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
                  editTab === 'general'
                    ? 'bg-[#103778] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Dados Técnicos & Status</span>
              </button>
              <button
                type="button"
                onClick={() => setEditTab('items')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
                  editTab === 'items'
                    ? 'bg-[#103778] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Itens da O.S. ({editItems.length})</span>
              </button>
            </div>

            {/* Formulário com Scroll Interno */}
            <form onSubmit={handleSaveEditOrder} className="flex flex-col flex-1 overflow-hidden pt-4">
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {/* ABA 1: FINANCEIRO & PAGAMENTO (DESTAQUE) */}
                {editTab === 'finance' && (
                  <div className="space-y-4">
                    {/* Seletor Rápido de Situação de Pagamento */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Situação do Pagamento da O.S.
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSetQuickPayment('paid')}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                            editPaymentStatus === 'paid'
                              ? 'bg-emerald-50/90 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <span className="font-extrabold text-xs block">Totalmente Pago</span>
                            <span className="text-[10px] text-emerald-700">Valor integral recebido</span>
                          </div>
                          {editPaymentStatus === 'paid' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetQuickPayment('partial')}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                            editPaymentStatus === 'partial'
                              ? 'bg-amber-50/90 border-amber-400 text-amber-900 ring-2 ring-amber-500/20'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <span className="font-extrabold text-xs block">Pagamento Parcial</span>
                            <span className="text-[10px] text-amber-700">Entrada ou sinal pago</span>
                          </div>
                          {editPaymentStatus === 'partial' && (
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetQuickPayment('pending')}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                            editPaymentStatus === 'pending'
                              ? 'bg-red-50/90 border-red-400 text-red-900 ring-2 ring-red-500/20'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <span className="font-extrabold text-xs block">Pendente (A Receber)</span>
                            <span className="text-[10px] text-red-700">Aguardando pagamento</span>
                          </div>
                          {editPaymentStatus === 'pending' && (
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Forma de Pagamento e Valor Pago */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Forma de Pagamento
                        </label>
                        <select
                          value={editPaymentMethod}
                          onChange={(e) => setEditPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-[#0754D8]"
                        >
                          <option value="Pix">Pix (Instantâneo)</option>
                          <option value="Dinheiro">Dinheiro em Espécie</option>
                          <option value="Cartão de Crédito">Cartão de Crédito</option>
                          <option value="Cartão de Débito">Cartão de Débito</option>
                          <option value="Transferência Bancária">Transferência Bancária / TED</option>
                          <option value="Boleto Bancário">Boleto Bancário</option>
                          <option value="A Combinar">A Combinar / Faturado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Valor Efetivamente Pago / Recebido (R$)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={editAmountPaid}
                            onChange={(e) => setEditAmountPaid(e.target.value)}
                            placeholder="0,00"
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold text-emerald-700 bg-white focus:ring-2 focus:ring-[#0754D8]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Valores Detalhados da O.S. */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                      <h4 className="text-xs font-extrabold text-[#103778] uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#0754D8]" />
                        <span>Composição dos Valores da O.S.</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Total de Serviços (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editTotalServices}
                            onChange={(e) => updateFinanceField('services', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Peças / Materiais (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editTotalMaterials}
                            onChange={(e) => updateFinanceField('materials', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Desconto (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editDiscount}
                            onChange={(e) => updateFinanceField('discount', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-red-600"
                          />
                        </div>
                      </div>

                      {/* Total Líquido Recalculado */}
                      <div className="p-3.5 rounded-xl bg-[#EAF3FF] border border-[#0754D8]/20 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-extrabold text-[#103778] block">
                            Total Líquido da Ordem de Serviço
                          </span>
                          <span className="text-[11px] text-[#0754D8]">
                            Serviços + Peças - Desconto
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-[#0754D8]">
                            {formatCurrency(parseFloat(editTotalAmount) || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Demonstrativo de Saldo Restante */}
                      {Math.max(0, (parseFloat(editTotalAmount) || 0) - (parseFloat(editAmountPaid) || 0)) > 0 ? (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs">
                          <span className="font-semibold flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Saldo Restante a Receber:</span>
                          </span>
                          <span className="font-black text-sm text-amber-800">
                            {formatCurrency(
                              Math.max(0, (parseFloat(editTotalAmount) || 0) - (parseFloat(editAmountPaid) || 0))
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Valor total integralmente quitado!</span>
                        </div>
                      )}
                    </div>

                    {/* Dica Informativa de Sincronização */}
                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-[11px] text-[#103778] flex items-start gap-2">
                      <Receipt className="w-4 h-4 text-[#0754D8] shrink-0 mt-0.5" />
                      <span>
                        <strong>Integração com Fluxo de Caixa:</strong> Qualquer ajuste no status de pagamento ou valores desta O.S. atualiza instantaneamente as receitas e o saldo a receber no módulo Financeiro da MG Climatização.
                      </span>
                    </div>
                  </div>
                )}

                {/* ABA 2: DADOS TÉCNICOS & STATUS */}
                {editTab === 'general' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Status da Ordem de Serviço
                        </label>
                        <select
                          value={editStatus}
                          onChange={(e: any) => setEditStatus(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold text-[#103778]"
                        >
                          <option value="open">Aberta (Em Espera)</option>
                          <option value="scheduled">Agendada</option>
                          <option value="confirmed">Confirmada</option>
                          <option value="in_progress">Em Execução</option>
                          <option value="awaiting_parts">Aguardando Peças</option>
                          <option value="awaiting_quote">Aguardando Orçamento</option>
                          <option value="completed">Concluída (Finalizada)</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Categoria do Serviço
                        </label>
                        <select
                          value={editCategory}
                          onChange={(e: any) => setEditCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                        >
                          <option value="climatizacao">Climatização / Ar-Condicionado</option>
                          <option value="eletrica">Elétrica Residencial / Comercial</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Técnico Responsável
                        </label>
                        {!isCustomEditTech ? (
                          <div className="flex gap-2">
                            <select
                              value={editTechnician}
                              onChange={(e) => {
                                if (e.target.value === '__custom__') {
                                  setIsCustomEditTech(true);
                                  setEditTechnician('');
                                } else {
                                  setEditTechnician(e.target.value);
                                }
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium text-slate-800 focus:border-[#0754D8] outline-none"
                            >
                              {(company?.technicians || ['Matheus Lobo', 'Técnico Auxiliar']).map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                              <option value="__custom__">+ Outro técnico (digitar nome)</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editTechnician}
                              onChange={(e) => setEditTechnician(e.target.value)}
                              placeholder="Nome do técnico..."
                              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#0754D8] outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomEditTech(false);
                                const defaultT = company?.default_technician || company?.technicians?.[0] || 'Matheus Lobo';
                                setEditTechnician(defaultT);
                              }}
                              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                            >
                              Lista
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Data do Atendimento / Agendamento
                        </label>
                        <input
                          type="date"
                          value={editScheduledDate}
                          onChange={(e) => setEditScheduledDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>
                    </div>

                    {/* Checkbox Higienização Preventiva */}
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsCleaning}
                        onChange={(e) => setEditIsCleaning(e.target.checked)}
                        className="w-4 h-4 text-[#0754D8] rounded border-slate-300 focus:ring-[#0754D8]"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        Esta O.S. inclui higienização/limpeza (recalcula ciclo preventivo do ar-condicionado ao concluir)
                      </span>
                    </label>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Descrição do Problema / Solicitação Inicial
                      </label>
                      <textarea
                        rows={2}
                        value={editProblem}
                        onChange={(e) => setEditProblem(e.target.value)}
                        placeholder="Ex: Ar não gela o ambiente, pingando água pelo dreno..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Diagnóstico Técnico / Serviços Efetivamente Realizados
                      </label>
                      <textarea
                        rows={2}
                        value={editDiagnosis}
                        onChange={(e) => setEditDiagnosis(e.target.value)}
                        placeholder="Ex: Realizada lavagem completa com bactericida, desobstrução e recarga de fluido R-410A."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Recomendações ao Cliente
                        </label>
                        <textarea
                          rows={2}
                          value={editRecommendations}
                          onChange={(e) => setEditRecommendations(e.target.value)}
                          placeholder="Ex: Manter portas fechadas durante o uso..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Termo de Garantia Informado
                        </label>
                        <textarea
                          rows={2}
                          value={editWarranty}
                          onChange={(e) => setEditWarranty(e.target.value)}
                          placeholder="Ex: 90 dias de garantia sobre o serviço executado."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA 3: ITENS & SERVIÇOS DISCRIMINADOS */}
                {editTab === 'items' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex-1 min-w-[200px]">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddCatalogItem(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-700"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            + Adicionar do Catálogo de Serviços...
                          </option>
                          {catalog.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({formatCurrency(c.default_price)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddBlankItem('service')}
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1 shadow-2xs whitespace-nowrap cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#0754D8]" />
                          <span>Serviço Avulso</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlankItem('material')}
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1 shadow-2xs whitespace-nowrap cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-600" />
                          <span>Peça / Insumo</span>
                        </button>
                      </div>
                    </div>

                    {/* Lista de Itens Editáveis */}
                    {editItems.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                        Nenhum item adicionado à ordem. Adicione serviços ou peças acima.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {editItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center gap-3"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                    item.item_type === 'service'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {item.item_type === 'service' ? 'Serviço' : 'Peça/Insumo'}
                                </span>
                              </div>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) =>
                                  handleUpdateEditItem(idx, item.quantity, item.unit_price, e.target.value)
                                }
                                placeholder="Nome do item..."
                                className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800"
                              />
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-20">
                                <label className="block text-[10px] text-slate-400 font-medium">Qtd</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleUpdateEditItem(
                                      idx,
                                      Math.max(1, parseInt(e.target.value) || 1),
                                      item.unit_price
                                    )
                                  }
                                  className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                                />
                              </div>

                              <div className="w-28">
                                <label className="block text-[10px] text-slate-400 font-medium">Preço Un (R$)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(e) =>
                                    handleUpdateEditItem(
                                      idx,
                                      item.quantity,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                                />
                              </div>

                              <div className="w-24 text-right">
                                <label className="block text-[10px] text-slate-400 font-medium">Subtotal</label>
                                <span className="text-xs font-extrabold text-[#103778] block py-1">
                                  {formatCurrency(item.total_price)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveEditItem(idx)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-3"
                                title="Remover item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRecalculateFromItems()}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0754D8] hover:underline"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Recalcular totais financeiros a partir destes itens</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer do Modal com Ações */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="inline-flex items-center gap-2 bg-[#0754D8] hover:bg-[#0642aa] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingEdit ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-800 text-center">
              Excluir Ordem de Serviço?
            </h3>
            <p className="text-sm text-slate-500 text-center mt-2">
              Tem certeza que deseja excluir permanentemente a O.S.{' '}
              <span className="font-mono font-bold text-[#0754D8]">{order.code}</span> do cliente{' '}
              <strong className="text-slate-700">{order.customer?.name}</strong>?
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-3 text-center">
              Aviso: Itens vinculados, checklists, fotos e lançamentos financeiros desta O.S. serão permanentemente removidos.
            </p>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteOrder}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {deleting ? (
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

export default function OrdemDetalhePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Carregando Ordem de Serviço...</div>}>
      <OrdemDetalheContent />
    </Suspense>
  );
}

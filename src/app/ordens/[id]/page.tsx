'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
  Camera,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  getServiceOrderById,
  completeServiceOrder,
  getAttachments,
  addAttachment,
  getCompanySettings,
} from '@/lib/api';
import { ServiceOrder, ServiceAttachment, CompanySettings } from '@/lib/types';
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

function OrdemDetalheContent() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [attachments, setAttachments] = useState<ServiceAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [closing, setClosing] = useState(false);
  const [closeSuccess, setCloseSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Campos de Encerramento
  const [diagnosis, setDiagnosis] = useState('');
  const [clientRecs, setClientRecs] = useState('');
  const [warranty, setWarranty] = useState('90 dias de garantia sobre o serviço executado');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'partial' | 'paid'>('paid');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [amountPaid, setAmountPaid] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const [data, compData, attList] = await Promise.all([
        getServiceOrderById(orderId),
        getCompanySettings(),
        getAttachments({ serviceOrderId: orderId }),
      ]);
      setOrder(data);
      setCompany(compData);
      setAttachments(attList);
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

  const toggleChecklistItem = (key: string) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file || !order) return;

    try {
      setUploadingPhoto(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await addAttachment({
          service_order_id: order.id,
          file_url: base64,
          attachment_type: type,
          caption: type === 'before' ? 'Foto de Antes' : 'Foto de Depois',
        });
        const attList = await getAttachments({ serviceOrderId: order.id });
        setAttachments(attList);
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Erro ao enviar foto:', err);
      setUploadingPhoto(false);
    }
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    try {
      setClosing(true);
      const paid = parseFloat(amountPaid) || 0;

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
          <p>Manaus - AM • Telefone: (92) 99123-4567</p>
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
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

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

          {/* Card Resumo de Valores */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#103778] mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#0754D8]" />
              <span>Resumo Financeiro</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Serviços Realizados:</span>
                <span className="font-bold text-slate-800">{formatCurrency(order.total_services)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto:</span>
                  <span className="font-bold">- {formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-[#103778]">
                <span>Total da O.S.:</span>
                <span className="text-[#0754D8] text-base">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
                <span className="text-slate-500">Valor Efetivamente Pago:</span>
                <span className="font-bold text-emerald-700">{formatCurrency(order.amount_paid)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Forma de Pagamento:</span>
                <span className="font-semibold text-slate-700">{order.payment_method || 'A combinar'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: CHECKLIST TÉCNICO & ENCERRAMENTO (OCUPA 2 COLUNAS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SEÇÃO 1: CHECKLIST TÉCNICO PROFISSIONAL */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <h3 className="text-base font-bold text-[#103778] mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#0754D8]" />
              <span>Checklist Técnico Operacional</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Marque os itens conferidos e testados durante a execução do serviço
            </p>

            <div className="space-y-2.5">
              {order.category === 'climatizacao' ? (
                <>
                  {[
                    { key: 'inspecao_inicial', label: 'Avaliação inicial de ruídos, vibração e funcionamento do compressor' },
                    { key: 'limpeza_filtros', label: 'Higienização e lavagem dos filtros de ar e carenagem plástica' },
                    { key: 'bactericida_serpentina', label: 'Aplicação de produto bactericida e sanitizante na serpentina' },
                    { key: 'turbina_bandeja', label: 'Limpeza profunda da turbina de ventilação e bandeja coletora' },
                    { key: 'teste_dreno', label: 'Desobstrução do dreno e teste com água para verificar escoamento livre' },
                    { key: 'unidade_externa', label: 'Inspeção e lavagem da serpentina da unidade condensadora externa' },
                    { key: 'teste_eletrico_gas', label: 'Verificação da fiação, capacitor e teste de pressão do gás refrigerante' },
                    { key: 'teste_temperatura', label: 'Medição da temperatura de insuflamento e retorno com termômetro' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        checklist[item.key]
                          ? 'bg-[#EAF3FF]/40 border-[#0754D8]/30 text-[#103778]'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!checklist[item.key]}
                        disabled={isCompleted}
                        onChange={() => toggleChecklistItem(item.key)}
                        className="w-4 h-4 text-[#0754D8] rounded border-slate-300 focus:ring-[#0754D8] mt-0.5 shrink-0"
                      />
                      <span className="text-xs font-semibold select-none leading-relaxed">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { key: 'desligar_disjuntor', label: 'Desligamento seguro e bloqueio do circuito no quadro de luz (QDC)' },
                    { key: 'teste_tensao', label: 'Teste de ausência de tensão elétrica com multímetro / chave teste' },
                    { key: 'reaperto_conexoes', label: 'Reaperto de bornes, barramentos e inspeção de fiação superaquecida' },
                    { key: 'teste_aterramento', label: 'Verificação do condutor de proteção (fio terra) e continuidade' },
                    { key: 'substituicao_pecas', label: 'Instalação / substituição correta dos componentes e conectores' },
                    { key: 'teste_funcionamento', label: 'Religamento seguro e teste de funcionamento sob carga normal' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        checklist[item.key]
                          ? 'bg-[#EAF3FF]/40 border-[#0754D8]/30 text-[#103778]'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!checklist[item.key]}
                        disabled={isCompleted}
                        onChange={() => toggleChecklistItem(item.key)}
                        className="w-4 h-4 text-[#0754D8] rounded border-slate-300 focus:ring-[#0754D8] mt-0.5 shrink-0"
                      />
                      <span className="text-xs font-semibold select-none leading-relaxed">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* SEÇÃO 2: ITENS DA ORDEM */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <h3 className="text-base font-bold text-[#103778] mb-3 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#0754D8]" />
              <span>Itens e Serviços Discriminados</span>
            </h3>

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

          {/* SEÇÃO: REGISTRO FOTOGRÁFICO ANTES E DEPOIS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#0754D8]" />
                <h3 className="text-base font-bold text-[#103778]">
                  Registro Fotográfico (Antes e Depois)
                </h3>
              </div>
              {uploadingPhoto && (
                <span className="text-xs text-[#0754D8] animate-pulse font-semibold">
                  Gravando imagem...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Anexe fotos comprovando o estado inicial do aparelho/instalação e o resultado final após a execução do serviço.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card de Foto Antes */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Foto de Antes (Início do Atendimento)
                </span>
                {attachments.find((a) => a.attachment_type === 'before') ? (
                  <div className="space-y-2">
                    <img
                      src={attachments.find((a) => a.attachment_type === 'before')?.file_url}
                      alt="Antes do serviço"
                      className="w-full h-44 object-cover rounded-lg border border-slate-200 shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-500 block truncate">
                      {attachments.find((a) => a.attachment_type === 'before')?.caption || 'Foto anexada'}
                    </span>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 transition-all">
                    <Camera className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-[#0754D8]">Tirar ou Anexar Foto</span>
                    <span className="text-[10px] text-slate-400">Estado inicial do aparelho</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handlePhotoUpload(e, 'before')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Card de Foto Depois */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Foto de Depois (Resultado Concluído)
                </span>
                {attachments.find((a) => a.attachment_type === 'after') ? (
                  <div className="space-y-2">
                    <img
                      src={attachments.find((a) => a.attachment_type === 'after')?.file_url}
                      alt="Depois do serviço"
                      className="w-full h-44 object-cover rounded-lg border border-slate-200 shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-500 block truncate">
                      {attachments.find((a) => a.attachment_type === 'after')?.caption || 'Foto anexada'}
                    </span>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 transition-all">
                    <Camera className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-[#0754D8]">Tirar ou Anexar Foto</span>
                    <span className="text-[10px] text-slate-400">Resultado limpo e finalizado</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handlePhotoUpload(e, 'after')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
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

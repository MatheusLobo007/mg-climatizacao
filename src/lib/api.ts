import { supabase } from './supabase';
import {
  Customer,
  CustomerAddress,
  Equipment,
  ServiceCatalogItem,
  Appointment,
  AppointmentStatus,
  ServiceOrder,
  CompanySettings,
  Quote,
  QuoteItem,
  QuoteStatus,
  ServiceAttachment,
  Supplier,
  Product,
  ProductCategory,
  StockMovement,
  StockMovementType,
  MaintenanceReminder,
  ReminderStatus,
  FinancialTransaction,
  FinancialTransactionType,
  FinancialCategory,
  FinancialPaymentMethod,
  WarrantyTerm,
  WarrantyType,
  PMOCPlan,
  PMOCPeriodicity,
  PMOCEquipment,
} from './types';
import { calculateNextCleaningDate } from './formatters';

// ==========================================
// CONFIGURAÇÕES DA EMPRESA
// ==========================================
export async function getCompanySettings(): Promise<CompanySettings | null> {
  const { data, error } = await supabase
    .from('mg_company_settings')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao buscar configurações:', error);
  }
  return data || null;
}

// ==========================================
// CLIENTES
// ==========================================
export async function getCustomers(searchQuery?: string): Promise<Customer[]> {
  let query = supabase
    .from('mg_customers')
    .select(`
      *,
      addresses:mg_customer_addresses(*),
      equipment:mg_equipment(*)
    `)
    .order('name', { ascending: true });

  if (searchQuery && searchQuery.trim()) {
    const term = `%${searchQuery.trim()}%`;
    query = query.or(`name.ilike.${term},phone.ilike.${term},document_cpf_cnpj.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
  return data as Customer[];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('mg_customers')
    .select(`
      *,
      addresses:mg_customer_addresses(*),
      equipment:mg_equipment(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar cliente:', error);
    return null;
  }
  return data as Customer;
}

export async function createCustomer(payload: {
  name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  document_cpf_cnpj?: string;
  origin?: string;
  notes?: string;
  initialAddress?: {
    street: string;
    number: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    reference_point?: string;
    complement?: string;
    label?: string;
  };
}): Promise<Customer | null> {
  const { initialAddress, ...customerData } = payload;

  const { data: customer, error } = await supabase
    .from('mg_customers')
    .insert([customerData])
    .select()
    .single();

  if (error || !customer) {
    console.error('Erro ao criar cliente:', error);
    throw new Error(error?.message || 'Falha ao salvar cliente');
  }

  // Se tiver endereço inicial
  if (initialAddress && initialAddress.street && initialAddress.number) {
    await supabase.from('mg_customer_addresses').insert([
      {
        customer_id: customer.id,
        label: initialAddress.label || 'Principal',
        street: initialAddress.street,
        number: initialAddress.number,
        neighborhood: initialAddress.neighborhood || '',
        city: initialAddress.city || 'Manaus',
        state: initialAddress.state || 'AM',
        zip_code: initialAddress.zip_code,
        reference_point: initialAddress.reference_point,
        complement: initialAddress.complement,
        is_primary: true,
      },
    ]);
  }

  return customer as Customer;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<boolean> {
  const { error } = await supabase
    .from('mg_customers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar cliente:', error);
    return false;
  }
  return true;
}

// ==========================================
// ENDEREÇOS DE CLIENTES
// ==========================================
export async function addCustomerAddress(address: {
  customer_id: string;
  label?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  reference_point?: string;
  access_notes?: string;
  is_primary?: boolean;
}): Promise<CustomerAddress | null> {
  const { data, error } = await supabase
    .from('mg_customer_addresses')
    .insert([address])
    .select()
    .single();

  if (error) {
    console.error('Erro ao adicionar endereço:', error);
    throw new Error(error.message);
  }
  return data as CustomerAddress;
}

// ==========================================
// EQUIPAMENTOS (AR-CONDICIONADO)
// ==========================================
export async function getEquipment(filters?: {
  customerId?: string;
}): Promise<Equipment[]> {
  let query = supabase
    .from('mg_equipment')
    .select(`
      *,
      customer:mg_customers(*),
      address:mg_customer_addresses(*)
    `)
    .order('next_cleaning_date', { ascending: true, nullsFirst: false });

  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar equipamentos:', error);
    return [];
  }
  return data as Equipment[];
}

export async function createEquipment(payload: {
  customer_id: string;
  address_id?: string | null;
  environment: string;
  type?: string;
  brand?: string;
  model?: string;
  btu_capacity?: number;
  serial_number?: string;
  last_cleaning_date?: string;
  maintenance_interval_months?: number;
  notes?: string;
}): Promise<Equipment | null> {
  const interval = payload.maintenance_interval_months || 6;
  let nextDate: string | null = null;

  if (payload.last_cleaning_date) {
    nextDate = calculateNextCleaningDate(payload.last_cleaning_date, interval);
  }

  const { data, error } = await supabase
    .from('mg_equipment')
    .insert([
      {
        ...payload,
        type: payload.type || 'split',
        maintenance_interval_months: interval,
        next_cleaning_date: nextDate,
        status: 'active',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Erro ao cadastrar equipamento:', error);
    throw new Error(error.message);
  }
  return data as Equipment;
}

export async function updateEquipment(
  id: string,
  updates: Partial<Equipment>
): Promise<boolean> {
  const { error } = await supabase
    .from('mg_equipment')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar equipamento:', error);
    return false;
  }
  return true;
}

// ==========================================
// CATÁLOGO DE SERVIÇOS
// ==========================================
export async function getServiceCatalog(category?: 'climatizacao' | 'eletrica'): Promise<ServiceCatalogItem[]> {
  let query = supabase
    .from('mg_service_catalog')
    .select('*')
    .eq('status', 'active')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar catálogo de serviços:', error);
    return [];
  }
  return data as ServiceCatalogItem[];
}

export async function createServiceCatalogItem(item: {
  name: string;
  category: 'climatizacao' | 'eletrica';
  description?: string;
  default_price: number;
  estimated_duration_min?: number;
}): Promise<ServiceCatalogItem | null> {
  const { data, error } = await supabase
    .from('mg_service_catalog')
    .insert([item])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar serviço:', error);
    throw new Error(error.message);
  }
  return data as ServiceCatalogItem;
}

// ==========================================
// AGENDA & AGENDAMENTOS
// ==========================================
export async function getAppointments(filters?: {
  date?: string;
  status?: string;
}): Promise<Appointment[]> {
  let query = supabase
    .from('mg_appointments')
    .select(`
      *,
      customer:mg_customers(*),
      address:mg_customer_addresses(*),
      equipment:mg_equipment(*)
    `)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true });

  if (filters?.date) {
    query = query.eq('scheduled_date', filters.date);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return [];
  }
  return data as Appointment[];
}

export async function createAppointment(payload: {
  customer_id: string;
  address_id?: string | null;
  equipment_id?: string | null;
  title: string;
  category: 'climatizacao' | 'eletrica';
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration_min?: number;
  technician_name?: string;
  notes?: string;
  status?: AppointmentStatus;
}): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('mg_appointments')
    .insert([
      {
        ...payload,
        status: payload.status || 'confirmed',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar agendamento:', error);
    throw new Error(error.message);
  }
  return data as Appointment;
}

export async function updateAppointmentStatus(id: string, status: string): Promise<boolean> {
  const { error } = await supabase
    .from('mg_appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  return !error;
}

// ==========================================
// ORDENS DE SERVIÇO
// ==========================================
export async function getNextOrderCode(): Promise<string> {
  const year = new Date().getFullYear();
  const { count, error } = await supabase
    .from('mg_service_orders')
    .select('*', { count: 'exact', head: true });

  const nextSeq = (count || 0) + 1;
  return `OS-${year}-${String(nextSeq).padStart(4, '0')}`;
}

export async function getServiceOrders(filters?: {
  status?: string;
  customerId?: string;
}): Promise<ServiceOrder[]> {
  let query = supabase
    .from('mg_service_orders')
    .select(`
      *,
      customer:mg_customers(*),
      address:mg_customer_addresses(*),
      equipment:mg_equipment(*),
      items:mg_service_order_items(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar ordens de serviço:', error);
    return [];
  }
  return data as ServiceOrder[];
}

export async function getServiceOrderById(id: string): Promise<ServiceOrder | null> {
  const { data, error } = await supabase
    .from('mg_service_orders')
    .select(`
      *,
      customer:mg_customers(*),
      address:mg_customer_addresses(*),
      equipment:mg_equipment(*),
      items:mg_service_order_items(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar ordem de serviço:', error);
    return null;
  }
  return data as ServiceOrder;
}

export async function createServiceOrder(payload: {
  customer_id: string;
  address_id?: string | null;
  equipment_id?: string | null;
  appointment_id?: string | null;
  category: 'climatizacao' | 'eletrica';
  problem_description?: string;
  technical_diagnosis?: string;
  is_cleaning?: boolean;
  scheduled_date?: string;
  technician_name?: string;
  total_services?: number;
  total_materials?: number;
  discount?: number;
  total_amount?: number;
  checklist_data?: Record<string, boolean | string>;
  items?: Array<{
    item_type: 'service' | 'material';
    catalog_service_id?: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}): Promise<ServiceOrder | null> {
  const code = await getNextOrderCode();
  const { items, ...orderData } = payload;

  const { data: order, error } = await supabase
    .from('mg_service_orders')
    .insert([
      {
        ...orderData,
        code,
        status: 'open',
        total_amount: orderData.total_amount || 0,
        payment_status: 'pending',
      },
    ])
    .select()
    .single();

  if (error || !order) {
    console.error('Erro ao criar OS:', error);
    throw new Error(error?.message || 'Falha ao salvar OS');
  }

  // Inserir itens se houver
  if (items && items.length > 0) {
    const itemsToInsert = items.map((i) => ({
      service_order_id: order.id,
      ...i,
    }));
    await supabase.from('mg_service_order_items').insert(itemsToInsert);
  }

  return order as ServiceOrder;
}

/**
 * Concluir Ordem de Serviço com Regra de Negócio Crucial:
 * Se a OS for de higienização/limpeza de ar-condicionado (`is_cleaning === true`) e tiver `equipment_id`,
 * atualiza automaticamente a data de última limpeza do equipamento e recalcula a próxima limpeza!
 */
export async function completeServiceOrder(
  id: string,
  closingData: {
    technical_diagnosis?: string;
    technical_notes?: string;
    client_recommendations?: string;
    payment_status?: 'pending' | 'partial' | 'paid';
    payment_method?: string;
    amount_paid?: number;
    warranty_terms?: string;
    checklist_data?: Record<string, boolean | string>;
  }
): Promise<boolean> {
  // 1. Obter a OS atual para checar equipamento e se é limpeza
  const order = await getServiceOrderById(id);
  if (!order) throw new Error('Ordem de serviço não encontrada.');

  const completedAt = new Date().toISOString();
  const todayDateStr = completedAt.split('T')[0];

  // 2. Atualizar OS para 'completed'
  const { error: orderError } = await supabase
    .from('mg_service_orders')
    .update({
      ...closingData,
      status: 'completed',
      completed_at: completedAt,
      updated_at: completedAt,
    })
    .eq('id', id);

  if (orderError) {
    console.error('Erro ao concluir OS:', orderError);
    return false;
  }

  // 3. Regra de Negócio: Atualizar equipamento se for limpeza de ar-condicionado
  if (order.is_cleaning && order.equipment_id) {
    const { data: eq } = await supabase
      .from('mg_equipment')
      .select('maintenance_interval_months')
      .eq('id', order.equipment_id)
      .single();

    const interval = eq?.maintenance_interval_months || 6;
    const nextDate = calculateNextCleaningDate(todayDateStr, interval);

    await supabase
      .from('mg_equipment')
      .update({
        last_cleaning_date: todayDateStr,
        last_maintenance_date: todayDateStr,
        next_cleaning_date: nextDate,
        updated_at: completedAt,
      })
      .eq('id', order.equipment_id);
  }

  // 4. Integração Financeira Automática: Lançar receita no fluxo de caixa
  const revenueAmount =
    closingData.amount_paid && closingData.amount_paid > 0
      ? closingData.amount_paid
      : (order.total_amount || 0);

  if (revenueAmount > 0) {
    try {
      // Verificar se já existe transação vinculada a esta OS para evitar duplicidade
      const { data: existingTx } = await supabase
        .from('mg_financial_transactions')
        .select('id')
        .eq('service_order_id', id)
        .limit(1);

      if (!existingTx || existingTx.length === 0) {
        await supabase.from('mg_financial_transactions').insert([
          {
            type: 'income',
            category: 'servico_os',
            description: `Recebimento O.S. ${order.code} - ${order.customer?.name || 'Cliente'}`,
            amount: revenueAmount,
            payment_method: closingData.payment_method || 'pix',
            status: closingData.payment_status === 'pending' ? 'pending' : 'paid',
            transaction_date: todayDateStr,
            service_order_id: id,
            customer_id: order.customer_id,
            notes: `Conclusão e faturamento da O.S. ${order.code}`,
          },
        ]);
      }
    } catch (err) {
      console.error('Erro ao sincronizar receita financeira:', err);
    }
  }

  return true;
}

// ==========================================
// DASHBOARD RESUMO
// ==========================================
export async function getDashboardSummary() {
  const todayStr = new Date().toISOString().split('T')[0];

  // Agendamentos de hoje
  const { data: todayAppointments } = await supabase
    .from('mg_appointments')
    .select(`
      *,
      customer:mg_customers(name, phone, whatsapp),
      address:mg_customer_addresses(street, number, neighborhood)
    `)
    .eq('scheduled_date', todayStr)
    .order('scheduled_time', { ascending: true });

  // Ordens em andamento / abertas
  const { count: openOrdersCount } = await supabase
    .from('mg_service_orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['open', 'scheduled', 'confirmed', 'in_progress']);

  // Total de clientes ativos
  const { count: activeCustomersCount } = await supabase
    .from('mg_customers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Próximas manutenções preventivas (alertas)
  const { data: upcomingMaintenance } = await supabase
    .from('mg_equipment')
    .select(`
      *,
      customer:mg_customers(name, phone, whatsapp),
      address:mg_customer_addresses(neighborhood, city)
    `)
    .not('next_cleaning_date', 'is', null)
    .order('next_cleaning_date', { ascending: true })
    .limit(5);

  // Faturamento real do mês
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data: completedMonthOrders } = await supabase
    .from('mg_service_orders')
    .select('total_amount, amount_paid, payment_status')
    .eq('status', 'completed')
    .gte('completed_at', startOfMonth);

  let totalReceivedMonth = 0;
  let totalPendingMonth = 0;

  if (completedMonthOrders) {
    for (const ord of completedMonthOrders) {
      const paid = Number(ord.amount_paid || 0);
      const total = Number(ord.total_amount || 0);
      totalReceivedMonth += paid;
      if (total > paid) {
        totalPendingMonth += total - paid;
      }
    }
  }

  // Orçamentos aguardando aprovação
  const { count: pendingQuotesCount } = await supabase
    .from('mg_quotes')
    .select('*', { count: 'exact', head: true })
    .in('status', ['draft', 'sent', 'awaiting_approval']);

  // Produtos com estoque baixo
  const { data: allProds } = await supabase
    .from('mg_products')
    .select('id, quantity, min_stock');
  const lowStockCount = allProds
    ? allProds.filter((p) => p.quantity <= p.min_stock).length
    : 0;

  return {
    todayAppointments: todayAppointments || [],
    openOrdersCount: openOrdersCount || 0,
    activeCustomersCount: activeCustomersCount || 0,
    upcomingMaintenance: upcomingMaintenance || [],
    totalReceivedMonth,
    totalPendingMonth,
    pendingQuotesCount: pendingQuotesCount || 0,
    lowStockCount,
  };
}

// ==========================================
// ORÇAMENTOS
// ==========================================
export async function getNextQuoteCode(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('mg_quotes')
    .select('*', { count: 'exact', head: true });

  const nextSeq = (count || 0) + 1;
  return `ORC-${year}-${String(nextSeq).padStart(4, '0')}`;
}

export async function getQuotes(filters?: {
  status?: string;
  customerId?: string;
}): Promise<Quote[]> {
  let query = supabase
    .from('mg_quotes')
    .select(`
      *,
      customer:mg_customers(*),
      address:mg_customer_addresses(*),
      equipment:mg_equipment(*),
      items:mg_quote_items(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return [];
  }
  return data as Quote[];
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  const { data, error } = await supabase
    .from('mg_quotes')
    .select(`
      *,
      customer:mg_customers(*),
      address:mg_customer_addresses(*),
      equipment:mg_equipment(*),
      items:mg_quote_items(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar orçamento:', error);
    return null;
  }
  return data as Quote;
}

export async function createQuote(payload: {
  customer_id: string;
  address_id?: string | null;
  equipment_id?: string | null;
  category: 'climatizacao' | 'eletrica';
  valid_until: string;
  subtotal?: number;
  discount?: number;
  total_amount?: number;
  payment_terms?: string;
  execution_time_estimate?: string;
  warranty_terms?: string;
  notes?: string;
  items?: Array<{
    item_type: 'service' | 'material';
    catalog_service_id?: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}): Promise<Quote | null> {
  const code = await getNextQuoteCode();
  const { items, ...quoteData } = payload;

  const { data: quote, error } = await supabase
    .from('mg_quotes')
    .insert([
      {
        ...quoteData,
        code,
        status: 'draft',
        total_amount: quoteData.total_amount || 0,
      },
    ])
    .select()
    .single();

  if (error || !quote) {
    console.error('Erro ao criar orçamento:', error);
    throw new Error(error?.message || 'Falha ao salvar orçamento');
  }

  if (items && items.length > 0) {
    const itemsToInsert = items.map((i) => ({
      quote_id: quote.id,
      ...i,
    }));
    await supabase.from('mg_quote_items').insert(itemsToInsert);
  }

  return quote as Quote;
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<boolean> {
  const { error } = await supabase
    .from('mg_quotes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  return !error;
}

/**
 * Conversão segura de Orçamento Aprovado em Ordem de Serviço
 * Copia os dados, itens e vincula a OS gerada de volta ao orçamento
 */
export async function convertQuoteToServiceOrder(quoteId: string): Promise<ServiceOrder | null> {
  const quote = await getQuoteById(quoteId);
  if (!quote) throw new Error('Orçamento não encontrado');

  if (quote.service_order_id) {
    throw new Error('Este orçamento já foi convertido em uma Ordem de Serviço.');
  }

  // 1. Criar a nova O.S. a partir dos dados do orçamento
  const orderCode = await getNextOrderCode();
  const isCleaning = quote.category === 'climatizacao';

  const { data: order, error: orderError } = await supabase
    .from('mg_service_orders')
    .insert([
      {
        code: orderCode,
        customer_id: quote.customer_id,
        address_id: quote.address_id,
        equipment_id: quote.equipment_id,
        category: quote.category,
        status: 'open',
        problem_description: quote.notes || `Serviço aprovado conforme Orçamento ${quote.code}`,
        is_cleaning: isCleaning,
        total_services: quote.subtotal,
        discount: quote.discount,
        total_amount: quote.total_amount,
        payment_method: quote.payment_terms,
        warranty_terms: quote.warranty_terms,
      },
    ])
    .select()
    .single();

  if (orderError || !order) {
    console.error('Erro ao converter orçamento em O.S.:', orderError);
    throw new Error('Falha ao gerar Ordem de Serviço.');
  }

  // 2. Copiar os itens do orçamento para a O.S.
  if (quote.items && quote.items.length > 0) {
    const orderItems = quote.items.map((qi) => ({
      service_order_id: order.id,
      item_type: qi.item_type,
      catalog_service_id: qi.catalog_service_id,
      name: qi.name,
      quantity: qi.quantity,
      unit_price: qi.unit_price,
      total_price: qi.total_price,
    }));
    await supabase.from('mg_service_order_items').insert(orderItems);
  }

  // 3. Atualizar o orçamento com o ID da O.S. e marcar como 'approved'
  await supabase
    .from('mg_quotes')
    .update({
      service_order_id: order.id,
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', quoteId);

  return order as ServiceOrder;
}

// ==========================================
// FOTOS E ANEXOS
// ==========================================
export async function getAttachments(filters: {
  serviceOrderId?: string;
  quoteId?: string;
}): Promise<ServiceAttachment[]> {
  let query = supabase
    .from('mg_service_attachments')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.serviceOrderId) {
    query = query.eq('service_order_id', filters.serviceOrderId);
  }
  if (filters.quoteId) {
    query = query.eq('quote_id', filters.quoteId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar anexos:', error);
    return [];
  }
  return data as ServiceAttachment[];
}

export async function addAttachment(payload: {
  service_order_id?: string;
  quote_id?: string;
  file_url: string;
  attachment_type?: 'before' | 'after' | 'document' | 'receipt';
  caption?: string;
}): Promise<ServiceAttachment | null> {
  const { data, error } = await supabase
    .from('mg_service_attachments')
    .insert([
      {
        ...payload,
        attachment_type: payload.attachment_type || 'before',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar anexo:', error);
    throw new Error(error.message);
  }
  return data as ServiceAttachment;
}

// ==========================================
// FORNECEDORES
// ==========================================
export async function getSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('mg_suppliers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar fornecedores:', error);
    return [];
  }
  return data as Supplier[];
}

export async function createSupplier(payload: {
  name: string;
  contact_name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  notes?: string;
}): Promise<Supplier> {
  const { data, error } = await supabase
    .from('mg_suppliers')
    .insert([{ ...payload, status: 'active' }])
    .select()
    .single();

  if (error) {
    console.error('Erro ao cadastrar fornecedor:', error);
    throw new Error(error.message);
  }
  return data as Supplier;
}

export async function updateSupplier(
  id: string,
  payload: Partial<Supplier>
): Promise<Supplier> {
  const { data, error } = await supabase
    .from('mg_suppliers')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    throw new Error(error.message);
  }
  return data as Supplier;
}

// ==========================================
// ESTOQUE & PRODUTOS
// ==========================================
export async function getProducts(filters?: {
  category?: string;
  lowStockOnly?: boolean;
  search?: string;
}): Promise<Product[]> {
  let query = supabase
    .from('mg_products')
    .select(`
      *,
      supplier:mg_suppliers(*)
    `)
    .order('name', { ascending: true });

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  if (filters?.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`name.ilike.${term},sku.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }

  let products = (data || []) as Product[];
  if (filters?.lowStockOnly) {
    products = products.filter((p) => p.quantity <= p.min_stock);
  }

  return products;
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('mg_products')
    .select(`
      *,
      supplier:mg_suppliers(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar produto por ID:', error);
    return null;
  }
  return data as Product;
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase
    .from('mg_products')
    .insert([
      {
        name: payload.name,
        category: payload.category || 'outros',
        sku: payload.sku || null,
        unit: payload.unit || 'un',
        quantity: payload.quantity ?? 0,
        min_stock: payload.min_stock ?? 2,
        cost_price: payload.cost_price ?? 0,
        sale_price: payload.sale_price ?? 0,
        supplier_id: payload.supplier_id || null,
        notes: payload.notes || null,
        status: 'active',
      },
    ])
    .select(`
      *,
      supplier:mg_suppliers(*)
    `)
    .single();

  if (error) {
    console.error('Erro ao criar produto:', error);
    throw new Error(error.message);
  }

  // Se começou com estoque > 0, cria movimentação de saldo inicial
  if (payload.quantity && payload.quantity > 0) {
    await supabase.from('mg_stock_movements').insert([
      {
        product_id: data.id,
        movement_type: 'entry',
        quantity: payload.quantity,
        unit_cost: payload.cost_price ?? 0,
        notes: 'Cadastro inicial de produto / saldo inicial',
      },
    ]);
  }

  return data as Product;
}

export async function updateProduct(
  id: string,
  payload: Partial<Product>
): Promise<Product> {
  const { data, error } = await supabase
    .from('mg_products')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      supplier:mg_suppliers(*)
    `)
    .single();

  if (error) {
    console.error('Erro ao atualizar produto:', error);
    throw new Error(error.message);
  }
  return data as Product;
}

export async function recordStockMovement(params: {
  productId: string;
  movementType: StockMovementType;
  quantity: number;
  unitCost?: number;
  serviceOrderId?: string;
  notes?: string;
}): Promise<StockMovement> {
  const product = await getProductById(params.productId);
  if (!product) {
    throw new Error('Produto não encontrado');
  }

  let newQuantity = product.quantity;
  if (params.movementType === 'entry') {
    newQuantity += Math.abs(params.quantity);
  } else if (params.movementType === 'exit' || params.movementType === 'service_order') {
    newQuantity -= Math.abs(params.quantity);
    if (newQuantity < 0) newQuantity = 0;
  } else if (params.movementType === 'adjustment') {
    // Para ajuste, a quantidade informada pode ser o novo saldo ou a variação
    newQuantity = params.quantity;
  }

  // 1. Inserir movimento
  const { data: movement, error: movError } = await supabase
    .from('mg_stock_movements')
    .insert([
      {
        product_id: params.productId,
        movement_type: params.movementType,
        quantity: params.quantity,
        unit_cost: params.unitCost ?? product.cost_price,
        service_order_id: params.serviceOrderId || null,
        notes: params.notes || null,
      },
    ])
    .select()
    .single();

  if (movError) {
    console.error('Erro ao registrar movimentação de estoque:', movError);
    throw new Error(movError.message);
  }

  // 2. Atualizar saldo do produto
  await supabase
    .from('mg_products')
    .update({
      quantity: newQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.productId);

  return movement as StockMovement;
}

export async function getStockMovements(filters?: {
  productId?: string;
  limit?: number;
}): Promise<StockMovement[]> {
  let query = supabase
    .from('mg_stock_movements')
    .select(`
      *,
      product:mg_products(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.productId) {
    query = query.eq('product_id', filters.productId);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  } else {
    query = query.limit(50);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar movimentações de estoque:', error);
    return [];
  }
  return data as StockMovement[];
}

// ==========================================
// LEMBRETES DE MANUTENÇÃO PREVENTIVA
// ==========================================
export async function getMaintenanceReminders(filters?: {
  status?: ReminderStatus | 'all';
}): Promise<MaintenanceReminder[]> {
  let query = supabase
    .from('mg_maintenance_reminders')
    .select(`
      *,
      customer:mg_customers(*),
      equipment:mg_equipment(
        *,
        address:mg_customer_addresses(*)
      )
    `)
    .order('scheduled_for_date', { ascending: true });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar lembretes de manutenção:', error);
    return [];
  }
  return data as MaintenanceReminder[];
}

export async function syncMaintenanceRemindersFromEquipment(): Promise<number> {
  // Busca todos os aparelhos ativos com next_cleaning_date preenchida
  const { data: equipmentList, error } = await supabase
    .from('mg_equipment')
    .select('id, customer_id, next_cleaning_date')
    .eq('status', 'active')
    .not('next_cleaning_date', 'is', null);

  if (error || !equipmentList) {
    return 0;
  }

  let createdCount = 0;

  for (const eq of equipmentList) {
    if (!eq.next_cleaning_date) continue;

    // Verifica se já existe um lembrete pendente ou agendado para este equipamento na mesma data
    const { data: existing } = await supabase
      .from('mg_maintenance_reminders')
      .select('id, scheduled_for_date, status')
      .eq('equipment_id', eq.id)
      .limit(1);

    if (!existing || existing.length === 0) {
      // Cria novo lembrete
      await supabase.from('mg_maintenance_reminders').insert([
        {
          equipment_id: eq.id,
          customer_id: eq.customer_id,
          scheduled_for_date: eq.next_cleaning_date,
          status: 'pending',
          notes: 'Gerado automaticamente pelo ciclo de limpeza do aparelho',
        },
      ]);
      createdCount++;
    } else {
      // Se já existe e a data do aparelho mudou (ex: após nova limpeza realizada), atualiza o lembrete pendente
      const currentReminder = existing[0];
      if (
        currentReminder.scheduled_for_date !== eq.next_cleaning_date &&
        currentReminder.status !== 'dismissed'
      ) {
        await supabase
          .from('mg_maintenance_reminders')
          .update({
            scheduled_for_date: eq.next_cleaning_date,
            status: 'pending',
            contacted_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentReminder.id);
      }
    }
  }

  return createdCount;
}

export async function logReminderContact(
  id: string,
  notes?: string
): Promise<MaintenanceReminder> {
  const updatePayload: Partial<MaintenanceReminder> = {
    status: 'contacted',
    contacted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (notes) {
    updatePayload.notes = notes;
  }

  const { data, error } = await supabase
    .from('mg_maintenance_reminders')
    .update(updatePayload)
    .eq('id', id)
    .select(`
      *,
      customer:mg_customers(*),
      equipment:mg_equipment(*)
    `)
    .single();

  if (error) {
    console.error('Erro ao registrar contato de lembrete:', error);
    throw new Error(error.message);
  }
  return data as MaintenanceReminder;
}

export async function updateReminderStatus(
  id: string,
  status: ReminderStatus,
  notes?: string
): Promise<MaintenanceReminder> {
  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (notes !== undefined) {
    payload.notes = notes;
  }

  const { data, error } = await supabase
    .from('mg_maintenance_reminders')
    .update(payload)
    .eq('id', id)
    .select(`
      *,
      customer:mg_customers(*),
      equipment:mg_equipment(*)
    `)
    .single();

  if (error) {
    console.error('Erro ao atualizar status do lembrete:', error);
    throw new Error(error.message);
  }
  return data as MaintenanceReminder;
}

// ==========================================
// FINANCEIRO & FLUXO DE CAIXA
// ==========================================
export async function getFinancialTransactions(filters?: {
  type?: FinancialTransactionType;
  category?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}): Promise<FinancialTransaction[]> {
  let query = supabase
    .from('mg_financial_transactions')
    .select(`
      *,
      customer:mg_customers(id, name),
      supplier:mg_suppliers(id, name),
      service_order:mg_service_orders(id, code)
    `)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }
  if (filters?.startDate) {
    query = query.gte('transaction_date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('transaction_date', filters.endDate);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar transações financeiras:', error);
    return [];
  }
  return data as FinancialTransaction[];
}

export async function createFinancialTransaction(
  payload: Partial<FinancialTransaction>
): Promise<FinancialTransaction> {
  const { data, error } = await supabase
    .from('mg_financial_transactions')
    .insert([
      {
        type: payload.type || 'expense',
        category: payload.category || 'outros',
        description: payload.description,
        amount: payload.amount ?? 0,
        payment_method: payload.payment_method || 'pix',
        status: payload.status || 'paid',
        transaction_date: payload.transaction_date || new Date().toISOString().split('T')[0],
        due_date: payload.due_date || null,
        service_order_id: payload.service_order_id || null,
        customer_id: payload.customer_id || null,
        supplier_id: payload.supplier_id || null,
        notes: payload.notes || null,
      },
    ])
    .select(`
      *,
      customer:mg_customers(id, name),
      supplier:mg_suppliers(id, name)
    `)
    .single();

  if (error) {
    console.error('Erro ao registrar transação financeira:', error);
    throw new Error(error.message);
  }
  return data as FinancialTransaction;
}

export async function deleteFinancialTransaction(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('mg_financial_transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir transação financeira:', error);
    throw new Error(error.message);
  }
  return true;
}

export async function getFinancialSummary(filters?: {
  startDate?: string;
  endDate?: string;
}) {
  const transactions = await getFinancialTransactions(filters);

  let totalIncome = 0;
  let totalExpense = 0;
  let pendingReceivables = 0;
  const categoryExpenses: Record<string, number> = {};

  for (const t of transactions) {
    const val = Number(t.amount || 0);
    if (t.type === 'income') {
      if (t.status === 'paid') {
        totalIncome += val;
      } else if (t.status === 'pending') {
        pendingReceivables += val;
      }
    } else if (t.type === 'expense') {
      if (t.status === 'paid') {
        totalExpense += val;
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + val;
      }
    }
  }

  const netBalance = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    netBalance,
    pendingReceivables,
    categoryExpenses,
    transactionCount: transactions.length,
  };
}

// ==========================================
// TERMOS DE GARANTIA
// ==========================================
export async function getNextWarrantyCode(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('mg_warranty_terms')
    .select('*', { count: 'exact', head: true });

  const nextSeq = (count || 0) + 1;
  return `GAR-${year}-${String(nextSeq).padStart(4, '0')}`;
}

export async function getWarrantyTerms(filters?: {
  customerId?: string;
  serviceOrderId?: string;
}): Promise<WarrantyTerm[]> {
  let query = supabase
    .from('mg_warranty_terms')
    .select(`
      *,
      customer:mg_customers(*),
      service_order:mg_service_orders(*),
      equipment:mg_equipment(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }
  if (filters?.serviceOrderId) {
    query = query.eq('service_order_id', filters.serviceOrderId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar termos de garantia:', error);
    return [];
  }
  return data as WarrantyTerm[];
}

export async function getWarrantyTermById(id: string): Promise<WarrantyTerm | null> {
  const { data, error } = await supabase
    .from('mg_warranty_terms')
    .select(`
      *,
      customer:mg_customers(*),
      service_order:mg_service_orders(
        *,
        items:mg_service_order_items(*)
      ),
      equipment:mg_equipment(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar termo de garantia por ID:', error);
    return null;
  }
  return data as WarrantyTerm;
}

export async function createWarrantyTerm(payload: {
  service_order_id: string;
  customer_id: string;
  equipment_id?: string;
  warranty_type?: WarrantyType;
  duration_days?: number;
  coverage_details: string;
  exclusions?: string;
  notes?: string;
}): Promise<WarrantyTerm> {
  const code = await getNextWarrantyCode();
  const duration = payload.duration_days || 90;
  const start = new Date();
  const end = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);

  const startDateStr = start.toISOString().split('T')[0];
  const endDateStr = end.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('mg_warranty_terms')
    .insert([
      {
        code,
        service_order_id: payload.service_order_id,
        customer_id: payload.customer_id,
        equipment_id: payload.equipment_id || null,
        warranty_type: payload.warranty_type || 'servico',
        duration_days: duration,
        start_date: startDateStr,
        end_date: endDateStr,
        coverage_details: payload.coverage_details,
        exclusions: payload.exclusions || null,
        notes: payload.notes || null,
      },
    ])
    .select(`
      *,
      customer:mg_customers(*),
      service_order:mg_service_orders(*)
    `)
    .single();

  if (error) {
    console.error('Erro ao emitir termo de garantia:', error);
    throw new Error(error.message);
  }
  return data as WarrantyTerm;
}

// ==========================================
// PMOC (PLANO DE MANUTENÇÃO, OPERAÇÃO E CONTROLE - LEI 13.589/2018)
// ==========================================
export async function getNextPMOCCode(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('mg_pmoc_plans')
    .select('*', { count: 'exact', head: true });

  const nextSeq = (count || 0) + 1;
  return `PMOC-${year}-${String(nextSeq).padStart(4, '0')}`;
}

export async function getPMOCPlans(filters?: {
  customerId?: string;
  status?: string;
}): Promise<PMOCPlan[]> {
  let query = supabase
    .from('mg_pmoc_plans')
    .select(`
      *,
      customer:mg_customers(*),
      equipment_links:mg_pmoc_equipment(
        *,
        equipment:mg_equipment(*)
      )
    `)
    .order('created_at', { ascending: false });

  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar planos PMOC:', error);
    return [];
  }
  return data as PMOCPlan[];
}

export async function getPMOCPlanById(id: string): Promise<PMOCPlan | null> {
  const { data, error } = await supabase
    .from('mg_pmoc_plans')
    .select(`
      *,
      customer:mg_customers(
        *,
        addresses:mg_customer_addresses(*)
      ),
      equipment_links:mg_pmoc_equipment(
        *,
        equipment:mg_equipment(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar plano PMOC por ID:', error);
    return null;
  }
  return data as PMOCPlan;
}

export async function createPMOCPlan(
  payload: {
    customer_id: string;
    responsible_technician?: string;
    technician_crea_cft?: string;
    establishment_name: string;
    activity_type?: string;
    periodicity?: PMOCPeriodicity;
    start_date?: string;
    valid_until: string;
    emergency_contact?: string;
    notes?: string;
  },
  equipmentIds: string[]
): Promise<PMOCPlan> {
  const code = await getNextPMOCCode();

  // 1. Calcular capacidade total em BTUs a partir dos equipamentos selecionados
  let totalBtu = 0;
  if (equipmentIds.length > 0) {
    const { data: eqs } = await supabase
      .from('mg_equipment')
      .select('btu_capacity')
      .in('id', equipmentIds);

    if (eqs) {
      totalBtu = eqs.reduce((acc, curr) => acc + (curr.btu_capacity || 0), 0);
    }
  }

  // 2. Criar plano PMOC
  const { data: plan, error: planError } = await supabase
    .from('mg_pmoc_plans')
    .insert([
      {
        code,
        customer_id: payload.customer_id,
        responsible_technician:
          payload.responsible_technician || 'Responsável Técnico MG Climatização',
        technician_crea_cft:
          payload.technician_crea_cft || 'CFT/CRT Especialista em Refrigeração',
        establishment_name: payload.establishment_name,
        activity_type: payload.activity_type || 'Comercial',
        total_refrigeration_capacity_btu: totalBtu,
        periodicity: payload.periodicity || 'mensal',
        status: 'active',
        start_date: payload.start_date || new Date().toISOString().split('T')[0],
        valid_until: payload.valid_until,
        emergency_contact: payload.emergency_contact || null,
        notes: payload.notes || null,
      },
    ])
    .select()
    .single();

  if (planError) {
    console.error('Erro ao criar plano PMOC:', planError);
    throw new Error(planError.message);
  }

  // 3. Vincular equipamentos
  if (equipmentIds.length > 0) {
    const links = equipmentIds.map((eqId, idx) => ({
      pmoc_id: plan.id,
      equipment_id: eqId,
      tag_code: `TAG-AC-${String(idx + 1).padStart(2, '0')}`,
    }));

    await supabase.from('mg_pmoc_equipment').insert(links);
  }

  return getPMOCPlanById(plan.id) as Promise<PMOCPlan>;
}

// ==========================================
// EXCLUSÃO DE REGISTROS (MÓDULOS DO SISTEMA)
// ==========================================
export async function deleteCustomer(id: string): Promise<boolean> {
  const { error } = await supabase.from('mg_customers').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir cliente:', error);
    throw new Error(error.message);
  }
  return true;
}

export async function deleteEquipment(id: string): Promise<boolean> {
  const { error } = await supabase.from('mg_equipment').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir equipamento:', error);
    throw new Error(error.message);
  }
  return true;
}

export async function deleteServiceCatalogItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('mg_service_catalog').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir serviço do catálogo:', error);
    throw new Error(error.message);
  }
  return true;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase.from('mg_products').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir produto do estoque:', error);
    throw new Error(error.message);
  }
  return true;
}

export async function deleteQuote(id: string): Promise<boolean> {
  const { error } = await supabase.from('mg_quotes').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir orçamento:', error);
    throw new Error(error.message);
  }
  return true;
}

export async function deleteWarrantyTerm(id: string): Promise<boolean> {
  const { error } = await supabase.from('mg_warranty_terms').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir termo de garantia:', error);
    throw new Error(error.message);
  }
  return true;
}

export async function deletePMOCPlan(id: string): Promise<boolean> {
  const { error } = await supabase.from('mg_pmoc_plans').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir plano PMOC:', error);
    throw new Error(error.message);
  }
  return true;
}

export async function deleteServiceOrder(id: string): Promise<boolean> {
  // Desvincula/remove transações financeiras vinculadas à O.S. para manter integridade
  await supabase.from('mg_financial_transactions').delete().eq('service_order_id', id);

  const { error } = await supabase.from('mg_service_orders').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir ordem de serviço:', error);
    throw new Error(error.message);
  }
  return true;
}



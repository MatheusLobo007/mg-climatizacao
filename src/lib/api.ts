import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  writeBatch,
} from 'firebase/firestore';
import {
  Customer,
  CustomerAddress,
  Equipment,
  ServiceCatalogItem,
  Appointment,
  AppointmentStatus,
  ServiceOrder,
  ServiceOrderStatus,
  PaymentStatus,
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
  ServiceCategory,
} from './types';
import { calculateNextCleaningDate } from './formatters';

// ==========================================
// CONFIGURAÇÕES DA EMPRESA
// ==========================================
export async function getCompanySettings(): Promise<CompanySettings | null> {
  try {
    const colRef = collection(db, 'company_settings');
    const snap = await getDocs(query(colRef, firestoreLimit(1)));
    if (!snap.empty) {
      const d = snap.docs[0];
      const data = d.data() as any;
      return {
        id: d.id,
        ...data,
        city_state: data.city_state || 'Manaus - AM',
        owner_name: data.owner_name || 'Responsável Técnico',
        technical_registry: data.technical_registry || 'CFT/CRT Especialista em Refrigeração',
        default_technician: data.default_technician || 'Técnico Principal',
        technicians: Array.isArray(data.technicians) && data.technicians.length > 0
          ? data.technicians
          : ['Técnico Principal', 'Técnico Auxiliar'],
      } as CompanySettings;
    }

    const defaultSettings: Omit<CompanySettings, 'id'> = {
      name: 'MG Climatização & Elétrica Residencial',
      slogan: 'Especialistas em Conforto Térmico & Segurança Elétrica',
      cnpj_cpf: '45.123.456/0001-78',
      phone: '(92) 99123-4567',
      whatsapp: '5592991234567',
      email: 'contato@mgclimatizacao.com.br',
      address: 'Rua Principal, 100 - Adrianópolis, Manaus - AM',
      city_state: 'Manaus - AM',
      owner_name: 'Responsável Técnico',
      technical_registry: 'CFT/CRT Especialista em Refrigeração',
      default_technician: 'Técnico Principal',
      technicians: ['Técnico Principal', 'Técnico Auxiliar'],
      default_maintenance_interval_months: 6,
    };

    return { id: 'main', ...defaultSettings };
  } catch (err) {
    console.error('Erro ao buscar configurações da empresa:', err);
    return null;
  }
}

export async function updateCompanySettings(
  id: string,
  updates: Partial<CompanySettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const docId = id && id !== 'default' ? id : 'main';
    const docRef = doc(db, 'company_settings', docId);
    await setDoc(
      docRef,
      {
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (err: any) {
    console.error('Erro ao atualizar configurações da empresa:', err);
    return {
      success: false,
      error: err?.message || 'Erro de permissão ou conexão com o Firestore.',
    };
  }
}

// ==========================================
// GERADOR DE CÓDIGO SEQUENCIAL
// ==========================================
async function getNextSequentialCode(
  collectionName: string,
  prefix: string,
  padLength = 4
): Promise<string> {
  try {
    const year = new Date().getFullYear();
    const yearPrefix = `${prefix}-${year}-`;
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);

    let maxSeq = 0;
    snap.forEach((d) => {
      const code = (d.data() as any).code;
      if (typeof code === 'string' && code.startsWith(yearPrefix)) {
        const parts = code.split('-');
        const seq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `${yearPrefix}${String(nextSeq).padStart(padLength, '0')}`;
  } catch (err) {
    console.error(`Erro ao gerar código para ${collectionName}:`, err);
    const fallbackSeq = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${new Date().getFullYear()}-${fallbackSeq}`;
  }
}

// ==========================================
// CLIENTES & ENDEREÇOS
// ==========================================
export async function getCustomers(searchQuery?: string): Promise<Customer[]> {
  try {
    const customersSnap = await getDocs(collection(db, 'customers'));
    const addressesSnap = await getDocs(collection(db, 'customer_addresses'));
    const equipmentSnap = await getDocs(collection(db, 'equipment'));

    const addressesByCustomer: Record<string, CustomerAddress[]> = {};
    addressesSnap.forEach((d) => {
      const addr = { id: d.id, ...(d.data() as any) } as CustomerAddress;
      if (!addressesByCustomer[addr.customer_id]) addressesByCustomer[addr.customer_id] = [];
      addressesByCustomer[addr.customer_id].push(addr);
    });

    const equipmentByCustomer: Record<string, Equipment[]> = {};
    equipmentSnap.forEach((d) => {
      const eq = { id: d.id, ...(d.data() as any) } as Equipment;
      if (!equipmentByCustomer[eq.customer_id]) equipmentByCustomer[eq.customer_id] = [];
      equipmentByCustomer[eq.customer_id].push(eq);
    });

    let customers: Customer[] = [];
    customersSnap.forEach((d) => {
      const cust = { id: d.id, ...(d.data() as any) } as Customer;
      cust.addresses = addressesByCustomer[cust.id] || [];
      cust.equipment = equipmentByCustomer[cust.id] || [];
      customers.push(cust);
    });

    customers.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      customers = customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.whatsapp?.includes(q) ||
          c.document_cpf_cnpj?.includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }

    return customers;
  } catch (err) {
    console.error('Erro ao buscar clientes:', err);
    return [];
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const custDoc = await getDoc(doc(db, 'customers', id));
    if (!custDoc.exists()) return null;

    const customer = { id: custDoc.id, ...(custDoc.data() as any) } as Customer;

    const [addrSnap, eqSnap] = await Promise.all([
      getDocs(query(collection(db, 'customer_addresses'), where('customer_id', '==', id))),
      getDocs(query(collection(db, 'equipment'), where('customer_id', '==', id))),
    ]);

    customer.addresses = addrSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    customer.equipment = eqSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    return customer;
  } catch (err) {
    console.error('Erro ao buscar cliente por ID:', err);
    return null;
  }
}

export async function createCustomer(payload: {
  name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  document_cpf_cnpj?: string;
  origin?: string;
  notes?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    reference_point?: string;
    label?: string;
  };
  initialAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    reference_point?: string;
    label?: string;
  };
}): Promise<Customer> {
  const now = new Date().toISOString();
  const custData = {
    name: payload.name,
    phone: payload.phone || null,
    whatsapp: payload.whatsapp || null,
    email: payload.email || null,
    document_cpf_cnpj: payload.document_cpf_cnpj || null,
    origin: payload.origin || 'indicacao',
    notes: payload.notes || null,
    status: 'active',
    created_at: now,
    updated_at: now,
  };

  const custRef = await addDoc(collection(db, 'customers'), custData);
  const customerId = custRef.id;

  const addrObj = payload.address || payload.initialAddress;
  const addresses: CustomerAddress[] = [];
  if (addrObj && addrObj.street) {
    const addrData = {
      customer_id: customerId,
      label: 'Principal',
      street: addrObj.street,
      number: addrObj.number || 'S/N',
      complement: addrObj.complement || null,
      neighborhood: addrObj.neighborhood || null,
      city: addrObj.city || 'Manaus',
      state: addrObj.state || 'AM',
      zip_code: addrObj.zip_code || null,
      reference_point: addrObj.reference_point || null,
      is_primary: true,
      created_at: now,
    };
    const addrRef = await addDoc(collection(db, 'customer_addresses'), addrData);
    addresses.push({ id: addrRef.id, ...addrData });
  }

  return {
    id: customerId,
    ...custData,
    status: 'active',
    addresses,
    equipment: [],
  };
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<boolean> {
  try {
    const docRef = doc(db, 'customers', id);
    const cleanUpdates = { ...updates, updated_at: new Date().toISOString() };
    delete (cleanUpdates as any).addresses;
    delete (cleanUpdates as any).equipment;
    await updateDoc(docRef, cleanUpdates);
    return true;
  } catch (err) {
    console.error('Erro ao atualizar cliente:', err);
    return false;
  }
}

export async function addCustomerAddress(address: {
  customer_id: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  reference_point?: string;
  is_primary?: boolean;
}): Promise<CustomerAddress> {
  const now = new Date().toISOString();
  const addrData = {
    customer_id: address.customer_id,
    label: address.label || 'Endereço',
    street: address.street,
    number: address.number || 'S/N',
    complement: address.complement || null,
    neighborhood: address.neighborhood || null,
    city: address.city || 'Manaus',
    state: address.state || 'AM',
    zip_code: address.zip_code || null,
    reference_point: address.reference_point || null,
    is_primary: address.is_primary ?? false,
    created_at: now,
  };
  const docRef = await addDoc(collection(db, 'customer_addresses'), addrData);
  return { id: docRef.id, ...addrData };
}

export async function deleteCustomer(id: string): Promise<boolean> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'customers', id));

    const [addrSnap, eqSnap] = await Promise.all([
      getDocs(query(collection(db, 'customer_addresses'), where('customer_id', '==', id))),
      getDocs(query(collection(db, 'equipment'), where('customer_id', '==', id))),
    ]);

    addrSnap.forEach((d) => batch.delete(d.ref));
    eqSnap.forEach((d) => batch.delete(d.ref));

    await batch.commit();
    return true;
  } catch (err) {
    console.error('Erro ao excluir cliente:', err);
    return false;
  }
}

// ==========================================
// AR-CONDICIONADO & EQUIPAMENTOS
// ==========================================
export async function getEquipment(filters?: {
  customerId?: string;
  status?: string;
}): Promise<Equipment[]> {
  try {
    const colRef = collection(db, 'equipment');
    let snap;
    if (filters?.customerId) {
      snap = await getDocs(query(colRef, where('customer_id', '==', filters.customerId)));
    } else {
      snap = await getDocs(colRef);
    }

    const [custSnap, addrSnap] = await Promise.all([
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'customer_addresses')),
    ]);

    const custMap: Record<string, Customer> = {};
    custSnap.forEach((d) => (custMap[d.id] = { id: d.id, ...(d.data() as any) }));

    const addrMap: Record<string, CustomerAddress> = {};
    addrSnap.forEach((d) => (addrMap[d.id] = { id: d.id, ...(d.data() as any) }));

    let list: Equipment[] = [];
    snap.forEach((d) => {
      const eq = { id: d.id, ...(d.data() as any) } as Equipment;
      eq.customer = custMap[eq.customer_id];
      if (eq.address_id) eq.address = addrMap[eq.address_id];
      list.push(eq);
    });

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((e) => e.status === filters.status);
    }

    list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return list;
  } catch (err) {
    console.error('Erro ao buscar equipamentos:', err);
    return [];
  }
}

export async function createEquipment(payload: {
  customer_id: string;
  address_id?: string;
  environment: string;
  type: string;
  brand?: string;
  model?: string;
  btu_capacity?: number;
  serial_number?: string;
  installation_date?: string;
  last_cleaning_date?: string;
  maintenance_interval_months?: number;
  notes?: string;
}): Promise<Equipment> {
  const interval = payload.maintenance_interval_months || 6;
  const lastCleaning = payload.last_cleaning_date || new Date().toISOString().split('T')[0];
  const nextCleaning = calculateNextCleaningDate(lastCleaning, interval);
  const now = new Date().toISOString();

  const eqData = {
    customer_id: payload.customer_id,
    address_id: payload.address_id || null,
    environment: payload.environment,
    type: payload.type,
    brand: payload.brand || null,
    model: payload.model || null,
    btu_capacity: payload.btu_capacity || null,
    serial_number: payload.serial_number || null,
    installation_date: payload.installation_date || null,
    last_cleaning_date: lastCleaning,
    maintenance_interval_months: interval,
    next_cleaning_date: nextCleaning,
    notes: payload.notes || null,
    status: 'active',
    created_at: now,
    updated_at: now,
  };

  const docRef = await addDoc(collection(db, 'equipment'), eqData);
  const eqId = docRef.id;

  try {
    await addDoc(collection(db, 'maintenance_reminders'), {
      equipment_id: eqId,
      customer_id: payload.customer_id,
      scheduled_for_date: nextCleaning,
      status: 'pending',
      created_at: now,
      updated_at: now,
    });
  } catch (e) {
    console.warn('Falha ao criar lembrete de manutenção inicial:', e);
  }

  return { id: eqId, ...(eqData as any) };
}

export async function updateEquipment(id: string, updates: Partial<Equipment>): Promise<boolean> {
  try {
    const docRef = doc(db, 'equipment', id);
    const cleanUpdates = { ...updates, updated_at: new Date().toISOString() };
    delete (cleanUpdates as any).customer;
    delete (cleanUpdates as any).address;
    await updateDoc(docRef, cleanUpdates);
    return true;
  } catch (err) {
    console.error('Erro ao atualizar equipamento:', err);
    return false;
  }
}

export async function deleteEquipment(id: string): Promise<boolean> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'equipment', id));

    const [remSnap, pmocSnap] = await Promise.all([
      getDocs(query(collection(db, 'maintenance_reminders'), where('equipment_id', '==', id))),
      getDocs(query(collection(db, 'pmoc_equipment'), where('equipment_id', '==', id))),
    ]);

    remSnap.forEach((d) => batch.delete(d.ref));
    pmocSnap.forEach((d) => batch.delete(d.ref));

    await batch.commit();
    return true;
  } catch (err) {
    console.error('Erro ao excluir equipamento:', err);
    return false;
  }
}

// ==========================================
// CATÁLOGO DE SERVIÇOS
// ==========================================
export async function getServiceCatalog(
  category?: 'climatizacao' | 'eletrica'
): Promise<ServiceCatalogItem[]> {
  try {
    const colRef = collection(db, 'service_catalog');
    const snap = await getDocs(colRef);
    let items: ServiceCatalogItem[] = [];
    snap.forEach((d) => items.push({ id: d.id, ...(d.data() as any) }));

    if (category) {
      items = items.filter((i) => i.category === category);
    }

    items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  } catch (err) {
    console.error('Erro ao buscar catálogo de serviços:', err);
    return [];
  }
}

export async function createServiceCatalogItem(item: {
  name: string;
  category: ServiceCategory;
  description?: string;
  default_price: number;
  estimated_duration_min: number;
}): Promise<ServiceCatalogItem> {
  const itemData = {
    ...item,
    status: 'active',
    created_at: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, 'service_catalog'), itemData);
  return { id: docRef.id, ...(itemData as any) };
}

export async function updateServiceCatalogItem(
  id: string,
  updates: Partial<ServiceCatalogItem>
): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'service_catalog', id), updates);
    return true;
  } catch (err) {
    console.error('Erro ao atualizar item do catálogo:', err);
    return false;
  }
}

export async function deleteServiceCatalogItem(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'service_catalog', id));
    return true;
  } catch (err) {
    console.error('Erro ao excluir serviço do catálogo:', err);
    return false;
  }
}

// ==========================================
// AGENDA TÉCNICA (COMPROMISSOS)
// ==========================================
export async function getAppointments(filters?: {
  date?: string;
  status?: string;
  customerId?: string;
}): Promise<Appointment[]> {
  try {
    const snap = await getDocs(collection(db, 'appointments'));
    const [custSnap, addrSnap, eqSnap] = await Promise.all([
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'customer_addresses')),
      getDocs(collection(db, 'equipment')),
    ]);

    const custMap: Record<string, Customer> = {};
    custSnap.forEach((d) => (custMap[d.id] = { id: d.id, ...(d.data() as any) }));

    const addrMap: Record<string, CustomerAddress> = {};
    addrSnap.forEach((d) => (addrMap[d.id] = { id: d.id, ...(d.data() as any) }));

    const eqMap: Record<string, Equipment> = {};
    eqSnap.forEach((d) => (eqMap[d.id] = { id: d.id, ...(d.data() as any) }));

    let list: Appointment[] = [];
    snap.forEach((d) => {
      const app = { id: d.id, ...(d.data() as any) } as Appointment;
      app.customer = custMap[app.customer_id];
      if (app.address_id) app.address = addrMap[app.address_id];
      if (app.equipment_id) app.equipment = eqMap[app.equipment_id];
      list.push(app);
    });

    if (filters?.date) {
      list = list.filter((a) => a.scheduled_date === filters.date);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters?.customerId) {
      list = list.filter((a) => a.customer_id === filters.customerId);
    }

    list.sort((a, b) => {
      const cmpDate = (a.scheduled_date || '').localeCompare(b.scheduled_date || '');
      if (cmpDate !== 0) return cmpDate;
      return (a.scheduled_time || '').localeCompare(b.scheduled_time || '');
    });

    return list;
  } catch (err) {
    console.error('Erro ao buscar agenda técnica:', err);
    return [];
  }
}

export async function createAppointment(payload: {
  customer_id: string;
  address_id?: string;
  equipment_id?: string;
  title: string;
  category: ServiceCategory;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration_min?: number;
  technician_name?: string;
  notes?: string;
  status?: AppointmentStatus;
}): Promise<Appointment> {
  const now = new Date().toISOString();
  const appData = {
    customer_id: payload.customer_id,
    address_id: payload.address_id || null,
    equipment_id: payload.equipment_id || null,
    title: payload.title,
    category: payload.category || 'climatizacao',
    scheduled_date: payload.scheduled_date,
    scheduled_time: payload.scheduled_time,
    estimated_duration_min: payload.estimated_duration_min || 60,
    technician_name: payload.technician_name || 'Técnico Especializado',
    notes: payload.notes || null,
    status: (payload.status || 'confirmed') as AppointmentStatus,
    created_at: now,
    updated_at: now,
  };

  const docRef = await addDoc(collection(db, 'appointments'), appData);
  return { id: docRef.id, ...(appData as any) };
}

export async function updateAppointmentStatus(
  id: string,
  status: string | AppointmentStatus
): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'appointments', id), {
      status,
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('Erro ao atualizar status do agendamento:', err);
    return false;
  }
}

export async function updateAppointment(
  id: string,
  updates: Partial<Appointment>
): Promise<boolean> {
  try {
    const cleanUpdates = { ...updates, updated_at: new Date().toISOString() };
    delete (cleanUpdates as any).customer;
    delete (cleanUpdates as any).address;
    delete (cleanUpdates as any).equipment;
    await updateDoc(doc(db, 'appointments', id), cleanUpdates);
    return true;
  } catch (err) {
    console.error('Erro ao atualizar agendamento:', err);
    return false;
  }
}

// ==========================================
// ORDENS DE SERVIÇO (O.S.)
// ==========================================
export async function getNextOrderCode(): Promise<string> {
  return getNextSequentialCode('service_orders', 'OS');
}

export async function getServiceOrders(filters?: {
  status?: string;
  customerId?: string;
}): Promise<ServiceOrder[]> {
  try {
    const snap = await getDocs(collection(db, 'service_orders'));
    const [custSnap, addrSnap, eqSnap, itemsSnap] = await Promise.all([
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'customer_addresses')),
      getDocs(collection(db, 'equipment')),
      getDocs(collection(db, 'service_order_items')),
    ]);

    const custMap: Record<string, Customer> = {};
    custSnap.forEach((d) => (custMap[d.id] = { id: d.id, ...(d.data() as any) }));

    const addrMap: Record<string, CustomerAddress> = {};
    addrSnap.forEach((d) => (addrMap[d.id] = { id: d.id, ...(d.data() as any) }));

    const eqMap: Record<string, Equipment> = {};
    eqSnap.forEach((d) => (eqMap[d.id] = { id: d.id, ...(d.data() as any) }));

    const itemsByOrder: Record<string, any[]> = {};
    itemsSnap.forEach((d) => {
      const it = { id: d.id, ...(d.data() as any) };
      if (!itemsByOrder[it.service_order_id]) itemsByOrder[it.service_order_id] = [];
      itemsByOrder[it.service_order_id].push(it);
    });

    let list: ServiceOrder[] = [];
    snap.forEach((d) => {
      const order = { id: d.id, ...(d.data() as any) } as ServiceOrder;
      order.customer = custMap[order.customer_id];
      if (order.address_id) order.address = addrMap[order.address_id];
      if (order.equipment_id) order.equipment = eqMap[order.equipment_id];
      order.items = itemsByOrder[order.id] || (order as any).embedded_items || [];
      list.push(order);
    });

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((o) => o.status === filters.status);
    }
    if (filters?.customerId) {
      list = list.filter((o) => o.customer_id === filters.customerId);
    }

    list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return list;
  } catch (err) {
    console.error('Erro ao buscar ordens de serviço:', err);
    return [];
  }
}

export async function getServiceOrderById(id: string): Promise<ServiceOrder | null> {
  try {
    const orderDoc = await getDoc(doc(db, 'service_orders', id));
    if (!orderDoc.exists()) return null;

    const order = { id: orderDoc.id, ...(orderDoc.data() as any) } as ServiceOrder;

    const [cust, addr, eq, itemsSnap] = await Promise.all([
      getCustomerById(order.customer_id),
      order.address_id
        ? getDoc(doc(db, 'customer_addresses', order.address_id))
        : Promise.resolve(null),
      order.equipment_id ? getDoc(doc(db, 'equipment', order.equipment_id)) : Promise.resolve(null),
      getDocs(query(collection(db, 'service_order_items'), where('service_order_id', '==', id))),
    ]);

    order.customer = cust || undefined;
    if (addr && addr.exists()) order.address = { id: addr.id, ...(addr.data() as any) };
    if (eq && eq.exists()) order.equipment = { id: eq.id, ...(eq.data() as any) };

    const fetchedItems = itemsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    order.items = fetchedItems.length > 0 ? fetchedItems : (order as any).embedded_items || [];

    return order;
  } catch (err) {
    console.error('Erro ao buscar ordem de serviço por ID:', err);
    return null;
  }
}

export async function createServiceOrder(payload: {
  customer_id: string;
  address_id?: string;
  equipment_id?: string;
  appointment_id?: string;
  category: ServiceCategory;
  problem_description?: string;
  technician_name?: string;
  scheduled_date?: string;
  is_cleaning?: boolean;
  payment_status?: PaymentStatus;
  payment_method?: string;
  amount_paid?: number;
  total_services?: number;
  total_materials?: number;
  discount?: number;
  total_amount?: number;
  items?: Array<{
    item_type: 'service' | 'material';
    name: string;
    quantity: number;
    unit_price: number;
  }>;
}): Promise<ServiceOrder> {
  const code = await getNextOrderCode();
  const now = new Date().toISOString();

  let totalServices = payload.total_services || 0;
  let totalMaterials = payload.total_materials || 0;

  if (payload.items && payload.items.length > 0) {
    totalServices = 0;
    totalMaterials = 0;
    payload.items.forEach((i) => {
      const subtotal = i.quantity * i.unit_price;
      if (i.item_type === 'service') totalServices += subtotal;
      else totalMaterials += subtotal;
    });
  }

  const totalAmount = payload.total_amount ?? totalServices + totalMaterials;
  const amountPaid = payload.amount_paid || 0;
  const paymentStatus: PaymentStatus =
    payload.payment_status || (amountPaid >= totalAmount && totalAmount > 0 ? 'paid' : 'pending');

  const orderData = {
    code,
    customer_id: payload.customer_id,
    address_id: payload.address_id || null,
    equipment_id: payload.equipment_id || null,
    appointment_id: payload.appointment_id || null,
    category: payload.category || 'climatizacao',
    status: 'open' as ServiceOrderStatus,
    problem_description: payload.problem_description || null,
    technician_name: payload.technician_name || 'Técnico Especializado',
    scheduled_date: payload.scheduled_date || now.split('T')[0],
    is_cleaning: payload.is_cleaning ?? false,
    total_services: totalServices,
    total_materials: totalMaterials,
    discount: 0,
    total_amount: totalAmount,
    payment_status: paymentStatus,
    payment_method: payload.payment_method || null,
    amount_paid: amountPaid,
    created_at: now,
    updated_at: now,
  };

  const docRef = await addDoc(collection(db, 'service_orders'), orderData);
  const orderId = docRef.id;

  const savedItems: any[] = [];
  if (payload.items && payload.items.length > 0) {
    for (const it of payload.items) {
      const itemRecord = {
        service_order_id: orderId,
        item_type: it.item_type,
        name: it.name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.quantity * it.unit_price,
      };
      const itemDoc = await addDoc(collection(db, 'service_order_items'), itemRecord);
      savedItems.push({ id: itemDoc.id, ...itemRecord });
    }
  }

  if (amountPaid > 0) {
    try {
      await addDoc(collection(db, 'financial_transactions'), {
        service_order_id: orderId,
        customer_id: payload.customer_id,
        type: 'income',
        category: 'servico_os',
        description: `Recebimento inicial O.S. ${code}`,
        amount: amountPaid,
        payment_method: payload.payment_method || 'pix',
        transaction_date: now.split('T')[0],
        created_at: now,
      });
    } catch (e) {
      console.warn('Falha ao registrar transação financeira inicial:', e);
    }
  }

  return {
    id: orderId,
    ...(orderData as any),
    items: savedItems,
  };
}

export async function updateServiceOrder(
  id: string,
  payload: {
    status?: ServiceOrderStatus;
    category?: ServiceCategory;
    problem_description?: string | null;
    technical_diagnosis?: string | null;
    checklist_data?: Record<string, boolean | string>;
    technician_name?: string | null;
    scheduled_date?: string | null;
    completed_at?: string | null;
    is_cleaning?: boolean;
    discount?: number;
    total_services?: number;
    total_materials?: number;
    total_amount?: number;
    payment_status?: PaymentStatus;
    payment_method?: string | null;
    amount_paid?: number;
    warranty_terms?: string | null;
    technical_notes?: string | null;
    client_recommendations?: string | null;
    items?: Array<{
      item_type: 'service' | 'material';
      name: string;
      quantity: number;
      unit_price: number;
    }>;
  }
): Promise<ServiceOrder> {
  const existing = await getServiceOrderById(id);
  if (!existing) {
    throw new Error(`Ordem de Serviço com ID ${id} não encontrada.`);
  }

  let totalServices = payload.total_services ?? existing.total_services;
  let totalMaterials = payload.total_materials ?? existing.total_materials;

  if (payload.items) {
    totalServices = 0;
    totalMaterials = 0;
    payload.items.forEach((i) => {
      const sub = i.quantity * i.unit_price;
      if (i.item_type === 'service') totalServices += sub;
      else totalMaterials += sub;
    });

    const oldItemsSnap = await getDocs(
      query(collection(db, 'service_order_items'), where('service_order_id', '==', id))
    );
    const batch = writeBatch(db);
    oldItemsSnap.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    for (const it of payload.items) {
      await addDoc(collection(db, 'service_order_items'), {
        service_order_id: id,
        item_type: it.item_type,
        name: it.name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.quantity * it.unit_price,
      });
    }
  }

  const discount = payload.discount !== undefined ? payload.discount : existing.discount || 0;
  const totalAmount =
    payload.total_amount !== undefined
      ? payload.total_amount
      : Math.max(0, totalServices + totalMaterials - discount);

  const updateFields: any = {
    ...payload,
    total_services: totalServices,
    total_materials: totalMaterials,
    total_amount: totalAmount,
    updated_at: new Date().toISOString(),
  };
  delete updateFields.items;

  await updateDoc(doc(db, 'service_orders', id), updateFields);

  if (payload.status === 'completed' && existing.equipment_id) {
    const compDate = payload.completed_at || new Date().toISOString().split('T')[0];
    const eq = await getDoc(doc(db, 'equipment', existing.equipment_id));
    if (eq.exists()) {
      const interval = (eq.data() as any).maintenance_interval_months || 6;
      const nextCleaning = calculateNextCleaningDate(compDate, interval);
      await updateDoc(eq.ref, {
        last_cleaning_date: compDate,
        next_cleaning_date: nextCleaning,
        updated_at: new Date().toISOString(),
      });
    }
  }

  const updatedOrder = await getServiceOrderById(id);
  if (!updatedOrder) {
    throw new Error('Falha ao recuperar ordem de serviço atualizada.');
  }
  return updatedOrder;
}

export async function completeServiceOrder(
  id: string,
  data: {
    technical_diagnosis?: string;
    checklist_data?: Record<string, boolean | string>;
    client_recommendations?: string;
    payment_status?: PaymentStatus;
    payment_method?: string;
    amount_paid?: number;
    warranty_terms?: string;
  }
): Promise<boolean> {
  const now = new Date().toISOString();
  const res = await updateServiceOrder(id, {
    status: 'completed',
    completed_at: now,
    technical_diagnosis: data.technical_diagnosis,
    checklist_data: data.checklist_data,
    client_recommendations: data.client_recommendations,
    payment_status: data.payment_status || 'paid',
    payment_method: data.payment_method,
    amount_paid: data.amount_paid,
    warranty_terms: data.warranty_terms,
  });

  return !!res;
}

export async function deleteServiceOrder(id: string): Promise<boolean> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'service_orders', id));

    const [itemsSnap, txSnap, attSnap] = await Promise.all([
      getDocs(query(collection(db, 'service_order_items'), where('service_order_id', '==', id))),
      getDocs(
        query(collection(db, 'financial_transactions'), where('service_order_id', '==', id))
      ),
      getDocs(query(collection(db, 'service_attachments'), where('service_order_id', '==', id))),
    ]);

    itemsSnap.forEach((d) => batch.delete(d.ref));
    txSnap.forEach((d) => batch.delete(d.ref));
    attSnap.forEach((d) => batch.delete(d.ref));

    await batch.commit();
    return true;
  } catch (err) {
    console.error('Erro ao excluir ordem de serviço:', err);
    return false;
  }
}

// ==========================================
// RESUMO DO DASHBOARD
// ==========================================
export async function getDashboardSummary() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = `${today.substring(0, 7)}-01`;

    const [appSnap, orderSnap, custSnap, eqSnap, quoteSnap, prodSnap] = await Promise.all([
      getDocs(collection(db, 'appointments')),
      getDocs(collection(db, 'service_orders')),
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'equipment')),
      getDocs(collection(db, 'quotes')),
      getDocs(collection(db, 'products')),
    ]);

    const todayAppointments = appSnap.docs.filter((d) => (d.data() as any).scheduled_date === today)
      .length;

    const openOrdersCount = orderSnap.docs.filter((d) => {
      const st = (d.data() as any).status;
      return st !== 'completed' && st !== 'cancelled';
    }).length;

    const activeCustomersCount = custSnap.docs.filter(
      (d) => (d.data() as any).status === 'active'
    ).length;

    const upcomingMaintenance: any[] = [];
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    eqSnap.forEach((d) => {
      const data = d.data() as any;
      if (data.next_cleaning_date && data.next_cleaning_date <= in30Days) {
        upcomingMaintenance.push({ id: d.id, ...data });
      }
    });

    let monthlyRevenue = 0;
    orderSnap.docs.forEach((d) => {
      const data = d.data() as any;
      if (data.status === 'completed' && data.completed_at && data.completed_at >= firstDayOfMonth) {
        monthlyRevenue += data.amount_paid || data.total_amount || 0;
      }
    });

    const pendingQuotesCount = quoteSnap.docs.filter(
      (d) => (d.data() as any).status === 'awaiting_approval'
    ).length;

    const lowStockProducts: any[] = [];
    prodSnap.forEach((d) => {
      const p = d.data() as any;
      if ((p.quantity || 0) <= (p.min_stock || 0)) {
        lowStockProducts.push({ id: d.id, ...p });
      }
    });

    return {
      todayAppointments,
      openOrdersCount,
      activeCustomersCount,
      upcomingMaintenanceCount: upcomingMaintenance.length,
      monthlyRevenue,
      pendingQuotesCount,
      lowStockProducts,
    };
  } catch (err) {
    console.error('Erro ao buscar resumo do dashboard:', err);
    return {
      todayAppointments: 0,
      openOrdersCount: 0,
      activeCustomersCount: 0,
      upcomingMaintenanceCount: 0,
      monthlyRevenue: 0,
      pendingQuotesCount: 0,
      lowStockProducts: [],
    };
  }
}

// ==========================================
// ORÇAMENTOS COMERCIAIS
// ==========================================
export async function getNextQuoteCode(): Promise<string> {
  return getNextSequentialCode('quotes', 'ORC');
}

export async function getQuotes(filters?: {
  status?: string;
  customerId?: string;
}): Promise<Quote[]> {
  try {
    const snap = await getDocs(collection(db, 'quotes'));
    const [custSnap, eqSnap, itemsSnap] = await Promise.all([
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'equipment')),
      getDocs(collection(db, 'quote_items')),
    ]);

    const custMap: Record<string, Customer> = {};
    custSnap.forEach((d) => (custMap[d.id] = { id: d.id, ...(d.data() as any) }));

    const eqMap: Record<string, Equipment> = {};
    eqSnap.forEach((d) => (eqMap[d.id] = { id: d.id, ...(d.data() as any) }));

    const itemsByQuote: Record<string, QuoteItem[]> = {};
    itemsSnap.forEach((d) => {
      const it = { id: d.id, ...(d.data() as any) } as QuoteItem;
      if (!itemsByQuote[it.quote_id]) itemsByQuote[it.quote_id] = [];
      itemsByQuote[it.quote_id].push(it);
    });

    let list: Quote[] = [];
    snap.forEach((d) => {
      const q = { id: d.id, ...(d.data() as any) } as Quote;
      q.customer = custMap[q.customer_id];
      if (q.equipment_id) q.equipment = eqMap[q.equipment_id];
      q.items = itemsByQuote[q.id] || [];
      list.push(q);
    });

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((q) => q.status === filters.status);
    }
    if (filters?.customerId) {
      list = list.filter((q) => q.customer_id === filters.customerId);
    }

    list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return list;
  } catch (err) {
    console.error('Erro ao buscar orçamentos:', err);
    return [];
  }
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  try {
    const docSnap = await getDoc(doc(db, 'quotes', id));
    if (!docSnap.exists()) return null;

    const quote = { id: docSnap.id, ...(docSnap.data() as any) } as Quote;
    const [cust, eq, itemsSnap] = await Promise.all([
      getCustomerById(quote.customer_id),
      quote.equipment_id ? getDoc(doc(db, 'equipment', quote.equipment_id)) : Promise.resolve(null),
      getDocs(query(collection(db, 'quote_items'), where('quote_id', '==', id))),
    ]);

    quote.customer = cust || undefined;
    if (eq && eq.exists()) quote.equipment = { id: eq.id, ...(eq.data() as any) };
    quote.items = itemsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    return quote;
  } catch (err) {
    console.error('Erro ao buscar orçamento por ID:', err);
    return null;
  }
}

export async function createQuote(payload: {
  customer_id: string;
  address_id?: string | null;
  equipment_id?: string | null;
  category: ServiceCategory;
  valid_days?: number;
  valid_until?: string;
  subtotal?: number;
  discount?: number;
  total_amount?: number;
  payment_terms?: string;
  execution_time_estimate?: string;
  warranty_terms?: string;
  notes?: string;
  items: Array<{
    item_type: 'service' | 'material';
    catalog_service_id?: string | null;
    name: string;
    quantity: number;
    unit_price: number;
    total_price?: number;
  }>;
}): Promise<Quote> {
  const code = await getNextQuoteCode();
  const validDays = payload.valid_days || 15;
  const now = new Date();
  const validUntil =
    payload.valid_until ||
    new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let totalServices = 0;
  let totalMaterials = 0;

  payload.items.forEach((i) => {
    const sub = i.quantity * i.unit_price;
    if (i.item_type === 'service') totalServices += sub;
    else totalMaterials += sub;
  });

  const discount = payload.discount || 0;
  const totalAmount =
    payload.total_amount !== undefined
      ? payload.total_amount
      : Math.max(0, totalServices + totalMaterials - discount);

  const quoteData = {
    code,
    customer_id: payload.customer_id,
    address_id: payload.address_id || null,
    equipment_id: payload.equipment_id || null,
    category: payload.category || 'climatizacao',
    status: 'sent' as QuoteStatus,
    valid_until: validUntil,
    total_services: totalServices,
    total_materials: totalMaterials,
    discount,
    total_amount: totalAmount,
    payment_terms: payload.payment_terms || 'À vista via Pix ou até 3x no cartão',
    execution_time_estimate: payload.execution_time_estimate || null,
    warranty_terms: payload.warranty_terms || null,
    notes: payload.notes || null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const docRef = await addDoc(collection(db, 'quotes'), quoteData);
  const quoteId = docRef.id;

  const savedItems: QuoteItem[] = [];
  for (const it of payload.items) {
    const itemRecord = {
      quote_id: quoteId,
      item_type: it.item_type,
      name: it.name,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.quantity * it.unit_price,
    };
    const iDoc = await addDoc(collection(db, 'quote_items'), itemRecord);
    savedItems.push({ id: iDoc.id, ...(itemRecord as any) });
  }

  return { id: quoteId, ...(quoteData as any), items: savedItems };
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'quotes', id), { status, updated_at: new Date().toISOString() });
    return true;
  } catch (err) {
    console.error('Erro ao atualizar status do orçamento:', err);
    return false;
  }
}

export async function convertQuoteToServiceOrder(quoteId: string): Promise<ServiceOrder | null> {
  const quote = await getQuoteById(quoteId);
  if (!quote) return null;

  const so = await createServiceOrder({
    customer_id: quote.customer_id,
    equipment_id: quote.equipment_id || undefined,
    category: quote.category,
    problem_description: `Orçamento aprovado (${quote.code}): ${quote.notes || 'Execução de serviços conforme proposta'}`,
    items: quote.items?.map((it) => ({
      item_type: it.item_type,
      name: it.name,
      quantity: it.quantity,
      unit_price: it.unit_price,
    })),
  });

  await updateQuoteStatus(quoteId, 'approved');
  return so;
}

export async function deleteQuote(id: string): Promise<boolean> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'quotes', id));
    const itemsSnap = await getDocs(
      query(collection(db, 'quote_items'), where('quote_id', '==', id))
    );
    itemsSnap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Erro ao excluir orçamento:', err);
    return false;
  }
}

// ==========================================
// ANEXOS & FOTOS (COM FIREBASE STORAGE)
// ==========================================
export async function getAttachments(filters: {
  serviceOrderId?: string;
}): Promise<ServiceAttachment[]> {
  try {
    const colRef = collection(db, 'service_attachments');
    const snap = filters.serviceOrderId
      ? await getDocs(query(colRef, where('service_order_id', '==', filters.serviceOrderId)))
      : await getDocs(colRef);

    const list: ServiceAttachment[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
    list.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    return list;
  } catch (err) {
    console.error('Erro ao buscar anexos:', err);
    return [];
  }
}

export async function addAttachment(payload: {
  service_order_id: string;
  file_url: string;
  attachment_type: 'before' | 'after' | 'document' | 'other';
  caption?: string;
}): Promise<ServiceAttachment> {
  const attData = {
    ...payload,
    caption: payload.caption || null,
    created_at: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, 'service_attachments'), attData);
  return { id: docRef.id, ...(attData as any) };
}

export async function deleteAttachment(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'service_attachments', id));
    return true;
  } catch (err) {
    console.error('Erro ao excluir anexo:', err);
    return false;
  }
}

// ==========================================
// FORNECEDORES
// ==========================================
export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const snap = await getDocs(collection(db, 'suppliers'));
    const list: Supplier[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  } catch (err) {
    console.error('Erro ao buscar fornecedores:', err);
    return [];
  }
}

export async function createSupplier(payload: {
  name: string;
  contact_person?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  product_types?: string;
  notes?: string;
}): Promise<Supplier> {
  const supData = {
    ...payload,
    created_at: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, 'suppliers'), supData);
  return { id: docRef.id, ...(supData as any) };
}

export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'suppliers', id), updates);
    return true;
  } catch (err) {
    console.error('Erro ao atualizar fornecedor:', err);
    return false;
  }
}

export async function deleteSupplier(id: string): Promise<void> {
  await deleteDoc(doc(db, 'suppliers', id));
}

// ==========================================
// ESTOQUE & PRODUTOS
// ==========================================
export async function getProducts(filters?: { category?: ProductCategory }): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    let list: Product[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));

    if (filters?.category) {
      list = list.filter((p) => p.category === filters.category);
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docSnap = await getDoc(doc(db, 'products', id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...(docSnap.data() as any) } as Product;
  } catch (err) {
    console.error('Erro ao buscar produto por ID:', err);
    return null;
  }
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const now = new Date().toISOString();
  const prodData = {
    name: payload.name || 'Novo Produto',
    category: payload.category || 'outros',
    unit: payload.unit || 'un',
    quantity: payload.quantity || 0,
    min_stock: payload.min_stock || 1,
    cost_price: payload.cost_price || 0,
    sale_price: payload.sale_price ?? payload.selling_price ?? 0,
    supplier_id: payload.supplier_id || null,
    location: payload.location || null,
    notes: payload.notes || null,
    status: 'active',
    created_at: now,
    updated_at: now,
  };

  const docRef = await addDoc(collection(db, 'products'), prodData);
  const prodId = docRef.id;

  if (prodData.quantity > 0) {
    try {
      await addDoc(collection(db, 'stock_movements'), {
        product_id: prodId,
        movement_type: 'initial',
        quantity: prodData.quantity,
        previous_quantity: 0,
        new_quantity: prodData.quantity,
        unit_cost: prodData.cost_price,
        notes: 'Saldo inicial cadastrado',
        created_at: now,
      });
    } catch (e) {
      console.warn('Falha ao registrar saldo inicial:', e);
    }
  }

  return { id: prodId, ...(prodData as any) };
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
  try {
    const cleanUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (cleanUpdates.selling_price !== undefined && cleanUpdates.sale_price === undefined) {
      cleanUpdates.sale_price = cleanUpdates.selling_price;
    }
    await updateDoc(doc(db, 'products', id), cleanUpdates);
    return true;
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    return false;
  }
}

export async function recordStockMovement(params: {
  productId?: string;
  product_id?: string;
  movement_type?: StockMovementType;
  movementType?: StockMovementType;
  quantity: number;
  unit_cost?: number;
  unitCost?: number;
  service_order_id?: string;
  notes?: string;
}): Promise<boolean> {
  try {
    const targetId = params.product_id || params.productId;
    if (!targetId) return false;

    const moveType = params.movement_type || params.movementType || 'adjustment';
    const product = await getProductById(targetId);
    if (!product) return false;

    const currentQty = product.quantity || 0;
    let newQty = currentQty;

    if (moveType === 'in' || moveType === 'entry' || moveType === 'in_purchase' || moveType === 'initial') {
      newQty = currentQty + params.quantity;
    } else if (moveType === 'out' || moveType === 'exit' || moveType === 'out_service_order' || moveType === 'loss') {
      newQty = Math.max(0, currentQty - params.quantity);
    } else if (moveType === 'adjustment') {
      newQty = params.quantity;
    }

    const now = new Date().toISOString();
    const effectiveCost = params.unit_cost ?? params.unitCost ?? product.cost_price;

    await addDoc(collection(db, 'stock_movements'), {
      product_id: targetId,
      movement_type: moveType,
      quantity: params.quantity,
      previous_quantity: currentQty,
      new_quantity: newQty,
      unit_cost: effectiveCost,
      service_order_id: params.service_order_id || null,
      notes: params.notes || null,
      created_at: now,
    });

    await updateProduct(targetId, { quantity: newQty });
    return true;
  } catch (err) {
    console.error('Erro ao registrar movimentação de estoque:', err);
    return false;
  }
}

export async function getStockMovements(filters?: {
  productId?: string;
  limit?: number;
}): Promise<StockMovement[]> {
  try {
    const snap = await getDocs(collection(db, 'stock_movements'));
    const prodSnap = await getDocs(collection(db, 'products'));

    const prodMap: Record<string, Product> = {};
    prodSnap.forEach((d) => (prodMap[d.id] = { id: d.id, ...(d.data() as any) }));

    let list: StockMovement[] = [];
    snap.forEach((d) => {
      const m = { id: d.id, ...(d.data() as any) } as StockMovement;
      m.product = prodMap[m.product_id];
      list.push(m);
    });

    if (filters?.productId) {
      list = list.filter((m) => m.product_id === filters.productId);
    }

    list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    if (filters?.limit) {
      list = list.slice(0, filters.limit);
    }
    return list;
  } catch (err) {
    console.error('Erro ao buscar histórico de estoque:', err);
    return [];
  }
}

export async function updateStockMovement(
  movementId: string,
  params: {
    movementType?: any;
    movement_type?: any;
    quantity?: number;
    unit_cost?: number;
    unitCost?: number;
    notes?: string;
  }
): Promise<boolean> {
  try {
    const cleanParams: any = { ...params };
    if (cleanParams.movementType) {
      cleanParams.movement_type = cleanParams.movementType;
      delete cleanParams.movementType;
    }
    if (cleanParams.unitCost !== undefined && cleanParams.unit_cost === undefined) {
      cleanParams.unit_cost = cleanParams.unitCost;
      delete cleanParams.unitCost;
    }
    await updateDoc(doc(db, 'stock_movements', movementId), cleanParams);
    return true;
  } catch (err) {
    console.error('Erro ao atualizar movimentação de estoque:', err);
    return false;
  }
}

export async function deleteStockMovement(movementId: string): Promise<void> {
  await deleteDoc(doc(db, 'stock_movements', movementId));
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'products', id));
    return true;
  } catch (err) {
    console.error('Erro ao excluir produto:', err);
    return false;
  }
}

// ==========================================
// LEMBRETES PREVENTIVOS DE HIGIENIZAÇÃO
// ==========================================
export async function getMaintenanceReminders(filters?: {
  status?: ReminderStatus;
  customerId?: string;
}): Promise<MaintenanceReminder[]> {
  try {
    const snap = await getDocs(collection(db, 'maintenance_reminders'));
    const [custSnap, eqSnap] = await Promise.all([
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'equipment')),
    ]);

    const custMap: Record<string, Customer> = {};
    custSnap.forEach((d) => (custMap[d.id] = { id: d.id, ...(d.data() as any) }));

    const eqMap: Record<string, Equipment> = {};
    eqSnap.forEach((d) => (eqMap[d.id] = { id: d.id, ...(d.data() as any) }));

    let list: MaintenanceReminder[] = [];
    snap.forEach((d) => {
      const r = { id: d.id, ...(d.data() as any) } as MaintenanceReminder;
      r.customer = custMap[r.customer_id];
      r.equipment = eqMap[r.equipment_id];
      list.push(r);
    });

    if (filters?.status && filters.status !== ('all' as any)) {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters?.customerId) {
      list = list.filter((r) => r.customer_id === filters.customerId);
    }

    list.sort((a, b) => (a.scheduled_for_date || '').localeCompare(b.scheduled_for_date || ''));
    return list;
  } catch (err) {
    console.error('Erro ao buscar lembretes:', err);
    return [];
  }
}

export async function syncMaintenanceRemindersFromEquipment(): Promise<number> {
  try {
    const eqSnap = await getDocs(collection(db, 'equipment'));
    const remSnap = await getDocs(collection(db, 'maintenance_reminders'));

    const existingRemMap: Record<string, any> = {};
    remSnap.forEach((d) => {
      existingRemMap[(d.data() as any).equipment_id] = d;
    });

    let syncCount = 0;
    const now = new Date().toISOString();

    for (const d of eqSnap.docs) {
      const eq = d.data() as any;
      if (!eq.next_cleaning_date) continue;

      const existingRemDoc = existingRemMap[d.id];
      if (existingRemDoc) {
        await updateDoc(existingRemDoc.ref, {
          scheduled_for_date: eq.next_cleaning_date,
          updated_at: now,
        });
      } else {
        await addDoc(collection(db, 'maintenance_reminders'), {
          equipment_id: d.id,
          customer_id: eq.customer_id,
          scheduled_for_date: eq.next_cleaning_date,
          status: 'pending',
          created_at: now,
          updated_at: now,
        });
      }
      syncCount++;
    }

    return syncCount;
  } catch (err) {
    console.error('Erro ao sincronizar lembretes:', err);
    return 0;
  }
}

export async function logReminderContact(
  reminderId: string,
  paramsOrNotes?: string | { notes?: string; newStatus?: ReminderStatus }
): Promise<MaintenanceReminder> {
  const notes =
    typeof paramsOrNotes === 'string'
      ? paramsOrNotes
      : paramsOrNotes?.notes || 'Contato registrado';
  const newStatus =
    typeof paramsOrNotes === 'object' && paramsOrNotes.newStatus
      ? paramsOrNotes.newStatus
      : 'contacted';

  const now = new Date().toISOString();
  await updateDoc(doc(db, 'maintenance_reminders', reminderId), {
    status: newStatus,
    contacted_at: now,
    notes,
    updated_at: now,
  });

  const snap = await getDoc(doc(db, 'maintenance_reminders', reminderId));
  return { id: snap.id, ...(snap.data() as any) } as MaintenanceReminder;
}

export async function updateReminderStatus(
  id: string,
  status: ReminderStatus
): Promise<MaintenanceReminder> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'maintenance_reminders', id), {
    status,
    updated_at: now,
  });

  const snap = await getDoc(doc(db, 'maintenance_reminders', id));
  return { id: snap.id, ...(snap.data() as any) } as MaintenanceReminder;
}

// ==========================================
// FLUXO DE CAIXA & TRANSAÇÕES FINANCEIRAS
// ==========================================
export async function getFinancialTransactions(filters?: {
  type?: FinancialTransactionType;
  startDate?: string;
  endDate?: string;
}): Promise<FinancialTransaction[]> {
  try {
    const snap = await getDocs(collection(db, 'financial_transactions'));
    const [custSnap, orderSnap] = await Promise.all([
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'service_orders')),
    ]);

    const custMap: Record<string, Customer> = {};
    custSnap.forEach((d) => (custMap[d.id] = { id: d.id, ...(d.data() as any) }));

    const orderMap: Record<string, ServiceOrder> = {};
    orderSnap.forEach((d) => (orderMap[d.id] = { id: d.id, ...(d.data() as any) }));

    let list: FinancialTransaction[] = [];
    snap.forEach((d) => {
      const tx = { id: d.id, ...(d.data() as any) } as FinancialTransaction;
      if (tx.customer_id) tx.customer = custMap[tx.customer_id];
      if (tx.service_order_id) tx.service_order = orderMap[tx.service_order_id];
      list.push(tx);
    });

    if (filters?.type && filters.type !== ('all' as any)) {
      list = list.filter((t) => t.type === filters.type);
    }
    if (filters?.startDate) {
      list = list.filter((t) => (t.transaction_date || '') >= filters.startDate!);
    }
    if (filters?.endDate) {
      list = list.filter((t) => (t.transaction_date || '') <= filters.endDate!);
    }

    list.sort((a, b) => (b.transaction_date || '').localeCompare(a.transaction_date || ''));
    return list;
  } catch (err) {
    console.error('Erro ao buscar transações financeiras:', err);
    return [];
  }
}

export async function createFinancialTransaction(payload: {
  type: FinancialTransactionType;
  category: FinancialCategory;
  description: string;
  amount: number;
  payment_method: FinancialPaymentMethod;
  transaction_date?: string;
  service_order_id?: string;
  customer_id?: string;
  notes?: string;
}): Promise<FinancialTransaction> {
  const txData = {
    ...payload,
    transaction_date: payload.transaction_date || new Date().toISOString().split('T')[0],
    service_order_id: payload.service_order_id || null,
    customer_id: payload.customer_id || null,
    notes: payload.notes || null,
    created_at: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, 'financial_transactions'), txData);
  return { id: docRef.id, ...(txData as any) };
}

export async function deleteFinancialTransaction(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'financial_transactions', id));
    return true;
  } catch (err) {
    console.error('Erro ao excluir transação financeira:', err);
    return false;
  }
}

export async function getFinancialSummary(filters?: {
  startDate?: string;
  endDate?: string;
}) {
  const txs = await getFinancialTransactions(filters);
  let totalIncome = 0;
  let totalExpense = 0;

  txs.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount;
    else if (t.type === 'expense') totalExpense += t.amount;
  });

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionsCount: txs.length,
  };
}

// ==========================================
// TERMOS DE GARANTIA
// ==========================================
export async function getNextWarrantyCode(): Promise<string> {
  return getNextSequentialCode('warranty_terms', 'GAR');
}

export async function getWarrantyTerms(filters?: {
  customerId?: string;
  serviceOrderId?: string;
}): Promise<WarrantyTerm[]> {
  try {
    const snap = await getDocs(collection(db, 'warranty_terms'));
    const [custSnap, orderSnap, eqSnap] = await Promise.all([
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'service_orders')),
      getDocs(collection(db, 'equipment')),
    ]);

    const custMap: Record<string, Customer> = {};
    custSnap.forEach((d) => (custMap[d.id] = { id: d.id, ...(d.data() as any) }));

    const orderMap: Record<string, ServiceOrder> = {};
    orderSnap.forEach((d) => (orderMap[d.id] = { id: d.id, ...(d.data() as any) }));

    const eqMap: Record<string, Equipment> = {};
    eqSnap.forEach((d) => (eqMap[d.id] = { id: d.id, ...(d.data() as any) }));

    let list: WarrantyTerm[] = [];
    snap.forEach((d) => {
      const w = { id: d.id, ...(d.data() as any) } as WarrantyTerm;
      w.customer = custMap[w.customer_id];
      w.service_order = orderMap[w.service_order_id];
      if (w.equipment_id) w.equipment = eqMap[w.equipment_id];
      list.push(w);
    });

    if (filters?.customerId) {
      list = list.filter((w) => w.customer_id === filters.customerId);
    }
    if (filters?.serviceOrderId) {
      list = list.filter((w) => w.service_order_id === filters.serviceOrderId);
    }

    list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return list;
  } catch (err) {
    console.error('Erro ao buscar termos de garantia:', err);
    return [];
  }
}

export async function getWarrantyTermById(id: string): Promise<WarrantyTerm | null> {
  try {
    const docSnap = await getDoc(doc(db, 'warranty_terms', id));
    if (!docSnap.exists()) return null;

    const term = { id: docSnap.id, ...(docSnap.data() as any) } as WarrantyTerm;
    const [cust, order, eq] = await Promise.all([
      getCustomerById(term.customer_id),
      getServiceOrderById(term.service_order_id),
      term.equipment_id ? getDoc(doc(db, 'equipment', term.equipment_id)) : Promise.resolve(null),
    ]);

    term.customer = cust || undefined;
    term.service_order = order || undefined;
    if (eq && eq.exists()) term.equipment = { id: eq.id, ...(eq.data() as any) };

    return term;
  } catch (err) {
    console.error('Erro ao buscar termo de garantia por ID:', err);
    return null;
  }
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

  const termData = {
    code,
    service_order_id: payload.service_order_id,
    customer_id: payload.customer_id,
    equipment_id: payload.equipment_id || null,
    warranty_type: payload.warranty_type || 'servico',
    duration_days: duration,
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
    coverage_details: payload.coverage_details,
    exclusions: payload.exclusions || null,
    notes: payload.notes || null,
    created_at: start.toISOString(),
  };

  const docRef = await addDoc(collection(db, 'warranty_terms'), termData);
  return { id: docRef.id, ...(termData as any) };
}

export async function deleteWarrantyTerm(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'warranty_terms', id));
    return true;
  } catch (err) {
    console.error('Erro ao excluir termo de garantia:', err);
    return false;
  }
}

// ==========================================
// PMOC (LEI FEDERAL 13.589/2018)
// ==========================================
export async function getNextPMOCCode(): Promise<string> {
  return getNextSequentialCode('pmoc_plans', 'PMOC');
}

export async function getPMOCPlans(filters?: {
  customerId?: string;
  status?: string;
}): Promise<PMOCPlan[]> {
  try {
    const snap = await getDocs(collection(db, 'pmoc_plans'));
    const [custSnap, linksSnap, eqSnap] = await Promise.all([
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'pmoc_equipment')),
      getDocs(collection(db, 'equipment')),
    ]);

    const custMap: Record<string, Customer> = {};
    custSnap.forEach((d) => (custMap[d.id] = { id: d.id, ...(d.data() as any) }));

    const eqMap: Record<string, Equipment> = {};
    eqSnap.forEach((d) => (eqMap[d.id] = { id: d.id, ...(d.data() as any) }));

    const linksByPlan: Record<string, PMOCEquipment[]> = {};
    linksSnap.forEach((d) => {
      const link = { id: d.id, ...(d.data() as any) } as PMOCEquipment;
      link.equipment = eqMap[link.equipment_id];
      if (!linksByPlan[link.pmoc_id]) linksByPlan[link.pmoc_id] = [];
      linksByPlan[link.pmoc_id].push(link);
    });

    let list: PMOCPlan[] = [];
    snap.forEach((d) => {
      const plan = { id: d.id, ...(d.data() as any) } as PMOCPlan;
      plan.customer = custMap[plan.customer_id];
      plan.equipment_links = linksByPlan[plan.id] || [];
      list.push(plan);
    });

    if (filters?.customerId) {
      list = list.filter((p) => p.customer_id === filters.customerId);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((p) => p.status === filters.status);
    }

    list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return list;
  } catch (err) {
    console.error('Erro ao buscar planos PMOC:', err);
    return [];
  }
}

export async function getPMOCPlanById(id: string): Promise<PMOCPlan | null> {
  try {
    const docSnap = await getDoc(doc(db, 'pmoc_plans', id));
    if (!docSnap.exists()) return null;

    const plan = { id: docSnap.id, ...(docSnap.data() as any) } as PMOCPlan;
    const [cust, linksSnap, eqSnap] = await Promise.all([
      getCustomerById(plan.customer_id),
      getDocs(query(collection(db, 'pmoc_equipment'), where('pmoc_id', '==', id))),
      getDocs(collection(db, 'equipment')),
    ]);

    const eqMap: Record<string, Equipment> = {};
    eqSnap.forEach((d) => (eqMap[d.id] = { id: d.id, ...(d.data() as any) }));

    plan.customer = cust || undefined;
    plan.equipment_links = linksSnap.docs.map((d) => {
      const link = { id: d.id, ...(d.data() as any) } as PMOCEquipment;
      link.equipment = eqMap[link.equipment_id];
      return link;
    });

    return plan;
  } catch (err) {
    console.error('Erro ao buscar plano PMOC por ID:', err);
    return null;
  }
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
  let totalBtu = 0;

  if (equipmentIds.length > 0) {
    const eqDocs = await Promise.all(
      equipmentIds.map((eid) => getDoc(doc(db, 'equipment', eid)))
    );
    eqDocs.forEach((d) => {
      if (d.exists()) {
        totalBtu += (d.data() as any).btu_capacity || 0;
      }
    });
  }

  const planData = {
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
    created_at: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, 'pmoc_plans'), planData);
  const planId = docRef.id;

  if (equipmentIds.length > 0) {
    for (let i = 0; i < equipmentIds.length; i++) {
      await addDoc(collection(db, 'pmoc_equipment'), {
        pmoc_id: planId,
        equipment_id: equipmentIds[i],
        tag_code: `TAG-AC-${String(i + 1).padStart(2, '0')}`,
      });
    }
  }

  return (await getPMOCPlanById(planId)) as PMOCPlan;
}

export async function deletePMOCPlan(id: string): Promise<boolean> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'pmoc_plans', id));
    const linksSnap = await getDocs(
      query(collection(db, 'pmoc_equipment'), where('pmoc_id', '==', id))
    );
    linksSnap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Erro ao excluir plano PMOC:', err);
    return false;
  }
}

export type ServiceCategory = 'climatizacao' | 'eletrica';

export type CustomerStatus = 'active' | 'archived';

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  zip_code?: string | null;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  reference_point?: string | null;
  access_notes?: string | null;
  is_primary: boolean;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  document_cpf_cnpj?: string | null;
  origin?: string | null;
  notes?: string | null;
  status: CustomerStatus;
  created_at?: string;
  updated_at?: string;
  addresses?: CustomerAddress[];
  equipment?: Equipment[];
}

export type EquipmentType = 'split' | 'inverter' | 'cassete' | 'janela' | 'piso_teto' | 'multi_split';
export type EquipmentStatus = 'active' | 'inactive';

export interface Equipment {
  id: string;
  customer_id: string;
  address_id?: string | null;
  environment: string;
  type: EquipmentType;
  brand?: string | null;
  model?: string | null;
  btu_capacity?: number | null;
  serial_number?: string | null;
  installation_date?: string | null;
  last_cleaning_date?: string | null;
  last_maintenance_date?: string | null;
  maintenance_interval_months: number;
  next_cleaning_date?: string | null;
  notes?: string | null;
  status: EquipmentStatus;
  created_at?: string;
  updated_at?: string;
  customer?: Customer;
  address?: CustomerAddress;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: ServiceCategory;
  description?: string | null;
  default_price: number;
  estimated_duration_min: number;
  status: 'active' | 'inactive';
  created_at?: string;
}

export type AppointmentStatus =
  | 'requested'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'in_transit'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'missed';

export interface Appointment {
  id: string;
  customer_id: string;
  address_id?: string | null;
  equipment_id?: string | null;
  title: string;
  category: ServiceCategory;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration_min: number;
  status: AppointmentStatus;
  technician_name?: string | null;
  notes?: string | null;
  service_order_id?: string | null;
  created_at?: string;
  updated_at?: string;
  customer?: Customer;
  address?: CustomerAddress;
  equipment?: Equipment;
}

export type ServiceOrderStatus =
  | 'open'
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'awaiting_quote'
  | 'awaiting_parts'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface ServiceOrderItem {
  id: string;
  service_order_id: string;
  item_type: 'service' | 'material';
  catalog_service_id?: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ServiceOrder {
  id: string;
  code: string;
  customer_id: string;
  address_id?: string | null;
  equipment_id?: string | null;
  appointment_id?: string | null;
  category: ServiceCategory;
  status: ServiceOrderStatus;
  problem_description?: string | null;
  technical_diagnosis?: string | null;
  checklist_data?: Record<string, boolean | string>;
  technician_name?: string | null;
  scheduled_date?: string | null;
  completed_at?: string | null;
  is_cleaning: boolean;
  total_services: number;
  total_materials: number;
  discount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method?: string | null;
  amount_paid: number;
  warranty_terms?: string | null;
  technical_notes?: string | null;
  client_recommendations?: string | null;
  created_at?: string;
  updated_at?: string;
  customer?: Customer;
  address?: CustomerAddress;
  equipment?: Equipment;
  items?: ServiceOrderItem[];
}

export interface CompanySettings {
  id: string;
  name: string;
  slogan?: string | null;
  cnpj_cpf?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  default_maintenance_interval_months: number;
}

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface QuoteItem {
  id: string;
  quote_id: string;
  item_type: 'service' | 'material';
  catalog_service_id?: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Quote {
  id: string;
  code: string;
  customer_id: string;
  address_id?: string | null;
  equipment_id?: string | null;
  category: ServiceCategory;
  status: QuoteStatus;
  issue_date: string;
  valid_until: string;
  subtotal: number;
  discount: number;
  total_amount: number;
  payment_terms?: string | null;
  execution_time_estimate?: string | null;
  warranty_terms?: string | null;
  notes?: string | null;
  service_order_id?: string | null;
  created_at?: string;
  updated_at?: string;
  customer?: Customer;
  address?: CustomerAddress;
  equipment?: Equipment;
  items?: QuoteItem[];
}

export type AttachmentType = 'before' | 'after' | 'document' | 'receipt';

export interface ServiceAttachment {
  id: string;
  service_order_id?: string | null;
  quote_id?: string | null;
  file_url: string;
  attachment_type: AttachmentType;
  caption?: string | null;
  created_at?: string;
}

export type ProductCategory = 'gas' | 'quimico' | 'peca' | 'eletrica' | 'ferramenta' | 'outros';
export type ProductUnit = 'un' | 'kg' | 'l' | 'm' | 'cx' | 'kit';

export interface Supplier {
  id: string;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  city?: string | null;
  notes?: string | null;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  sku?: string | null;
  unit: ProductUnit;
  quantity: number;
  min_stock: number;
  cost_price: number;
  sale_price: number;
  selling_price?: number;
  supplier_id?: string | null;
  location?: string | null;
  notes?: string | null;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  supplier?: Supplier;
}

export type StockMovementType =
  | 'in_purchase'
  | 'out_service_order'
  | 'adjustment'
  | 'loss'
  | 'return'
  | 'entry'
  | 'exit'
  | 'service_order'
  | 'initial'
  | 'in'
  | 'out';

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  unit_cost?: number | null;
  service_order_id?: string | null;
  notes?: string | null;
  created_at?: string;
  product?: Product;
}

export type ReminderStatus = 'pending' | 'contacted' | 'scheduled' | 'dismissed';

export interface MaintenanceReminder {
  id: string;
  equipment_id: string;
  customer_id: string;
  scheduled_for_date: string;
  contacted_at?: string | null;
  status: ReminderStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  equipment?: Equipment;
  customer?: Customer;
}

export type FinancialTransactionType = 'income' | 'expense';
export type FinancialCategory =
  | 'combustivel'
  | 'ferramentas'
  | 'refeicao'
  | 'insumos'
  | 'prolabore'
  | 'servico_os'
  | 'aluguel_oficina'
  | 'energia_agua'
  | 'outros';

export type FinancialPaymentMethod =
  | 'pix'
  | 'dinheiro'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'boleto'
  | 'transferencia'
  | 'outro';

export interface FinancialTransaction {
  id: string;
  type: FinancialTransactionType;
  category: FinancialCategory;
  description: string;
  amount: number;
  payment_method?: FinancialPaymentMethod | null;
  status: 'paid' | 'pending' | 'cancelled';
  transaction_date: string;
  due_date?: string | null;
  service_order_id?: string | null;
  customer_id?: string | null;
  supplier_id?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  customer?: Customer;
  supplier?: Supplier;
  service_order?: ServiceOrder;
}

export type WarrantyType = 'servico' | 'peca' | 'instalacao' | 'geral';

export interface WarrantyTerm {
  id: string;
  code: string;
  service_order_id: string;
  customer_id: string;
  equipment_id?: string | null;
  warranty_type: WarrantyType;
  duration_days: number;
  start_date: string;
  end_date: string;
  coverage_details: string;
  exclusions?: string | null;
  notes?: string | null;
  created_at?: string;
  customer?: Customer;
  service_order?: ServiceOrder;
  equipment?: Equipment;
}

export type PMOCPeriodicity = 'mensal' | 'bimestral' | 'trimestral' | 'semestral';
export type PMOCPlanStatus = 'active' | 'draft' | 'archived';

export interface PMOCEquipment {
  id: string;
  pmoc_id: string;
  equipment_id: string;
  tag_code?: string | null;
  notes?: string | null;
  created_at?: string;
  equipment?: Equipment;
}

export interface PMOCPlan {
  id: string;
  code: string;
  customer_id: string;
  responsible_technician: string;
  technician_crea_cft?: string | null;
  establishment_name: string;
  activity_type: string;
  total_refrigeration_capacity_btu: number;
  periodicity: PMOCPeriodicity;
  status: PMOCPlanStatus;
  start_date: string;
  valid_until: string;
  emergency_contact?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  customer?: Customer;
  equipment_links?: PMOCEquipment[];
}


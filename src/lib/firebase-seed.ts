import { db } from './firebase';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';

/**
 * Função de inicialização de dados básicos no Firebase Firestore
 * Pode ser executada caso o banco esteja vazio.
 */
export async function seedInitialFirebaseData() {
  try {
    // 1. Configurações da Empresa
    const settingsSnap = await getDocs(collection(db, 'company_settings'));
    if (settingsSnap.empty) {
      await addDoc(collection(db, 'company_settings'), {
        name: 'MG Climatização & Elétrica Residencial',
        slogan: 'Especialistas em Conforto Térmico & Segurança Elétrica em Tangará - RN',
        cnpj_cpf: '45.123.456/0001-78',
        phone: '(84) 99461-3185',
        whatsapp: '5584994613185',
        email: 'contato@mgclimatizacao.com.br',
        address: 'Centro, Tangará - RN',
        city_state: 'Tangará - RN',
        default_maintenance_interval_months: 6,
        created_at: new Date().toISOString(),
      });
      console.log('✓ Configurações da empresa criadas no Firestore');
    }

    // 2. Catálogo Básico de Serviços
    const catalogSnap = await getDocs(collection(db, 'service_catalog'));
    if (catalogSnap.empty) {
      const defaultServices = [
        {
          name: 'Higienização Completa Split (9.000 a 12.000 BTUs)',
          category: 'climatizacao',
          description: 'Desmontagem, aplicação de bactericida, limpeza da turbina, serpentina e bandeja.',
          default_price: 150.0,
          estimated_duration_min: 60,
          status: 'active',
          created_at: new Date().toISOString(),
        },
        {
          name: 'Higienização Completa Split (18.000 a 30.000 BTUs)',
          category: 'climatizacao',
          description: 'Limpeza profunda de alta capacidade com produto homologado pela ANVISA.',
          default_price: 220.0,
          estimated_duration_min: 90,
          status: 'active',
          created_at: new Date().toISOString(),
        },
        {
          name: 'Instalação Padrão Split Hi-Wall (até 12.000 BTUs)',
          category: 'climatizacao',
          description: 'Instalação com até 3m de tubulação de cobre, vácuo com bomba e teste de estanqueidade.',
          default_price: 450.0,
          estimated_duration_min: 150,
          status: 'active',
          created_at: new Date().toISOString(),
        },
        {
          name: 'Carga de Gás Refrigerante R410A / R32',
          category: 'climatizacao',
          description: 'Localização de micro-vazamento, vácuo e recarga por peso na balança digital.',
          default_price: 280.0,
          estimated_duration_min: 75,
          status: 'active',
          created_at: new Date().toISOString(),
        },
        {
          name: 'Instalação de Ponto Exclusivo para Ar-Condicionado',
          category: 'eletrica',
          description: 'Circuito dedicado com disjuntor bipolar no QDC e fiação antichama.',
          default_price: 180.0,
          estimated_duration_min: 90,
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ];

      for (const s of defaultServices) {
        await addDoc(collection(db, 'service_catalog'), s);
      }
      console.log('✓ Catálogo inicial de serviços criado');
    }

    return true;
  } catch (err) {
    console.error('Erro ao executar seed do Firebase:', err);
    return false;
  }
}

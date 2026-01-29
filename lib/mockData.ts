// Mock data types and utilities
// Şimdilik veritabanı yerine bu mock veriyi kullanacağız

export type CompanyType = 'income' | 'expense';
export type PaymentStatus = 'pending' | 'paid';
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'iban';

export interface Company {
  id: number;
  name: string;
  type: CompanyType;
  contactPerson?: string;
  phone?: string;
  address?: string;
}

export interface Invoice {
  id: number;
  companyId: number;
  companyName: string;
  type: 'income' | 'expense';
  amount: number;
  invoiceDate: string;
  paymentStatus: PaymentStatus;
  description?: string;
  month: number;
  year: number;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  person: string;
  paymentMethod: PaymentMethod;
  amount: number;
  transactionDate: string;
  month: number;
  year: number;
  description?: string;
}

// Mock Companies
export const mockCompanies: Company[] = [
  // Gelir Firmaları (Restoranlar)
  { id: 1, name: 'Kebapçı Mehmet', type: 'income', contactPerson: 'Mehmet Yılmaz', phone: '0532 123 4567' },
  { id: 2, name: 'Dürüm Evi', type: 'income', contactPerson: 'Ayşe Demir', phone: '0533 234 5678' },
  { id: 3, name: 'Lahmacun Express', type: 'income', contactPerson: 'Ali Kaya', phone: '0534 345 6789' },
  { id: 4, name: 'Pide Sarayı', type: 'income', contactPerson: 'Fatma Öztürk', phone: '0535 456 7890' },

  // Gider Firmaları (Tedarikçiler)
  { id: 5, name: 'Atlas Değirmencilik', type: 'expense', contactPerson: 'Hasan Çelik', phone: '0536 567 8901' },
  { id: 6, name: 'Ekmek Malzemeleri A.Ş.', type: 'expense', contactPerson: 'Zeynep Arslan', phone: '0537 678 9012' },
  { id: 7, name: 'Elektrik Şirketi', type: 'expense', phone: '0538 789 0123' },
];

// Mock Invoices (Ocak 2026)
export const mockInvoices: Invoice[] = [
  // Gider Faturaları
  {
    id: 1,
    companyId: 5,
    companyName: 'Atlas Değirmencilik',
    type: 'expense',
    amount: 84400,
    invoiceDate: '2026-01-25',
    paymentStatus: 'pending',
    description: 'Un',
    month: 1,
    year: 2026,
  },
  {
    id: 2,
    companyId: 6,
    companyName: 'Ekmek Malzemeleri A.Ş.',
    type: 'expense',
    amount: 15000,
    invoiceDate: '2026-01-24',
    paymentStatus: 'pending',
    description: 'Malzeme',
    month: 1,
    year: 2026,
  },

  // Gelir Faturaları
  {
    id: 3,
    companyId: 1,
    companyName: 'Kebapçı Mehmet',
    type: 'income',
    amount: 16300,
    invoiceDate: '2026-01-18',
    paymentStatus: 'paid',
    description: 'Lavaş satışı',
    month: 1,
    year: 2026,
  },
  {
    id: 4,
    companyId: 2,
    companyName: 'Dürüm Evi',
    type: 'income',
    amount: 103300,
    invoiceDate: '2026-01-19',
    paymentStatus: 'paid',
    description: 'Lavaş satışı',
    month: 1,
    year: 2026,
  },
];

// Mock Transactions
export const mockTransactions: Transaction[] = [
  { id: 1, type: 'income', person: 'Ahmet', paymentMethod: 'cash', amount: 50000, transactionDate: '2026-01-15', month: 1, year: 2026, description: 'Nakit gelir' },
  { id: 2, type: 'income', person: 'Mehmet', paymentMethod: 'iban', amount: 100000, transactionDate: '2026-01-20', month: 1, year: 2026, description: 'Banka havalesi' },
  { id: 3, type: 'expense', person: 'Ayşe', paymentMethod: 'cash', amount: 30000, transactionDate: '2026-01-18', month: 1, year: 2026, description: 'Nakit gider' },
  { id: 4, type: 'expense', person: 'Fatma', paymentMethod: 'iban', amount: 20000, transactionDate: '2026-01-22', month: 1, year: 2026, description: 'Banka havalesi gider' },
];

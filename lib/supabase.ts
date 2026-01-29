import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (public)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with service role (for admin operations)
export function createServerClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

// Database types based on our schema
export type CompanyType = 'income' | 'expense';
export type PaymentStatus = 'pending' | 'paid';
export type PaymentMethod = 'cash' | 'iban';

export interface Company {
    id: number;
    name: string;
    type: CompanyType;
    contact_person: string | null;
    phone: string | null;
    address: string | null;
    created_at: string;
    updated_at: string;
}

export interface Invoice {
    id: number;
    company_id: number | null;
    type: CompanyType;
    amount: number;
    invoice_date: string;
    payment_status: PaymentStatus;
    description: string | null;
    month: number;
    year: number;
    created_at: string;
    updated_at: string;
    // Joined field
    company?: Company;
}

export interface Transaction {
    id: number;
    type: CompanyType;
    person: string;
    payment_method: PaymentMethod;
    amount: number;
    transaction_date: string;
    month: number;
    year: number;
    description: string | null;
    created_at: string;
}

export interface MonthlyClosure {
    id: number;
    month: number;
    year: number;
    total_income: number;
    total_expense: number;
    profit_loss: number;
    target_income: number | null;
    difference: number | null;
    notes: string | null;
    closed_at: string;
}

export interface User {
    id: number;
    username: string;
    password_hash: string;
    full_name: string | null;
    created_at: string;
    last_login: string | null;
}

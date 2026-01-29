'use client';

import { useState, useEffect } from 'react';
import { supabase, Invoice, Company } from '@/lib/supabase';
import { formatDate } from '@/lib/calculations';

// UI için genişletilmiş Invoice tipi
interface InvoiceWithCompany extends Invoice {
    companyName: string;
}

interface MonthlyData {
    month: number;
    year: number;
    incomeCount: number;
    expenseCount: number;
    totalIncome: number;
    totalExpense: number;
    difference: number;
}

export default function GecmisPage() {
    const [invoices, setInvoices] = useState<InvoiceWithCompany[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<InvoiceWithCompany | null>(null);
    const [loading, setLoading] = useState(true);

    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Tüm faturaları çek (company bilgisi ile birlikte)
            const { data: invoicesData, error: invoicesError } = await supabase
                .from('invoices')
                .select(`
                    *,
                    company:companies(*)
                `)
                .order('invoice_date', { ascending: false });

            if (invoicesError) throw invoicesError;

            // Firmaları çek
            const { data: companiesData, error: companiesError } = await supabase
                .from('companies')
                .select('*')
                .order('name');

            if (companiesError) throw companiesError;

            // Invoice verisini UI formatına çevir
            const formattedInvoices: InvoiceWithCompany[] = (invoicesData || []).map((inv) => ({
                ...inv,
                companyName: inv.company?.name || 'Bilinmeyen Firma'
            }));

            setInvoices(formattedInvoices);
            setCompanies(companiesData || []);
        } catch (error) {
            console.error('Veri yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    // Aylara göre grupla
    const groupByMonth = (): MonthlyData[] => {
        const groups = new Map<string, InvoiceWithCompany[]>();

        invoices.forEach(inv => {
            const key = `${inv.year}-${inv.month}`;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(inv);
        });

        return Array.from(groups.entries())
            .map(([key, invs]) => {
                const [year, month] = key.split('-').map(Number);
                const incomeInvoices = invs.filter(i => i.type === 'income');
                const expenseInvoices = invs.filter(i => i.type === 'expense');
                const totalIncome = incomeInvoices.reduce((sum, i) => sum + i.amount, 0);
                const totalExpense = expenseInvoices.reduce((sum, i) => sum + i.amount, 0);

                return {
                    month,
                    year,
                    incomeCount: incomeInvoices.length,
                    expenseCount: expenseInvoices.length,
                    totalIncome,
                    totalExpense,
                    difference: totalIncome - totalExpense,
                };
            })
            .sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            });
    };

    const monthlyData = groupByMonth();

    const handleShowDetail = (month: number, year: number) => {
        setSelectedMonth({ month, year });
    };

    const handleEditInvoice = (invoice: InvoiceWithCompany) => {
        setEditingInvoice(invoice);
    };

    const handleUpdateInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingInvoice) return;

        const formData = new FormData(e.currentTarget);
        const updatedData = {
            amount: parseFloat(formData.get('amount') as string),
            invoice_date: formData.get('invoiceDate') as string,
            payment_status: formData.get('paymentStatus') as 'pending' | 'paid',
            description: formData.get('description') as string || null,
        };

        try {
            const { error } = await supabase
                .from('invoices')
                .update(updatedData)
                .eq('id', editingInvoice.id);

            if (error) throw error;

            fetchData();
            setEditingInvoice(null);
        } catch (error) {
            console.error('Fatura güncellenirken hata:', error);
        }
    };

    const handleDeleteInvoice = async (id: number) => {
        try {
            const { error } = await supabase
                .from('invoices')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Fatura silinirken hata:', error);
        }
    };

    const getMonthInvoices = () => {
        if (!selectedMonth) return [];
        return invoices.filter(inv => inv.month === selectedMonth.month && inv.year === selectedMonth.year);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4">
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Geçmiş Aylar</h1>
            </div>

            <div className="table-container">
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                        AYLIK KAPANIŞLAR
                    </h2>
                </div>
                <table className="table">
                    <thead>
                        <tr>
                            <th>AY</th>
                            <th>GELİR FATURA</th>
                            <th>GİDER FATURA</th>
                            <th>FARK</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {monthlyData.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                                    Henüz kaydedilmiş fatura bulunmamaktadır.
                                </td>
                            </tr>
                        ) : (
                            monthlyData.map((data, idx) => (
                                <tr key={idx}>
                                    <td>{monthNames[data.month - 1]} {data.year}</td>
                                    <td style={{ color: 'var(--success)' }}>{data.incomeCount} Adet</td>
                                    <td style={{ color: 'var(--error)' }}>{data.expenseCount} Adet</td>
                                    <td style={{ color: data.difference >= 0 ? 'var(--success)' : 'var(--error)' }}>
                                        {data.difference >= 0 ? '+' : ''}₺{data.difference.toLocaleString('tr-TR')}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleShowDetail(data.month, data.year)}
                                            className="btn btn-sm btn-secondary"
                                        >
                                            Detay
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* DETAY MODAL */}
            {selectedMonth && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setSelectedMonth(null)}
                >
                    <div
                        className="card"
                        style={{ width: '90%', maxWidth: '1200px', maxHeight: '80vh', overflow: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="card-header">
                            {monthNames[selectedMonth.month - 1]} {selectedMonth.year} - Fatura Detayları
                        </h2>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>FİRMA</th>
                                    <th>TİP</th>
                                    <th>TUTAR</th>
                                    <th>TARİH</th>
                                    <th>ÖDEME DURUMU</th>
                                    <th>AÇIKLAMA</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {getMonthInvoices().map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td>{invoice.companyName}</td>
                                        <td>
                                            <span
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    backgroundColor: invoice.type === 'income' ? 'var(--success-bg)' : 'var(--error-bg)',
                                                    color: invoice.type === 'income' ? 'var(--success)' : 'var(--error)',
                                                }}
                                            >
                                                {invoice.type === 'income' ? 'Gelir' : 'Gider'}
                                            </span>
                                        </td>
                                        <td style={{ color: invoice.type === 'income' ? 'var(--success)' : 'var(--error)' }}>
                                            ₺{invoice.amount.toLocaleString('tr-TR')}
                                        </td>
                                        <td>{formatDate(invoice.invoice_date)}</td>
                                        <td>
                                            {invoice.payment_status === 'paid' ? (
                                                <span style={{ color: 'var(--success)' }}>✓</span>
                                            ) : (
                                                <span style={{ color: 'var(--error)' }}>✗</span>
                                            )}
                                        </td>
                                        <td>{invoice.description || '-'}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleEditInvoice(invoice)}
                                                className="btn btn-sm"
                                                style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }}
                                            >
                                                Düzenle
                                            </button>
                                            <button
                                                onClick={() => handleDeleteInvoice(invoice.id)}
                                                className="btn btn-sm"
                                                style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--error-bg)', color: 'var(--error)' }}
                                            >
                                                Sil
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* DÜZENLEME MODAL */}
            {editingInvoice && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1001,
                    }}
                    onClick={() => setEditingInvoice(null)}
                >
                    <div
                        className="card"
                        style={{ width: '500px', maxWidth: '90%' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="card-header">Fatura Düzenle</h2>
                        <form onSubmit={handleUpdateInvoice}>
                            <div className="form-group">
                                <label className="form-label">Firma</label>
                                <input
                                    type="text"
                                    value={editingInvoice.companyName}
                                    disabled
                                    className="form-input"
                                    style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tutar</label>
                                <input
                                    type="number"
                                    name="amount"
                                    defaultValue={editingInvoice.amount}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tarih</label>
                                <input
                                    type="date"
                                    name="invoiceDate"
                                    defaultValue={editingInvoice.invoice_date}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ödeme Durumu</label>
                                <select
                                    name="paymentStatus"
                                    defaultValue={editingInvoice.payment_status}
                                    className="form-select"
                                    required
                                >
                                    <option value="paid">Ödendi</option>
                                    <option value="pending">Ödenmedi</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Açıklama</label>
                                <input
                                    type="text"
                                    name="description"
                                    defaultValue={editingInvoice.description || ''}
                                    className="form-input"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="btn btn-primary">
                                    Kaydet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingInvoice(null)}
                                    className="btn btn-secondary"
                                >
                                    İptal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

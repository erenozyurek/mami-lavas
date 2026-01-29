'use client';

import { useState, useEffect } from 'react';
import { supabase, Transaction } from '@/lib/supabase';
import { formatDate } from '@/lib/calculations';

export default function GelirGiderPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<'income' | 'expense'>('income');
    const [dateFilter, setDateFilter] = useState<'1' | '3' | '6' | '12'>('1');
    const [sortBy, setSortBy] = useState<'amount' | 'date' | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('transaction_date', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('İşlemler yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    // Tarih filtreleme
    const filterByDate = (trans: Transaction[]) => {
        const now = new Date();
        const monthsAgo = new Date();
        monthsAgo.setMonth(now.getMonth() - parseInt(dateFilter));

        return trans.filter(t => new Date(t.transaction_date) >= monthsAgo);
    };

    // Sıralama
    const sortTransactions = (trans: Transaction[]) => {
        if (!sortBy) return trans;

        return [...trans].sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'amount') {
                comparison = a.amount - b.amount;
            } else if (sortBy === 'date') {
                comparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    };

    const handleSort = (column: 'amount' | 'date') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    // Filtrelenmiş ve sıralanmış işlemler
    const filteredTransactions = sortTransactions(filterByDate(transactions));

    // Toplam gelir ve gider hesapla (filtrelenmiş verilerle)
    const totalIncome = filteredTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const transactionDate = formData.get('transactionDate') as string;
        const date = new Date(transactionDate);

        const newTransaction = {
            type: formType,
            person: formData.get('person') as string,
            payment_method: formData.get('paymentMethod') as 'cash' | 'iban',
            amount: parseFloat(formData.get('amount') as string),
            transaction_date: transactionDate,
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            description: formData.get('description') as string || null,
        };

        try {
            const { error } = await supabase
                .from('transactions')
                .insert(newTransaction);

            if (error) throw error;

            fetchTransactions();
            setShowForm(false);
            e.currentTarget.reset();
        } catch (error) {
            console.error('İşlem eklenirken hata:', error);
        }
    };

    const handleDeleteTransaction = async (id: number) => {
        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchTransactions();
        } catch (error) {
            console.error('İşlem silinirken hata:', error);
        }
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
            <div className="flex-between mb-4">
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Gelir/Gider Takibi</h1>
            </div>

            {/* ÖZET KARTLAR */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Toplam Gelir
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>
                        ₺{totalIncome.toLocaleString('tr-TR')}
                    </div>
                </div>

                <div className="card">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Toplam Gider
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--error)' }}>
                        ₺{totalExpense.toLocaleString('tr-TR')}
                    </div>
                </div>

                <div className="card">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Kalan Para
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: balance >= 0 ? 'var(--success)' : 'var(--error)' }}>
                        ₺{balance.toLocaleString('tr-TR')}
                    </div>
                </div>
            </div>

            {/* BUTONLAR */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => {
                        setFormType('income');
                        setShowForm(true);
                    }}
                    className="btn btn-primary"
                >
                    GELİR EKLE
                </button>
                <button
                    onClick={() => {
                        setFormType('expense');
                        setShowForm(true);
                    }}
                    className="btn btn-secondary"
                >
                    GİDER EKLE
                </button>
            </div>

            {/* İŞLEMLER TABLOSU */}
            <div className="table-container">
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                        TÜM İŞLEMLER
                    </h2>
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as '1' | '3' | '6' | '12')}
                        className="form-select"
                        style={{ width: '120px', padding: '0.5rem' }}
                    >
                        <option value="1">Bu Ay</option>
                        <option value="3">3 Ay</option>
                        <option value="6">6 Ay</option>
                        <option value="12">12 Ay</option>
                    </select>
                </div>
                <table className="table">
                    <thead>
                        <tr>
                            <th>TİP</th>
                            <th>KİŞİ</th>
                            <th>ÖDEME YÖNTEMİ</th>
                            <th
                                onClick={() => handleSort('amount')}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                            >
                                TUTAR {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                                onClick={() => handleSort('date')}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                            >
                                TARİH {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>AÇIKLAMA</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map((transaction) => (
                            <tr key={transaction.id}>
                                <td>
                                    <span
                                        style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            backgroundColor: transaction.type === 'income' ? 'var(--success-bg)' : 'var(--error-bg)',
                                            color: transaction.type === 'income' ? 'var(--success)' : 'var(--error)',
                                        }}
                                    >
                                        {transaction.type === 'income' ? 'Gelir' : 'Gider'}
                                    </span>
                                </td>
                                <td>{transaction.person}</td>
                                <td>{transaction.payment_method === 'cash' ? 'Nakit' : 'İban'}</td>
                                <td style={{ color: transaction.type === 'income' ? 'var(--success)' : 'var(--error)' }}>
                                    {transaction.type === 'income' ? '+' : '-'}₺{transaction.amount.toLocaleString('tr-TR')}
                                </td>
                                <td>{formatDate(transaction.transaction_date)}</td>
                                <td>{transaction.description || '-'}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        onClick={() => handleDeleteTransaction(transaction.id)}
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

            {/* FORM MODAL */}
            {showForm && (
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
                    onClick={() => setShowForm(false)}
                >
                    <div
                        className="card"
                        style={{ width: '500px', maxWidth: '90%' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="card-header">
                            {formType === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}
                        </h2>
                        <form onSubmit={handleAddTransaction}>
                            <div className="form-group">
                                <label className="form-label">Kişi</label>
                                <input
                                    type="text"
                                    name="person"
                                    className="form-input"
                                    placeholder="Örn: Ahmet"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ödeme Yöntemi</label>
                                <select name="paymentMethod" className="form-select" required>
                                    <option value="cash">Nakit</option>
                                    <option value="iban">İban</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tutar</label>
                                <input
                                    type="number"
                                    name="amount"
                                    className="form-input"
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tarih</label>
                                <input
                                    type="date"
                                    name="transactionDate"
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Açıklama (opsiyonel)</label>
                                <input
                                    type="text"
                                    name="description"
                                    className="form-input"
                                    placeholder="Örn: Nakit gelir"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="btn btn-primary">
                                    Ekle
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
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

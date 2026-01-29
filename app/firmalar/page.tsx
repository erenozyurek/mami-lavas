'use client';

import { useState, useEffect } from 'react';
import { supabase, Company } from '@/lib/supabase';

export default function FirmalarPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<'income' | 'expense'>('income');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .order('name');

            if (error) throw error;
            setCompanies(data || []);
        } catch (error) {
            console.error('Firmalar yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const incomeCompanies = companies.filter((c) => c.type === 'income');
    const expenseCompanies = companies.filter((c) => c.type === 'expense');

    const handleAddCompany = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const newCompany = {
            name: formData.get('name') as string,
            type: formType,
            contact_person: formData.get('contactPerson') as string || null,
            phone: formData.get('phone') as string || null,
            address: formData.get('address') as string || null,
        };

        try {
            const { error } = await supabase
                .from('companies')
                .insert(newCompany);

            if (error) throw error;

            fetchCompanies();
            setShowForm(false);
            e.currentTarget.reset();
        } catch (error) {
            console.error('Firma eklenirken hata:', error);
        }
    };

    const handleDeleteCompany = async (id: number) => {
        try {
            const { error } = await supabase
                .from('companies')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchCompanies();
        } catch (error) {
            console.error('Firma silinirken hata:', error);
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
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Firma Yönetimi</h1>
            </div>

            <div className="grid grid-2 gap-4">
                {/* GELİR FİRMALARI (RESTORANLAR) */}
                <div>
                    <div className="table-container">
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                                GELİR FİRMALARI (RESTORANLAR)
                            </h2>
                        </div>
                        <div style={{ maxHeight: '500px', minHeight: '500px', overflowY: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>FİRMA ADI</th>
                                        <th>İLETİŞİM</th>
                                        <th>TELEFON</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incomeCompanies.map((company) => (
                                        <tr key={company.id}>
                                            <td>{company.name}</td>
                                            <td>{company.contact_person || '-'}</td>
                                            <td>{company.phone || '-'}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    onClick={() => handleDeleteCompany(company.id)}
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
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                            <button
                                onClick={() => {
                                    setFormType('income');
                                    setShowForm(true);
                                }}
                                className="btn btn-secondary"
                                style={{ width: '100%' }}
                            >
                                GELİR FİRMASI EKLE
                            </button>
                        </div>
                    </div>
                </div>

                {/* GİDER FİRMALARI (TEDARİKÇİLER) */}
                <div>
                    <div className="table-container">
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                                GİDER FİRMALARI (TEDARİKÇİLER)
                            </h2>
                        </div>
                        <div style={{ maxHeight: '500px', minHeight: '500px', overflowY: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>FİRMA ADI</th>
                                        <th>İLETİŞİM</th>
                                        <th>TELEFON</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenseCompanies.map((company) => (
                                        <tr key={company.id}>
                                            <td>{company.name}</td>
                                            <td>{company.contact_person || '-'}</td>
                                            <td>{company.phone || '-'}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    onClick={() => handleDeleteCompany(company.id)}
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
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                            <button
                                onClick={() => {
                                    setFormType('expense');
                                    setShowForm(true);
                                }}
                                className="btn btn-secondary"
                                style={{ width: '100%' }}
                            >
                                GİDER FİRMASI EKLE
                            </button>
                        </div>
                    </div>
                </div>
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
                            {formType === 'income' ? 'Gelir Firması Ekle' : 'Gider Firması Ekle'}
                        </h2>
                        <form onSubmit={handleAddCompany}>
                            <div className="form-group">
                                <label className="form-label">Firma Adı</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">İletişim Kişisi</label>
                                <input
                                    type="text"
                                    name="contactPerson"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Telefon</label>
                                <input
                                    type="text"
                                    name="phone"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Adres</label>
                                <input
                                    type="text"
                                    name="address"
                                    className="form-input"
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

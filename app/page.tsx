'use client';

import { useState, useEffect } from 'react';
import { supabase, Invoice, Company } from '@/lib/supabase';
import { calculateProfit, formatDate } from '@/lib/calculations';

// UI için genişletilmiş Invoice tipi
interface InvoiceWithCompany extends Invoice {
  companyName: string;
}

export default function HomePage() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [invoices, setInvoices] = useState<InvoiceWithCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [invoiceType, setInvoiceType] = useState<'income' | 'expense'>('income');
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithCompany | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verileri yükle
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Faturaları çek (company bilgisi ile birlikte)
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          company:companies(*)
        `)
        .eq('month', currentMonth)
        .eq('year', currentYear)
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

  // Gelir ve Gider faturalarını ayır
  const expenseInvoices = invoices.filter((inv) => inv.type === 'expense');
  const incomeInvoices = invoices.filter((inv) => inv.type === 'income');

  // Kar/Zarar hesapla
  const profitCalc = calculateProfit(invoices.map(inv => ({ type: inv.type, amount: inv.amount })), 5, 10);

  // Firma listeleri
  const expenseCompanies = companies.filter((c) => c.type === 'expense');
  const incomeCompanies = companies.filter((c) => c.type === 'income');

  const handleAddInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget; // Store reference before async
    const formData = new FormData(form);
    const companyId = parseInt(formData.get('companyId') as string);

    const newInvoice = {
      company_id: companyId,
      type: invoiceType,
      amount: parseFloat(formData.get('amount') as string),
      invoice_date: formData.get('invoiceDate') as string,
      payment_status: formData.get('paymentStatus') as 'pending' | 'paid',
      description: formData.get('description') as string || null,
      month: currentMonth,
      year: currentYear,
    };

    try {
      const { error } = await supabase
        .from('invoices')
        .insert(newInvoice);

      if (error) throw error;

      // Veriyi yeniden yükle
      fetchData();
      form.reset();
    } catch (error) {
      console.error('Fatura eklenirken hata:', error);
    }
  };

  const handleDoubleClick = (invoice: InvoiceWithCompany) => {
    setEditingInvoice(invoice);
    setShowEditModal(true);
  };

  const handleUpdateInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const formData = new FormData(e.currentTarget);
    const companyId = parseInt(formData.get('companyId') as string);

    const updatedData = {
      company_id: companyId,
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

      // Veriyi yeniden yükle
      fetchData();
      setShowEditModal(false);
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

  const handleSaveMonth = async () => {
    try {
      const { error } = await supabase
        .from('monthly_closures')
        .upsert({
          month: currentMonth,
          year: currentYear,
          total_income: profitCalc.totalIncome,
          total_expense: profitCalc.totalExpense,
          profit_loss: profitCalc.totalIncome - profitCalc.totalExpense,
          target_income: profitCalc.targetIncome,
          difference: profitCalc.difference,
        }, { onConflict: 'month,year' });

      if (error) throw error;
    } catch (error) {
      console.error('Ay kaydedilirken hata:', error);
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
      <div className="mb-2">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Fatura Takip</h1>
      </div>

      <div className="grid grid-2 gap-4">
        {/* GİDER FATURALAR */}
        <div>
          <div className="table-container">
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                GİDER FATURALAR
              </h2>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>FİRMA ADI</th>
                    <th>TUTAR</th>
                    <th>TARİH</th>
                    <th style={{ textAlign: 'center' }}>ÖDEME DURUMU</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseInvoices.map((invoice) => (
                    <tr key={invoice.id} onDoubleClick={() => handleDoubleClick(invoice)} style={{ cursor: 'pointer' }}>
                      <td>{invoice.companyName}</td>
                      <td>{invoice.amount.toLocaleString('tr-TR')}</td>
                      <td>{formatDate(invoice.invoice_date)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={invoice.payment_status === 'paid' ? 'status-paid' : 'status-pending'}>
                          {invoice.payment_status === 'paid' ? '✓' : '✗'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Boş satırlar */}
                  {Array.from({ length: Math.max(0, 8 - expenseInvoices.length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* GELİR FATURALAR */}
        <div>
          <div className="table-container">
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                GELİR FATURALAR
              </h2>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>FİRMA ADI</th>
                    <th>TUTAR</th>
                    <th>TARİH</th>
                    <th style={{ textAlign: 'center' }}>ÖDEME DURUMU</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeInvoices.map((invoice) => (
                    <tr key={invoice.id} onDoubleClick={() => handleDoubleClick(invoice)} style={{ cursor: 'pointer' }}>
                      <td>{invoice.companyName}</td>
                      <td>{invoice.amount.toLocaleString('tr-TR')}</td>
                      <td>{formatDate(invoice.invoice_date)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={invoice.payment_status === 'paid' ? 'status-paid' : 'status-pending'}>
                          {invoice.payment_status === 'paid' ? '✓' : '✗'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Boş satırlar */}
                  {Array.from({ length: Math.max(0, 8 - incomeInvoices.length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* FATURA EKLEME VE ÖZET */}
      <div style={{ marginTop: '1rem' }}>
        <div className="grid grid-2 gap-4">
          {/* FATURA EKLEME FORMU */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-header" style={{ marginBottom: '0.75rem' }}>Fatura Ekle</h3>
            <form onSubmit={handleAddInvoice}>
              {/* Gelir/Gider ve Firma - Yan Yana */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', alignItems: 'flex-end' }}>
                {/* Gelir/Gider Radio Buttons */}
                <div style={{ flex: '0 0 auto' }}>
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>Fatura Tipi</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="invoiceType"
                        value="income"
                        checked={invoiceType === 'income'}
                        onChange={(e) => setInvoiceType(e.target.value as 'income' | 'expense')}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ color: 'var(--success)', fontSize: '0.875rem' }}>Gelir</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="invoiceType"
                        value="expense"
                        checked={invoiceType === 'expense'}
                        onChange={(e) => setInvoiceType(e.target.value as 'income' | 'expense')}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ color: 'var(--error)', fontSize: '0.875rem' }}>Gider</span>
                    </label>
                  </div>
                </div>

                {/* Firma Seçimi */}
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>Firma</label>
                  <select name="companyId" className="form-select" required>
                    <option value="">Firma Seçin</option>
                    {(invoiceType === 'income' ? incomeCompanies : expenseCompanies).map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tutar, Tarih, Ödeme Durumu - Yan Yana */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                {/* Tutar */}
                <div>
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>Tutar</label>
                  <input
                    type="number"
                    name="amount"
                    className="form-input"
                    placeholder="0"
                    required
                  />
                </div>

                {/* Tarih */}
                <div>
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>Tarih</label>
                  <input
                    type="date"
                    name="invoiceDate"
                    className="form-input"
                    required
                  />
                </div>

                {/* Ödeme Durumu */}
                <div>
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>Ödeme Durumu</label>
                  <select name="paymentStatus" className="form-select" required>
                    <option value="pending">Ödenmedi</option>
                    <option value="paid">Ödendi</option>
                  </select>
                </div>
              </div>

              {/* Açıklama - Tek Satır */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Açıklama</label>
                <input
                  type="text"
                  name="description"
                  className="form-input"
                  placeholder="Açıklama (opsiyonel)"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.25rem' }}>
                Fatura Ekle
              </button>
            </form>
          </div>

          {/* KAR/ZARAR ÖZET */}
          <div>
            <div className={`alert ${profitCalc.status === 'excess' || profitCalc.status === 'deficit' ? 'alert-warning' : 'alert-success'}`}>
              <div style={{ whiteSpace: 'pre-line', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {profitCalc.message}
              </div>
              <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                <button onClick={handleSaveMonth} className="btn btn-primary btn-sm">Bu Ayı Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DÜZENLEME MODALI */}
      {showEditModal && editingInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowEditModal(false)}>
          <div className="card" style={{
            width: '500px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 className="card-header" style={{ marginBottom: '0.75rem' }}>Fatura Düzenle</h3>
            <form onSubmit={handleUpdateInvoice}>
              {/* Firma Seçimi */}
              <div className="form-group">
                <label className="form-label">Firma</label>
                <select name="companyId" className="form-select" defaultValue={editingInvoice.company_id || ''} required>
                  {(editingInvoice.type === 'income' ? incomeCompanies : expenseCompanies).map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tutar */}
              <div className="form-group">
                <label className="form-label">Tutar</label>
                <input
                  type="number"
                  name="amount"
                  className="form-input"
                  defaultValue={editingInvoice.amount}
                  required
                />
              </div>

              {/* Tarih */}
              <div className="form-group">
                <label className="form-label">Tarih</label>
                <input
                  type="date"
                  name="invoiceDate"
                  className="form-input"
                  defaultValue={editingInvoice.invoice_date}
                  required
                />
              </div>

              {/* Ödeme Durumu */}
              <div className="form-group">
                <label className="form-label">Ödeme Durumu</label>
                <select name="paymentStatus" className="form-select" defaultValue={editingInvoice.payment_status} required>
                  <option value="pending">Ödenmedi</option>
                  <option value="paid">Ödendi</option>
                </select>
              </div>

              {/* Açıklama */}
              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <input
                  type="text"
                  name="description"
                  className="form-input"
                  defaultValue={editingInvoice.description || ''}
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Güncelle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteInvoice(editingInvoice.id);
                    setShowEditModal(false);
                  }}
                  className="btn"
                  style={{ flex: 1, backgroundColor: 'var(--error-bg)', color: 'var(--error)' }}
                >
                  Sil
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
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

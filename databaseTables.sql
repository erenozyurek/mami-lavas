-- =================================================================
-- Lavaş Fırını Fatura Takip Sistemi - PostgreSQL Database Schema
-- =================================================================
-- Bu dosyayı direkt PostgreSQL'de çalıştırabilirsiniz
-- Kullanım: psql -U kullanici_adi -d veritabani_adi -f databaseTables.sql

-- =================================================================
-- 1. TABLOLAR (TABLES)
-- =================================================================

-- 1.1 Firmalar (Companies) - Gelir ve Gider firmaları
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    -- 'income' = Gelir firması (Restoranlar), 'expense' = Gider firması (Tedarikçiler)
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE companies IS 'Gelir ve Gider firmaları (Restoranlar ve Tedarikçiler)';
COMMENT ON COLUMN companies.type IS 'income = Gelir firması, expense = Gider firması';

-- 1.2 Faturalar (Invoices) - Gelir ve Gider faturaları
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    -- 'income' = Gelir faturası, 'expense' = Gider faturası
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    invoice_date DATE NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'paid')),
    -- 'pending' = Ödenmedi (✗), 'paid' = Ödendi (✓)
    description TEXT,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE invoices IS 'Gelir ve Gider faturaları';
COMMENT ON COLUMN invoices.type IS 'income = Gelir, expense = Gider';
COMMENT ON COLUMN invoices.payment_status IS 'pending = Ödenmedi, paid = Ödendi';

-- 1.3 İşlemler (Transactions) - Gelir/Gider para hareketleri
-- DÜZELTİLDİ: month ve year alanları eklendi
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    -- 'income' = Para girişi, 'expense' = Para çıkışı
    person VARCHAR(255) NOT NULL,
    -- İşlemi yapan kişi
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'iban')),
    -- 'cash' = Nakit, 'iban' = Banka (İban)
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    transaction_date DATE NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE transactions IS 'Gelir ve Gider para hareketleri';
COMMENT ON COLUMN transactions.person IS 'İşlemi yapan kişinin adı';
COMMENT ON COLUMN transactions.payment_method IS 'cash = Nakit, iban = Banka havalesi';

-- 1.4 Aylık Kapanışlar (Monthly Closures)
CREATE TABLE monthly_closures (
    id SERIAL PRIMARY KEY,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    total_income DECIMAL(12, 2) NOT NULL,
    total_expense DECIMAL(12, 2) NOT NULL,
    profit_loss DECIMAL(12, 2) NOT NULL,
    -- Kar/Zarar = Gelir - Gider
    target_income DECIMAL(12, 2),
    -- Hedef gelir (%5 kar ile)
    difference DECIMAL(12, 2),
    -- Fark (Gerçekleşen - Hedef)
    notes TEXT,
    closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month, year)
);

COMMENT ON TABLE monthly_closures IS 'Aylık kapanış kayıtları';
COMMENT ON COLUMN monthly_closures.profit_loss IS 'Kar/Zarar = total_income - total_expense';
COMMENT ON COLUMN monthly_closures.target_income IS 'Hedef gelir (%5 kar marjı ile)';

-- 1.5 Kullanıcılar (Users) - Authentication için
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

COMMENT ON TABLE users IS 'Sistem kullanıcıları';
COMMENT ON COLUMN users.password_hash IS 'SHA-256 hash olarak saklanır';

-- =================================================================
-- 2. İNDEKSLER (INDEXES) - Performans için
-- =================================================================

CREATE INDEX idx_invoices_type ON invoices(type);
CREATE INDEX idx_invoices_month_year ON invoices(month, year);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_companies_type ON companies(type);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_month_year ON transactions(month, year);
CREATE INDEX idx_monthly_closures_period ON monthly_closures(year DESC, month DESC);

-- =================================================================
-- 3. TRİGGERLAR (TRIGGERS)
-- =================================================================

-- 3.1 updated_at otomatik güncellemesi için fonksiyon
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.2 DÜZELTİLDİ: Invoice-Company type uyum kontrolü
-- Fatura tipi ile firma tipi uyuşmalı (gelir firmasına gelir faturası, gider firmasına gider faturası)
CREATE OR REPLACE FUNCTION check_invoice_company_type_match()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.company_id IS NOT NULL THEN
        IF (SELECT type FROM companies WHERE id = NEW.company_id) != NEW.type THEN
            RAISE EXCEPTION 'Fatura tipi firma tipiyle uyuşmuyor! Gelir firmasına gelir faturası, gider firmasına gider faturası kesilmelidir.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_invoice_company_type_match
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION check_invoice_company_type_match();

-- =================================================================
-- 4. ÖRNEK VERİLER (SAMPLE DATA)
-- =================================================================

-- 4.1 Gelir Firmaları (Restoranlar)
INSERT INTO companies (name, type, contact_person, phone, address) VALUES
('Kebapçı Mehmet', 'income', 'Mehmet Yılmaz', '0532 123 4567', null),
('Dürüm Evi', 'income', 'Ayşe Demir', '0533 234 5678', null),
('Lahmacun Express', 'income', 'Ali Kaya', '0534 345 6789', null),
('Pide Sarayı', 'income', 'Fatma Öztürk', '0535 456 7890', null);

-- 4.2 Gider Firmaları (Tedarikçiler)
INSERT INTO companies (name, type, contact_person, phone, address) VALUES
('Atlas Değirmencilik', 'expense', 'Hasan Çelik', '0536 567 8901', null),
('Ekmek Malzemeleri A.Ş.', 'expense', 'Zeynep Arslan', '0537 678 9012', null),
('Elektrik Şirketi', 'expense', null, '0538 789 0123', null);

-- 4.3 Gider Faturaları (Ocak 2026)
INSERT INTO invoices (company_id, type, amount, invoice_date, payment_status, description, month, year) VALUES
(5, 'expense', 84400.00, '2026-01-25', 'pending', 'Un', 1, 2026),
(6, 'expense', 15000.00, '2026-01-24', 'pending', 'Malzeme', 1, 2026);

-- 4.4 Gelir Faturaları (Ocak 2026)
INSERT INTO invoices (company_id, type, amount, invoice_date, payment_status, description, month, year) VALUES
(1, 'income', 16300.00, '2026-01-18', 'paid', 'Lavaş satışı', 1, 2026),
(2, 'income', 103300.00, '2026-01-19', 'paid', 'Lavaş satışı', 1, 2026);

-- 4.5 Gelir/Gider İşlemleri - DÜZELTİLDİ: month ve year eklendi
INSERT INTO transactions (type, person, payment_method, amount, transaction_date, month, year, description) VALUES
('income', 'Ahmet', 'cash', 50000.00, '2026-01-15', 1, 2026, 'Nakit gelir'),
('income', 'Mehmet', 'iban', 100000.00, '2026-01-20', 1, 2026, 'Banka havalesi'),
('expense', 'Ayşe', 'cash', 30000.00, '2026-01-18', 1, 2026, 'Nakit gider'),
('expense', 'Fatma', 'iban', 20000.00, '2026-01-22', 1, 2026, 'Banka havalesi gider');

-- 4.6 Kullanıcı - DÜZELTİLDİ: Gerçek SHA-256 hash kullanıldı (şifre: haslavaşmami)
INSERT INTO users (username, password_hash, full_name) VALUES
('admin', 'bf6ed18293f36b9ea0bc4354f70a405dbe6d7a77faedc37b8ef84ae7a5581fa6', 'Yönetici');

-- =================================================================
-- 5. YARDIMCI GÖRÜNÜMLER (VIEWS)
-- =================================================================

-- 5.1 Aylık fatura özeti görünümü
CREATE VIEW monthly_invoice_summary AS
SELECT 
    i.year,
    i.month,
    SUM(CASE WHEN i.type = 'income' THEN i.amount ELSE 0 END) as total_income,
    SUM(CASE WHEN i.type = 'expense' THEN i.amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN i.type = 'income' THEN i.amount ELSE 0 END) - 
    SUM(CASE WHEN i.type = 'expense' THEN i.amount ELSE 0 END) as profit_loss,
    COUNT(CASE WHEN i.type = 'income' THEN 1 END) as income_count,
    COUNT(CASE WHEN i.type = 'expense' THEN 1 END) as expense_count
FROM invoices i
GROUP BY i.year, i.month
ORDER BY i.year DESC, i.month DESC;

COMMENT ON VIEW monthly_invoice_summary IS 'Aylık fatura gelir-gider özeti';

-- 5.2 DÜZELTİLDİ: Aylık işlem özeti görünümü (transactions dahil)
CREATE VIEW monthly_transaction_summary AS
SELECT 
    t.year,
    t.month,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) - 
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as balance,
    COUNT(CASE WHEN t.type = 'income' THEN 1 END) as income_count,
    COUNT(CASE WHEN t.type = 'expense' THEN 1 END) as expense_count
FROM transactions t
GROUP BY t.year, t.month
ORDER BY t.year DESC, t.month DESC;

COMMENT ON VIEW monthly_transaction_summary IS 'Aylık işlem (nakit/banka) gelir-gider özeti';

-- 5.3 Birleşik aylık özet (faturalar + işlemler)
CREATE VIEW monthly_combined_summary AS
SELECT 
    year,
    month,
    SUM(invoice_income) as invoice_income,
    SUM(invoice_expense) as invoice_expense,
    SUM(transaction_income) as transaction_income,
    SUM(transaction_expense) as transaction_expense,
    SUM(invoice_income) - SUM(invoice_expense) as invoice_profit,
    SUM(transaction_income) - SUM(transaction_expense) as transaction_balance
FROM (
    SELECT 
        year, month,
        CASE WHEN type = 'income' THEN amount ELSE 0 END as invoice_income,
        CASE WHEN type = 'expense' THEN amount ELSE 0 END as invoice_expense,
        0::decimal as transaction_income,
        0::decimal as transaction_expense
    FROM invoices
    UNION ALL
    SELECT 
        year, month,
        0::decimal as invoice_income,
        0::decimal as invoice_expense,
        CASE WHEN type = 'income' THEN amount ELSE 0 END as transaction_income,
        CASE WHEN type = 'expense' THEN amount ELSE 0 END as transaction_expense
    FROM transactions
) combined
GROUP BY year, month
ORDER BY year DESC, month DESC;

COMMENT ON VIEW monthly_combined_summary IS 'Birleşik aylık özet (faturalar ve işlemler)';

-- =================================================================
-- BAŞARILI! Tüm tablolar, indexler ve örnek veriler oluşturuldu
-- =================================================================

-- Kontrol komutları:
-- \dt                              -- Tabloları listele
-- \dv                              -- View'ları listele
-- \di                              -- Index'leri listele
-- SELECT * FROM companies;
-- SELECT * FROM invoices;
-- SELECT * FROM transactions;
-- SELECT * FROM monthly_invoice_summary;
-- SELECT * FROM monthly_transaction_summary;
-- SELECT * FROM monthly_combined_summary;

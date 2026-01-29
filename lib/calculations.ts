// Calculation utilities for invoice tracking

export interface ProfitCalculation {
    totalExpense: number;
    totalIncome: number;
    targetIncome: number;
    profitMargin: number;
    difference: number;
    status: 'excess' | 'deficit' | 'target';
    message: string;
}

/**
 * Toplam gider hesapla
 */
export function calculateTotalExpense(invoices: { type: string; amount: number }[]): number {
    return invoices
        .filter(inv => inv.type === 'expense')
        .reduce((sum, inv) => sum + inv.amount, 0);
}

/**
 * Toplam gelir hesapla
 */
export function calculateTotalIncome(invoices: { type: string; amount: number }[]): number {
    return invoices
        .filter(inv => inv.type === 'income')
        .reduce((sum, inv) => sum + inv.amount, 0);
}

/**
 * Kar hedefi hesapla (%5 kar marjı ile)
 */
export function calculateTargetIncome(totalExpense: number, profitMarginPercent: number = 5): number {
    return totalExpense * (1 + profitMarginPercent / 100);
}

/**
 * Kar/Zarar analizi yap
 * %5-%10 kar marjı hedef aralık olarak kabul edilir
 */
export function calculateProfit(
    invoices: { type: string; amount: number }[],
    minProfitMargin: number = 5,
    maxProfitMargin: number = 10
): ProfitCalculation {
    const totalExpense = calculateTotalExpense(invoices);
    const totalIncome = calculateTotalIncome(invoices);

    // Hedef aralık hesapla
    const minTargetIncome = totalExpense * (1 + minProfitMargin / 100); // %5 kar
    const maxTargetIncome = totalExpense * (1 + maxProfitMargin / 100); // %10 kar

    // Mevcut kar marjı hesapla
    const actualProfitMargin = totalExpense > 0
        ? ((totalIncome - totalExpense) / totalExpense) * 100
        : 0;

    const targetIncome = minTargetIncome; // Display için minimum hedef
    const difference = totalIncome - minTargetIncome;

    let status: 'excess' | 'deficit' | 'target' = 'target';
    let message = '';

    if (totalIncome >= minTargetIncome && totalIncome <= maxTargetIncome) {
        // %5-%10 aralığında - DENGEDE
        status = 'target';
        message = `✅ Gelir/Gider faturalarınız dengede!

Bu Ay ${totalExpense.toLocaleString('tr-TR')} TL Gider Faturanız var
${totalIncome.toLocaleString('tr-TR')} TL Gelir Faturanız Kesilmiştir

Kar Marjınız: %${actualProfitMargin.toFixed(1)} (Hedef: %${minProfitMargin}-%${maxProfitMargin})`;
    } else if (totalIncome > maxTargetIncome) {
        // %10'dan fazla kar - FAZLA
        status = 'excess';
        const excessAmount = totalIncome - maxTargetIncome;
        message = `⚠️ Bu Ay ${totalExpense.toLocaleString('tr-TR')} TL Gider Faturanız var
${totalIncome.toLocaleString('tr-TR')} TL Gelir Faturanız Kesilmiştir

Kar Marjınız: %${actualProfitMargin.toFixed(1)} (Hedef: %${minProfitMargin}-%${maxProfitMargin})

${excessAmount.toLocaleString('tr-TR')} TL Fazla Fatura Kesmişsiniz`;
    } else {
        // %5'ten az kar - EKSİK
        status = 'deficit';
        const deficitAmount = minTargetIncome - totalIncome;
        message = `⚠️ Bu Ay ${totalExpense.toLocaleString('tr-TR')} TL Gider Faturanız var
${totalIncome.toLocaleString('tr-TR')} TL Gelir Faturanız Kesilmiştir

%${minProfitMargin}-%${maxProfitMargin} Kar için ${minTargetIncome.toLocaleString('tr-TR')} - ${maxTargetIncome.toLocaleString('tr-TR')} TL arası Gelir Faturası Kesmelisiniz

${deficitAmount.toLocaleString('tr-TR')} TL Eksik Fatura Kesmişsiniz`;
    }

    return {
        totalExpense,
        totalIncome,
        targetIncome,
        profitMargin: actualProfitMargin,
        difference,
        status,
        message,
    };
}

/**
 * Formatla para birimi
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Formatla tarih
 */
export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type BrandColor = 'orange' | 'purple';

interface BrandContextType {
    brand: BrandColor;
    setBrand: (brand: BrandColor) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
    const [brand, setBrandState] = useState<BrandColor>('orange');

    useEffect(() => {
        // Load from localStorage
        const stored = localStorage.getItem('brand-color') as BrandColor;
        if (stored) {
            setBrandState(stored);
            document.documentElement.setAttribute('data-brand', stored);
        }
    }, []);

    const setBrand = (newBrand: BrandColor) => {
        setBrandState(newBrand);
        localStorage.setItem('brand-color', newBrand);
        document.documentElement.setAttribute('data-brand', newBrand);
    };

    return (
        <BrandContext.Provider value={{ brand, setBrand }}>
            {children}
        </BrandContext.Provider>
    );
}

export function useBrand() {
    const context = useContext(BrandContext);
    if (!context) {
        throw new Error('useBrand must be used within BrandProvider');
    }
    return context;
}

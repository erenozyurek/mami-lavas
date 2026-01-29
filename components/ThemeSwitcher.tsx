'use client';

import { useTheme } from 'next-themes';
import { useBrand } from './BrandProvider';
import { useEffect, useState } from 'react';

export default function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const { brand, setBrand } = useBrand();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const toggleMode = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div
            style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
            }}
        >
            <div style={{ marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tema
            </div>

            {/* Mode Switcher (Light/Dark) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                    onClick={toggleMode}
                    style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: 'var(--surface-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--surface-light)';
                        e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                >
                    {theme === 'dark' ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                            <span>Koyu</span>
                        </>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                            <span>Açık</span>
                        </>
                    )}
                </button>
            </div>

            {/* Brand Color Switcher */}
            <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Renk
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {/* Orange */}
                <button
                    onClick={() => setBrand('orange')}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#ff6b35',
                        border: brand === 'orange' ? '3px solid var(--text-primary)' : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        outline: brand === 'orange' ? '2px solid var(--surface-elevated)' : 'none',
                        outlineOffset: '2px',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Turuncu"
                />

                {/* Purple */}
                <button
                    onClick={() => setBrand('purple')}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#a855f7',
                        border: brand === 'purple' ? '3px solid var(--text-primary)' : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        outline: brand === 'purple' ? '2px solid var(--surface-elevated)' : 'none',
                        outlineOffset: '2px',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Mor"
                />
            </div>
        </div>
    );
}

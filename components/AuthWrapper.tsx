'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkAuth } from '@/lib/auth';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Login sayfasındaysak kontrol yapma
        if (pathname === '/login') {
            setIsChecking(false);
            return;
        }

        // Auth kontrolü
        const isAuthenticated = checkAuth();

        if (!isAuthenticated) {
            router.push('/login');
        } else {
            setIsChecking(false);
        }
    }, [pathname, router]);

    // Login sayfasındaysak direkt göster
    if (pathname === '/login') {
        return <>{children}</>;
    }

    // Auth kontrolü yapılıyorsa boş sayfa göster
    if (isChecking) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: 'var(--bg)'
            }}>
                <div style={{ color: 'var(--text-secondary)' }}>Yükleniyor...</div>
            </div>
        );
    }

    return <>{children}</>;
}

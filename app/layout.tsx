'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from 'next-themes';
import { BrandProvider } from '@/components/BrandProvider';
import AuthWrapper from '@/components/AuthWrapper';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Ana Sayfa' },
    { href: '/firmalar', label: 'Firmalar' },
    { href: '/gelir-gider', label: 'Gelir/Gider' },
    { href: '/gecmis', label: 'Geçmiş Aylar' },
  ];

  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <BrandProvider>
            <AuthWrapper>
              {pathname !== '/login' && (
                <div className="app-container">
                  <aside className="sidebar">
                    <nav>
                      <ul className="nav-menu">
                        {navItems.map((item) => (
                          <li key={item.href} className="nav-item">
                            <Link
                              href={item.href}
                              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </nav>
                    {/* Theme Switcher at the bottom of sidebar */}
                    <ThemeSwitcher />
                  </aside>
                  <main className="main-content">{children}</main>
                </div>
              )}
              {pathname === '/login' && children}
            </AuthWrapper>
          </BrandProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

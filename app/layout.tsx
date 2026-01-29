'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { href: '/', label: 'Ana Sayfa' },
    { href: '/firmalar', label: 'Firmalar' },
    { href: '/gelir-gider', label: 'Gelir/Gider' },
    { href: '/gecmis', label: 'Geçmiş Aylar' },
  ];

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <BrandProvider>
            <AuthWrapper>
              {pathname !== '/login' && (
                <div className="app-container">
                  {/* Mobile Menu Toggle */}
                  <button
                    className="mobile-menu-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? 'Menüyü Kapat' : 'Menüyü Aç'}
                    aria-expanded={mobileMenuOpen}
                  >
                    {mobileMenuOpen ? '✕' : '☰'}
                  </button>

                  {/* Sidebar Overlay */}
                  <div
                    className={`sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  />

                  {/* Sidebar */}
                  <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
                    <nav>
                      <ul className="nav-menu">
                        {navItems.map((item) => (
                          <li key={item.href} className="nav-item">
                            <Link
                              href={item.href}
                              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                              onClick={() => setMobileMenuOpen(false)}
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isValid = await login(password);

        if (isValid) {
            router.push('/');
        } else {
            setError('Hatalı şifre!');
            setPassword('');
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg)',
            }}
        >
            <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
                <h2 className="card-header" style={{ textAlign: 'center' }}>
                    Fatura Takip Sistemi
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            className="form-input"
                            placeholder="Şifrenizi girin"
                            autoFocus
                            required
                        />
                        {error && (
                            <div
                                style={{
                                    color: 'var(--error)',
                                    fontSize: '0.875rem',
                                    marginTop: '0.5rem',
                                }}
                            >
                                {error}
                            </div>
                        )}
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Giriş Yap
                    </button>
                </form>
            </div>
        </div>
    );
}

// Auth helper functions with SHA-256 hashing
// Uses Supabase users table for authentication

import { supabase } from './supabase';

// Hardcoded password hash (veritabanına kaydedilmez)
const HARDCODED_PASSWORD_HASH = 'c4187b2fdbee7a542e8f4344d72926263929b77a275bae6f5bcfbbb5f0585b88';

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export const login = async (password: string): Promise<boolean> => {
    const hashedPassword = await hashPassword(password);

    // Önce hardcoded şifreyi kontrol et (DB'ye gitmeden)
    if (hashedPassword === HARDCODED_PASSWORD_HASH) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('isAuthenticated', 'true');
        }
        return true;
    }

    try {
        // Supabase'den admin kullanıcısını kontrol et
        const { data, error } = await supabase
            .from('users')
            .select('id, password_hash')
            .eq('username', 'admin')
            .single();

        if (error || !data) {
            console.error('Kullanıcı bulunamadı:', error);
            return false;
        }

        if (hashedPassword === data.password_hash) {
            if (typeof window !== 'undefined') {
                localStorage.setItem('isAuthenticated', 'true');

                // Update last_login
                await supabase
                    .from('users')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', data.id);
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Login hatası:', error);
        return false;
    }
};

export const logout = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('isAuthenticated');
    }
};

export const checkAuth = (): boolean => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('isAuthenticated') === 'true';
    }
    return false;
};

// Yeni kullanıcı şifresi oluşturma yardımcı fonksiyonu (admin için)
export const generatePasswordHash = async (password: string): Promise<string> => {
    return await hashPassword(password);
};

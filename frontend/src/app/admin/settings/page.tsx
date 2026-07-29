// frontend/src/app/admin/settings/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { LogOut, ArrowLeft, Settings, ShieldAlert } from 'lucide-react';

export default function AdminSettingsPage() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error("Secure logout network fault:", error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            document.cookie = "client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            window.location.href = '/';
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#111', color: '#fff', padding: '4rem 2rem', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                
                <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                    <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={20} /> System Settings
                    </h1>
                </header>

                <div style={{ backgroundColor: '#161616', border: '1px solid #333', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldAlert size={18} color="#dc2626" /> Danger Zone
                    </h2>
                    <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Securely terminate your admin session. You will need to re-authenticate to access the dashboard.
                    </p>
                    
                    <button 
                        onClick={handleLogout} 
                        style={{ width: '100%', padding: '1rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    >
                        <LogOut size={18} /> Secure Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
// frontend/src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient'; // THE FIX: Secure authentication check
import styles from './dashboard.module.css';
import { LayoutDashboard, BookOpen, Settings, LogOut, Shield, Loader2 } from 'lucide-react';

export default function DashboardPage() {
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // THE FIX: Eradicated iSevens_Token fallback. Let the backend verify the secure cookie.
        const verifySession = async () => {
            try {
                const res = await apiClient.get('/auth/me');
                setUserName(res.data.user.firstName || 'User');
            } catch (err) {
                window.location.href = '/login';
            } finally {
                setIsLoading(false);
            }
        };
        verifySession();
    }, []);

    const handleSecureExit = async () => {
        try {
            // Tell the backend to destroy the HttpOnly cookie
            await apiClient.post('/auth/logout');
        } finally {
            // Clean up the frontend clearance and redirect
            localStorage.removeItem('role');
            window.location.href = '/login';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="animate-spin text-neutral-600 w-10 h-10" />
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            {/* Mission Control Sidebar */}
            <nav className={styles.sidebar}>
                <div className="flex items-center mb-8">
                    <Shield className="text-premiumRed mr-3" size={32} />
                    <h2 className="text-2xl font-bold tracking-widest text-softWhite">iSEVENS</h2>
                </div>
                
                <div className={`${styles.navItem} ${styles.navItemActive}`}>
                    <LayoutDashboard className="mr-4" size={20} /> Headquarters
                </div>
                <div className={styles.navItem} onClick={() => window.location.href = '/library'} style={{ cursor: 'pointer' }}>
                    <BookOpen className="mr-4" size={20} /> Digital Library
                </div>
                <div className={styles.navItem}>
                    <Settings className="mr-4" size={20} /> Preferences
                </div>
                
                <div className="mt-auto" onClick={handleSecureExit} style={{ cursor: 'pointer' }}>
                    <div className={`${styles.navItem} text-red-600 hover:text-red-500`}>
                        <LogOut className="mr-4" size={20} /> Secure Exit
                    </div>
                </div>
            </nav>

            {/* Main Information Panel */}
            <main className={styles.mainPanel}>
                <header className={styles.elevatedCard}>
                    <h1 className="text-4xl font-light text-softWhite">
                        Welcome back, <span className="font-bold">{userName}</span>.
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg tracking-wide">
                        Your premium ecosystem is fully optimized and ready.
                    </p>
                </header>

                <div className={styles.statGrid}>
                    <div className={styles.elevatedCard}>
                        <span className="text-gray-500 uppercase tracking-widest text-xs font-bold">Active Courses</span>
                        <div className={styles.statValue}>03</div>
                    </div>
                    <div className={styles.elevatedCard}>
                        <span className="text-gray-500 uppercase tracking-widest text-xs font-bold">Digital Assets</span>
                        <div className={styles.statValue}>12</div>
                    </div>
                    <div className={styles.elevatedCard}>
                        <span className="text-gray-500 uppercase tracking-widest text-xs font-bold">Security Status</span>
                        <div className={`${styles.statValue} text-green-700`}>LOCKED</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
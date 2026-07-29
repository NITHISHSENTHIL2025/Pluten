// frontend/src/app/profile/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { User, Mail, LogOut, ArrowLeft, Loader2, ShieldCheck, Crown } from 'lucide-react';
import styles from './profile.module.css';

interface UserProfile {
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
    isPremium: boolean;
    createdAt: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiClient.get('/user/profile');
                setProfile(response.data);
            } catch (error) {
                console.error("Failed to load secure profile", error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                document.cookie = "client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

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

    if (loading) {
        return <div className={styles.loader}><Loader2 className="animate-spin text-neutral-500 w-8 h-8" /></div>;
    }

    if (!profile) return null;

    const displayName = profile.firstName 
        ? `${profile.firstName} ${profile.lastName || ''}`.trim() 
        : 'User';

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                
                <header className={styles.header}>
                    <button onClick={() => router.push('/')} className={styles.backBtn}>
                        <ArrowLeft size={16} /> Back to Storefront
                    </button>
                    <div className={styles.version}>
                        iSevens App v1.0.0-PROD
                    </div>
                </header>

                <div className={styles.identityCard} style={{ marginBottom: '2rem' }}>
                    <div className={styles.avatar}>
                        <User size={40} />
                    </div>
                    
                    <div className={styles.userInfo}>
                        <h1>Hi, {displayName}</h1>
                        <div className={styles.userEmail}>
                            <Mail size={16} />
                            <span>{profile.email}</span>
                        </div>
                        
                        <div className={styles.badge}>
                            {profile.role === 'SUPER_ADMIN' ? (
                                <><ShieldCheck size={16} className={styles.badgeSuper} /><span className={styles.badgeSuper}>Super Admin Clearance</span></>
                            ) : profile.isPremium ? (
                                <><Crown size={16} className={styles.badgePremium} /><span className={styles.badgePremium}>Premium Member</span></>
                            ) : (
                                <><User size={16} className={styles.badgeStandard} /><span className={styles.badgeStandard}>Standard Account</span></>
                            )}
                        </div>
                    </div>
                </div>

                <button onClick={handleLogout} className={styles.logoutBtn}>
                    <LogOut size={18} /> Secure Logout
                </button>

            </div>
        </div>
    );
}
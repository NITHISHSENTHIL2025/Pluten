// frontend/src/app/profile/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// THE FIX: Import the centralized enterprise API client
import apiClient from '@/lib/apiClient';
import { 
    User, Mail, Heart, Bookmark, LifeBuoy, Bug, 
    LogOut, ArrowLeft, Loader2, ShieldCheck, Crown, ChevronRight 
} from 'lucide-react';
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
                // THE FIX: The apiClient automatically attaches the secure HttpOnly cookie
                const response = await apiClient.get('/user/profile');
                setProfile(response.data);
            } catch (error) {
                console.error("Failed to load secure profile", error);
                // If the backend rejects us (e.g., cookie expired), clear frontend state and route to login
                localStorage.removeItem('role');
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    // THE FIX: The Secure Backend Logout Sequence (Step 3)
    const handleLogout = async () => {
        try {
            // 1. Tell the backend to cryptographically destroy the HttpOnly cookie
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error("Secure logout network fault:", error);
        } finally {
            // 2. Erase the frontend clearance level regardless of network success
            localStorage.removeItem('role');
            // 3. Force a hard reload to clear React state and the Next.js cache
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
                
                {/* --- Header --- */}
                <header className={styles.header}>
                    <button onClick={() => router.push('/')} className={styles.backBtn}>
                        <ArrowLeft size={16} /> Back to Storefront
                    </button>
                    <div className={styles.version}>
                        iSevens App v1.0.0-PROD
                    </div>
                </header>

                {/* --- Identity Card --- */}
                <div className={styles.identityCard}>
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

                {/* --- Action Menu --- */}
                <div className={styles.menuCard}>
                    <button className={styles.menuItem}>
                        <div className={styles.menuItemLeft}>
                            <div className={styles.iconWrapper} style={{ color: '#f472b6' }}><Heart size={18} /></div>
                            <div>
                                <div className={styles.menuTitle}>My Favorites</div>
                                <div className={styles.menuDesc}>View assets you've liked</div>
                            </div>
                        </div>
                        <ChevronRight size={18} color="#555" />
                    </button>

                    <button className={styles.menuItem}>
                        <div className={styles.menuItemLeft}>
                            <div className={styles.iconWrapper} style={{ color: '#60a5fa' }}><Bookmark size={18} /></div>
                            <div>
                                <div className={styles.menuTitle}>Saved for Later</div>
                                <div className={styles.menuDesc}>Assets bookmarked for future purchase</div>
                            </div>
                        </div>
                        <ChevronRight size={18} color="#555" />
                    </button>

                    <button className={styles.menuItem}>
                        <div className={styles.menuItemLeft}>
                            <div className={styles.iconWrapper} style={{ color: '#4ade80' }}><LifeBuoy size={18} /></div>
                            <div>
                                <div className={styles.menuTitle}>Help & Support</div>
                                <div className={styles.menuDesc}>Contact the iSevens team</div>
                            </div>
                        </div>
                        <ChevronRight size={18} color="#555" />
                    </button>

                    <button className={styles.menuItem}>
                        <div className={styles.menuItemLeft}>
                            <div className={styles.iconWrapper} style={{ color: '#fb923c' }}><Bug size={18} /></div>
                            <div>
                                <div className={styles.menuTitle}>Report a Bug</div>
                                <div className={styles.menuDesc}>Help us improve the ecosystem</div>
                            </div>
                        </div>
                        <ChevronRight size={18} color="#555" />
                    </button>
                </div>

                {/* --- Danger Zone --- */}
                <button onClick={handleLogout} className={styles.logoutBtn}>
                    <LogOut size={18} /> Secure Logout
                </button>

            </div>
        </div>
    );
}
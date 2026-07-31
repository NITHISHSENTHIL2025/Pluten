"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import styles from './login.module.css'; 
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function LoginEngine() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');
    const isExpired = searchParams.get('expired');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            setLoading(true);
            const response = await apiClient.post('/auth/google-login', {
                token: credentialResponse.credential
            });
            
            const userRole = response.data.user?.role || 'CUSTOMER';
            const secureToken = response.data.token;
            
            localStorage.setItem('token', secureToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('role', userRole);
            
            // Backup stamp for instant middleware read
            document.cookie = `client_auth=true; path=/; max-age=86400; samesite=lax`;
            document.cookie = `user_role=${userRole}; path=/; max-age=86400; samesite=lax`;
            
            // Native React routing preserves state and stops screen flashing
            if (userRole === 'SUPER_ADMIN' || userRole === 'PRODUCT_MANAGER' || userRole === 'FINANCE_MANAGER') {
                router.push('/admin/products');
            } else if (redirectUrl && redirectUrl !== '/dashboard') {
                router.push(redirectUrl);
            } else {
                router.push('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Google SSO failed.');
            setLoading(false);
        }
    };

    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
            <div className={styles.premiumContainer}>
                <div className={styles.skeuomorphicCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 2rem' }}>
                    
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <ShieldCheck size={24} color="#fff" />
                    </div>

                    <h1 className={styles.title} style={{ marginBottom: '0.5rem' }}>ACCESS SECURELY</h1>
                    <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '2.5rem', textAlign: 'center' }}>
                        Authenticate with Google to access your Digital Library and complete purchases.
                    </p>

                    {isExpired === 'true' && <p className="text-yellow-500 text-sm mb-4 text-center bg-yellow-950/30 p-2 rounded border border-yellow-900 w-full">Secure session expired. Please authenticate again.</p>}
                    {error && <p className="text-red-500 text-sm mb-6 text-center bg-red-950/30 p-3 rounded border border-red-900 w-full">{error}</p>}

                    {loading ? (
                        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
                            <Loader2 className="animate-spin text-neutral-400" />
                        </div>
                    ) : (
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <GoogleLogin 
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Google Authentication Failed')}
                                theme="filled_black"
                                shape="rectangular"
                                width={280} 
                            />
                        </div>
                    )}
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-neutral-600" /></div>}>
            <LoginEngine />
        </Suspense>
    );
}
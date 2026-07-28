// frontend/src/app/login/page.tsx
"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import styles from './login.module.css'; 
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function LoginEngine() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiClient.post('/auth/login', { email, password });
            const userRole = response.data.user?.role || 'CUSTOMER';

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                document.cookie = "client_auth=true; path=/; max-age=86400; SameSite=Lax";
            }

            // THE SECURE ROUTING FIX: Prevent Open Redirect Attacks
            const isSafeRedirect = redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//');

            if (isSafeRedirect && redirectUrl !== '/dashboard') {
                window.location.href = redirectUrl;
            } else if (userRole === 'SUPER_ADMIN' || userRole === 'PRODUCT_MANAGER' || userRole === 'FINANCE_MANAGER') {
                window.location.href = '/admin/products';
            } else {
                window.location.href = '/';
            }

        } catch (err: any) {
            if (err.response?.data?.requiresVerification) {
                window.location.href = `/verify?email=${encodeURIComponent(err.response.data.email)}`;
                return; 
            }

            if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
                const messages = err.response.data.details.map((e: any) => e.message).join(" | ");
                setError(messages);
            } else {
                setError(err.response?.data?.error || 'Authentication failed. Verify your credentials.');
            }
            setLoading(false);
        } 
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            setLoading(true);
            const response = await apiClient.post('/auth/google-login', {
                token: credentialResponse.credential
            });
            
            const userRole = response.data.user?.role || 'CUSTOMER';
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                document.cookie = "client_auth=true; path=/; max-age=86400; SameSite=Lax";
            }
            
            // THE SECURE ROUTING FIX
            const isSafeRedirect = redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//');

            if (isSafeRedirect && redirectUrl !== '/dashboard') {
                window.location.href = redirectUrl;
            } else if (userRole === 'SUPER_ADMIN' || userRole === 'PRODUCT_MANAGER' || userRole === 'FINANCE_MANAGER') {
                window.location.href = '/admin/products';
            } else {
                window.location.href = '/';
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Google SSO failed.');
            setLoading(false);
        }
    };

    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
            <div className={styles.premiumContainer}>
                <form onSubmit={handleLogin} className={styles.skeuomorphicCard}>
                    
                    <h1 className={styles.title}>ACCESS SECURELY</h1>

                    {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-950/30 p-2 rounded border border-red-900 w-full">{error}</p>}

                    <input 
                        type="email" 
                        required
                        placeholder="Email Address" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.skeuomorphicInput}
                    />
                    
                    <input 
                        type="password" 
                        required
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.skeuomorphicInput}
                    />

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={styles.skeuomorphicButton}
                    >
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'AUTHORIZE'}
                    </button>

                    <div style={{ textAlign: 'center', margin: '24px 0', fontSize: '11px', letterSpacing: '0.2em', color: '#555', width: '100%' }}>
                        OR CONTINUE WITH
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', width: '100%' }}>
                        <GoogleLogin 
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Authentication Failed')}
                            theme="filled_black"
                            shape="rectangular"
                            width={280} 
                        />
                    </div>

                    <Link href="/register" className={styles.linkText}>
                        New to iSevens? Request Access.
                    </Link>

                </form>
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
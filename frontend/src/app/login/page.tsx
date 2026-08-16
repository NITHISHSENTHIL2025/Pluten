"use client";

import { Suspense, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import styles from './login.module.css';

function LoginEngine() {
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');
    const expired = searchParams.get('expired');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const waitForSession = async () => {
        for (let attempt = 0; attempt < 4; attempt += 1) {
            try {
                const response = await apiClient.get('/auth/me');
                if (response.data?.user) return response.data.user;
            } catch (_) {
                await new Promise((resolve) => setTimeout(resolve, 300 + attempt * 250));
            }
        }
        throw new Error('Secure session could not be confirmed.');
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            setLoading(true);
            setError('');

            if (!credentialResponse?.credential) throw new Error('Google did not return a credential.');
            await apiClient.post('/auth/google-login', { token: credentialResponse.credential });
            const user = await waitForSession();

            const safeRedirect = redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//') ? redirectUrl : null;
            const isAdmin = ['SUPER_ADMIN','PRODUCT_MANAGER','FINANCE_MANAGER','CUSTOMER_SUPPORT'].includes(user.role);
            const destination = isAdmin ? '/admin' : safeRedirect || '/';
            window.location.replace(destination);
        } catch (err: any) {
            console.error('Google login failed:', err);
            setError(err?.response?.data?.error || err?.message || 'Google authentication failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
            <main className={styles.premiumContainer}>
                <div className={styles.backgroundGrid}/><div className={styles.backgroundGlow}/>
                <section className={styles.skeuomorphicCard}>
                    <div className={styles.brand}><img src="/favicon.ico" alt="Pluten" className={styles.brandLogo}/><span className={styles.brandName}>PLUTEN</span></div>
                    <div className={styles.securityIcon}><ShieldCheck size={21}/></div>
                    <h1 className={styles.title}>Welcome back.</h1>
                    <p className={styles.description}>{expired ? 'Your previous session expired. Sign in again to continue.' : 'One secure sign-in to your products, library and account.'}</p>
                    {error && <div className={styles.statusMessage}>{error}</div>}
                    <div className={styles.googleWrap} aria-busy={loading}>
                        {loading ? <Loader2 className="pluten-login-spinner" size={28}/> : <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google authentication failed. Please try again.')} useOneTap={false}/>} 
                    </div>
                    <p className={styles.footerNote}>Secure account access · Pluten</p>
                </section>
            </main>
        </GoogleOAuthProvider>
    );
}

export default function LoginPage() { return <Suspense fallback={<main className="pluten-auth-fallback"><Loader2 className="pluten-login-spinner" size={32}/></main>}><LoginEngine/></Suspense>; }

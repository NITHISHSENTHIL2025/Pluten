// frontend/src/app/register/page.tsx
"use client";

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import styles from './register.module.css'; 
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function RegisterEngine() {
    const router = useRouter();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await apiClient.post('/auth/register', {
                firstName,
                lastName,
                email,
                password
            });
            
            // Route directly to the OTP verification screen
            window.location.href = `/verify?email=${encodeURIComponent(email)}`;
            
        } catch (err: any) {
            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                const messages = err.response.data.errors.map((e: any) => e.message || e).join(" | ");
                setError(messages);
            } else {
                setError(err.response?.data?.error || 'Registration failed. Please verify your details.');
            }
        } finally {
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
            localStorage.setItem('role', userRole);
            
            if (userRole === 'SUPER_ADMIN' || userRole === 'PRODUCT_MANAGER' || userRole === 'FINANCE_MANAGER') {
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
                <form onSubmit={handleRegister} className={styles.skeuomorphicCard}>
                    
                    <h1 className={styles.title}>JOIN ISEVENS</h1>

                    {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-950/30 p-2 rounded border border-red-900 w-full">{error}</p>}

                    <div className="flex gap-4 w-full">
                        <input 
                            type="text" 
                            required
                            placeholder="First Name" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className={styles.skeuomorphicInput}
                        />

                        <input 
                            type="text" 
                            placeholder="Last Name" 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className={styles.skeuomorphicInput}
                        />
                    </div>

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
                        placeholder="Create Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.skeuomorphicInput}
                    />

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={styles.skeuomorphicButton}
                    >
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'INITIALIZE ACCOUNT'}
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
    width={280} /* CHANGED from 320 to 280 so it perfectly fits mobile screens */
/>
                    </div>

                    <Link href="/login" className={styles.linkText}>
                        Already have an account? Authenticate here.
                    </Link>

                </form>
            </div>
        </GoogleOAuthProvider>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-neutral-600" /></div>}>
            <RegisterEngine />
        </Suspense>
    );
}
// frontend/src/app/verify/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';

function VerifyEngine() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    // THE FIX: Added a visual cooldown state to prevent OTP spamming
    const [cooldown, setCooldown] = useState(0);

    // THE FIX: Timer logic that ticks down every second
    useEffect(() => {
        if (cooldown <= 0) return;
        
        const timer = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);
        
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit code.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            await apiClient.post('/auth/verify-email', { email, otp });
            setSuccessMsg('Account authorized successfully! Redirecting to login...');
            
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Verification failed. Check your code and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return; // Double protection against clicks

        setResending(true);
        setError('');
        setSuccessMsg('');

        try {
            await apiClient.post('/auth/resend-otp', { email });
            setSuccessMsg('A new 6-digit code has been sent to your email.');
            setCooldown(60); // THE FIX: Lock the button for 60 seconds after a successful request
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to resend code.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', textAlign: 'center' }}>
                
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                    <ShieldCheck size={28} color="#dc2626" />
                </div>

                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    AUTHORIZE IDENTITY
                </h1>

                <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '28px', lineHeight: '1.5' }}>
                    We dispatched a 6-digit authorization code to <br />
                    <span style={{ color: '#fff', fontWeight: '600' }}>{email || 'your email'}</span>
                </p>

                {error && (
                    <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', backgroundColor: 'rgba(153, 27, 27, 0.2)', border: '1px solid rgba(153, 27, 27, 0.5)', color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {successMsg && (
                    <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', fontSize: '0.85rem' }}>
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleVerify}>
                    <input 
                        type="text" 
                        maxLength={6}
                        required
                        placeholder="000000" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', borderRadius: '10px', padding: '16px', color: '#fff', fontSize: '1.75rem', fontWeight: 'bold', letterSpacing: '12px', textAlign: 'center', outline: 'none', marginBottom: '20px', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    />

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ width: '100%', backgroundColor: '#dc2626', color: '#fff', fontWeight: '700', padding: '14px', borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', letterSpacing: '0.05em', marginBottom: '20px', transition: 'background-color 0.2s' }}
                    >
                        {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'VERIFY CODE'}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid #222', paddingTop: '20px' }}>
                    <button 
                        onClick={handleResend}
                        disabled={resending || cooldown > 0} // THE FIX: Button locks visually during cooldown
                        style={{ background: 'none', border: 'none', color: (resending || cooldown > 0) ? '#555' : '#888', cursor: (resending || cooldown > 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}
                    >
                        <RefreshCw size={14} className={resending ? "animate-spin" : ""} /> 
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                    </button>

                    <Link href="/login" style={{ color: '#888', textDecoration: 'none' }}>
                        Back to Login
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin text-neutral-600" /></div>}>
            <VerifyEngine />
        </Suspense>
    );
}
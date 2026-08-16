"use client";

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle, Loader2, Package, RefreshCw, ShieldCheck } from 'lucide-react';
import apiClient from '@/lib/apiClient';

function PaymentSuccessContent() {
    const router = useRouter();
    const params = useSearchParams();
    const orderId = params.get('order_id');
    const [status, setStatus] = useState<'VERIFYING'|'SUCCESS'|'PENDING'|'ERROR'>('VERIFYING');
    const [message, setMessage] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [retrying, setRetrying] = useState(false);

    const verify = useCallback(async () => {
        if (!orderId) { setStatus('ERROR'); setMessage('This payment link is missing its order reference.'); return false; }
        try {
            await apiClient.post('/payments/verify', { orderId });
            setStatus('SUCCESS');
            setMessage('');
            return true;
        } catch (error: any) {
            const statusCode = error?.response?.status;
            const apiError = error?.response?.data?.error;
            if (statusCode === 409) {
                setStatus('PENDING');
                setMessage('Your payment is still being confirmed. We will keep checking automatically.');
                return false;
            }
            if (statusCode === 401 || statusCode === 403) {
                router.replace(`/login?redirect=${encodeURIComponent(`/payment-success?order_id=${orderId}`)}`);
                return false;
            }
            setStatus('ERROR');
            setMessage(apiError || 'We could not verify this transaction right now.');
            return false;
        }
    }, [orderId, router]);

    useEffect(() => {
        let active = true;
        const run = async () => {
            const ok = await verify();
            if (active && !ok) setAttempt((n) => n + 1);
        };
        run();
        return () => { active = false; };
    }, [verify]);

    useEffect(() => {
        if (status !== 'PENDING' || attempt >= 5) return;
        const timer = setTimeout(verify, 2500);
        return () => clearTimeout(timer);
    }, [attempt, status, verify]);

    const retry = async () => {
        setRetrying(true); setAttempt(0); setStatus('VERIFYING');
        await verify();
        setRetrying(false);
    };

    return (
        <main className="ps-page">
            <section className="ps-card">
                <div className="ps-kicker">PLUTEN / PAYMENT</div>

                {status === 'VERIFYING' && <div className="ps-state"><Loader2 className="ps-icon ps-spin" size={46}/><h1>Securing your purchase</h1><p>Verifying the transaction with Cashfree before unlocking your library.</p></div>}
                {status === 'PENDING' && <div className="ps-state"><div className="ps-round ps-amber"><ShieldCheck size={32}/></div><h1>Payment confirmation pending</h1><p>{message}</p>{attempt < 5 ? <span className="ps-note">Checking again automatically…</span> : <button className="ps-button ps-light" onClick={retry} disabled={retrying}>{retrying ? <Loader2 className="ps-spin" size={17}/> : <RefreshCw size={17}/>} Check again</button>}</div>}
                {status === 'ERROR' && <div className="ps-state"><div className="ps-round ps-red"><AlertCircle size={32}/></div><h1>Verification needs attention</h1><p>{message}</p><button className="ps-button ps-light" onClick={retry} disabled={retrying}>{retrying ? <Loader2 className="ps-spin" size={17}/> : <RefreshCw size={17}/>} Retry verification</button></div>}
                {status === 'SUCCESS' && <div className="ps-success"><div className="ps-round ps-green"><CheckCircle size={38}/></div><h1>Payment successful</h1><p>Your purchase is verified and ready in your Pluten library.</p><div className="ps-reference"><span>Order reference</span><strong>{orderId}</strong></div><div className="ps-actions"><button className="ps-button ps-primary" onClick={() => router.push('/library')}><Package size={18}/> Access digital library</button><button className="ps-button ps-outline" onClick={() => router.push('/')}><ArrowRight size={17}/> Return to storefront</button></div></div>}
            </section>
        </main>
    );
}

export default function PaymentSuccessPage() {
    return <Suspense fallback={<main className="ps-page"><Loader2 className="ps-spin" size={36}/></main>}><PaymentSuccessContent/></Suspense>;
}

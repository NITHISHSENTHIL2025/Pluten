// frontend/src/app/payment-success/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Package, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id') || 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    const [initializing, setInitializing] = useState(true);

    // Simulate a brief "Securing your asset" sequence for premium feel
    useEffect(() => {
        const timer = setTimeout(() => {
            setInitializing(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#0a0a0a', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px', 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundImage: 'radial-gradient(circle at top, #1a2f1c 0%, #0a0a0a 60%)'
        }}>
            <div style={{ 
                backgroundColor: '#111', 
                border: '1px solid #1a3a1f', 
                borderRadius: '16px', 
                padding: '40px', 
                width: '100%', 
                maxWidth: '500px', 
                boxShadow: '0 30px 60px -12px rgba(0,0,0,1), inset 0 1px 0 rgba(255,255,255,0.05)', 
                textAlign: 'center' 
            }}>
                
                {initializing ? (
                    <div style={{ padding: '40px 0' }}>
                        <Loader2 className="animate-spin" size={48} color="#22c55e" style={{ margin: '0 auto 24px auto' }} />
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.1em' }}>SECURING ASSET...</h2>
                        <p style={{ color: '#666', marginTop: '12px' }}>Encrypting and transferring to your Digital Vault.</p>
                    </div>
                ) : (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            borderRadius: '50%', 
                            backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                            border: '1px solid rgba(34, 197, 94, 0.3)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            margin: '0 auto 24px auto',
                            boxShadow: '0 0 30px rgba(34, 197, 94, 0.2)'
                        }}>
                            <CheckCircle size={40} color="#22c55e" />
                        </div>

                        <h1 style={{ 
                            fontSize: '1.75rem', 
                            fontWeight: '900', 
                            color: '#fff', 
                            letterSpacing: '0.05em', 
                            textTransform: 'uppercase',
                            marginBottom: '8px' 
                        }}>
                            Payment Successful
                        </h1>

                        <p style={{ color: '#a3a3a3', fontSize: '0.95rem', marginBottom: '32px', lineHeight: '1.6' }}>
                            Your transaction was approved and the asset has been successfully provisioned to your account.
                        </p>

                        <div style={{ 
                            backgroundColor: '#050505', 
                            border: '1px solid #222', 
                            borderRadius: '8px', 
                            padding: '16px', 
                            marginBottom: '32px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Transaction ID</div>
                                <div style={{ fontFamily: 'monospace', color: '#fff', fontWeight: 'bold', letterSpacing: '1px' }}>{orderId}</div>
                            </div>
                            <ShieldCheck size={24} color="#22c55e" opacity={0.5} />
                        </div>

                        <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                            <button 
                                onClick={() => router.push('/library')}
                                style={{ 
                                    width: '100%', 
                                    backgroundColor: '#22c55e', 
                                    color: '#000', 
                                    fontWeight: '800', 
                                    padding: '16px', 
                                    borderRadius: '8px', 
                                    border: 'none', 
                                    cursor: 'pointer', 
                                    fontSize: '1rem', 
                                    letterSpacing: '0.05em', 
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
                                    textTransform: 'uppercase'
                                }}
                            >
                                <Package size={20} /> Access Digital Library
                            </button>

                            <Link href="/" style={{ textDecoration: 'none' }}>
                                <button style={{ 
                                    width: '100%', 
                                    backgroundColor: 'transparent', 
                                    color: '#888', 
                                    fontWeight: '600', 
                                    padding: '14px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #333', 
                                    cursor: 'pointer', 
                                    fontSize: '0.9rem', 
                                    letterSpacing: '0.05em', 
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s',
                                    textTransform: 'uppercase'
                                }}>
                                    Return to Storefront <ArrowRight size={16} />
                                </button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
            
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
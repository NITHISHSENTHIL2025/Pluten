// frontend/src/app/error.tsx
"use client"; // Error boundaries must be Client Components

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // In a production environment, you would log this to Sentry or Datadog
        console.error("iSevens Global Telemetry Caught Error:", error);
    }, [error]);

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#0a0a0a', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px', 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundImage: 'radial-gradient(circle at center, #1a0505 0%, #0a0a0a 100%)'
        }}>
            <div style={{ 
                backgroundColor: '#111', 
                border: '1px solid #330000', 
                borderRadius: '16px', 
                padding: '40px', 
                width: '100%', 
                maxWidth: '480px', 
                boxShadow: '0 30px 60px -12px rgba(0,0,0,1), inset 0 1px 0 rgba(255,255,255,0.05)', 
                textAlign: 'center' 
            }}>
                
                <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(220, 38, 38, 0.1)', 
                    border: '1px solid rgba(220, 38, 38, 0.3)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 24px auto',
                    boxShadow: '0 0 20px rgba(220, 38, 38, 0.2)'
                }}>
                    <AlertTriangle size={32} color="#dc2626" />
                </div>

                <h1 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '900', 
                    color: '#fff', 
                    letterSpacing: '0.1em', 
                    textTransform: 'uppercase',
                    marginBottom: '12px' 
                }}>
                    System Disruption
                </h1>

                <p style={{ 
                    color: '#888', 
                    fontSize: '0.95rem', 
                    marginBottom: '32px', 
                    lineHeight: '1.6' 
                }}>
                    The ecosystem encountered an unexpected fault while processing your request. Our telemetry has logged the anomaly.
                </p>

                <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                    <button 
                        onClick={() => reset()}
                        style={{ 
                            width: '100%', 
                            backgroundColor: '#dc2626', 
                            color: '#fff', 
                            fontWeight: '700', 
                            padding: '14px', 
                            borderRadius: '8px', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontSize: '0.95rem', 
                            letterSpacing: '0.05em', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                        }}
                    >
                        <RefreshCw size={18} /> REINITIALIZE SEQUENCE
                    </button>

                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <button style={{ 
                            width: '100%', 
                            backgroundColor: 'transparent', 
                            color: '#a3a3a3', 
                            fontWeight: '600', 
                            padding: '14px', 
                            borderRadius: '8px', 
                            border: '1px solid #333', 
                            cursor: 'pointer', 
                            fontSize: '0.95rem', 
                            letterSpacing: '0.05em', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}>
                            <Home size={18} /> RETURN TO BASE
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
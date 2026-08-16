"use client";

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const router = useRouter();
    useEffect(() => { console.error('Pluten UI error boundary:', error); }, [error]);
    return (
        <main className="pluten-error-page">
            <section className="pluten-error-card">
                <div className="pluten-error-icon"><AlertTriangle size={28}/></div>
                <div className="pluten-error-kicker">PLUTEN / SYSTEM</div>
                <h1>Something went wrong.</h1>
                <p>Pluten hit an unexpected error. Your account and purchases remain protected.</p>
                <div className="pluten-error-actions">
                    <button onClick={reset} className="pluten-error-primary"><RefreshCw size={17}/> Try again</button>
                    <button onClick={() => router.push('/')} className="pluten-error-secondary"><Home size={17}/> Return home</button>
                </div>
            </section>
        </main>
    );
}

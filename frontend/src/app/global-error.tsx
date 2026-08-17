"use client";

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[PLUTEN] Global UI error', error); }, [error]);
  return <html lang="en"><body><main className="pluten-error-page"><section className="pluten-error-card"><div className="pluten-error-kicker">PLUTEN / SYSTEM</div><h1>Something went wrong.</h1><p>Your session and purchases are protected. Try the page again.</p><div className="pluten-error-actions"><button className="pluten-error-primary" onClick={() => reset()}>Try again</button><a className="pluten-error-secondary" href="/">Return home</a></div></section></main></body></html>;
}

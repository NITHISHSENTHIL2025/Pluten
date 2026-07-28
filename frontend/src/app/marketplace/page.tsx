// frontend/src/app/marketplace/page.tsx
import { redirect } from 'next/navigation';

export default function MarketplacePage() {
    // THE FIX (Audit Items #4 & #9): 
    // This legacy route is deprecated. We immediately redirect all 
    // incoming traffic to the new, highly-optimized storefront at the root.
    redirect('/');
}
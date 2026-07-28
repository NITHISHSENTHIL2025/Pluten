// frontend/src/hooks/useActiveOffer.ts
import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient'; // THE FIX: Import the enterprise client

export const useActiveOffer = () => {
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOffer = async () => {
            try {
                // THE FIX: Use apiClient for versioned, cross-environment routing
                const res = await apiClient.get('/offers/active');
                
                // Axios automatically parses JSON into res.data
                const autoOffer = res.data.find((o: any) => o.autoApply);
                setOffer(autoOffer || null);
                
            } catch (error) {
                console.error("Failed to fetch active offer", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOffer();
    }, []);

    return { offer, loading };
};
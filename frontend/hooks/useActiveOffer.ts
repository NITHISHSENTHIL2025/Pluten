// frontend/hooks/useActiveOffer.ts
import { useState, useEffect } from 'react';

export const useActiveOffer = () => {
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOffer = async () => {
            try {
                // Fetches the public active offers route we made earlier
                const res = await fetch("http://localhost:5000/api/offers/active");
                if (res.ok) {
                    const data = await res.json();
                    // Just grab the first auto-apply offer for V1 simplicity
                    const autoOffer = data.find((o: any) => o.autoApply);
                    setOffer(autoOffer || null);
                }
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
// frontend/src/context/OfferContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';

interface Offer {
    id: string;
    name: string;
    type: string;
    value: number;
    applyTo: string;
    autoApply: boolean;
}

interface OfferContextType {
    activeOffers: Offer[];
    loadingOffers: boolean;
}

const OfferContext = createContext<OfferContextType>({ 
    activeOffers: [], 
    loadingOffers: true 
});

export const OfferProvider = ({ children }: { children: React.ReactNode }) => {
    const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(true);

    useEffect(() => {
        const fetchGlobalOffers = async () => {
            try {
                // THE FIX: This happens exactly ONCE, globally.
                const res = await apiClient.get('/offers/active');
                setActiveOffers(res.data);
            } catch (err) {
                console.error("[iSevens Core] Global Offer Sync Failed:", err);
            } finally {
                setLoadingOffers(false);
            }
        };
        fetchGlobalOffers();
    }, []);

    return (
        <OfferContext.Provider value={{ activeOffers, loadingOffers }}>
            {children}
        </OfferContext.Provider>
    );
};

export const useOffers = () => useContext(OfferContext);
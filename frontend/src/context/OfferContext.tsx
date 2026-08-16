"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/apiClient';

export interface OfferProduct {
    id: string;
}

export interface ActiveOffer {
    id: string;
    name: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    applyTo: 'ALL' | 'SELECTED';
    minOrderAmount: number | null;
    couponCode: string | null;
    autoApply: boolean;
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED';
    startAt: string;
    endAt: string;
    products: OfferProduct[];
}

interface OfferContextType {
    activeOffers: ActiveOffer[];
    loadingOffers: boolean;
    getBestOfferForProduct: (productId: string, price: number) => ActiveOffer | null;
}

const OfferContext = createContext<OfferContextType>({
    activeOffers: [],
    loadingOffers: true,
    getBestOfferForProduct: () => null,
});

export const OfferProvider = ({ children }: { children: React.ReactNode }) => {
    const [activeOffers, setActiveOffers] = useState<ActiveOffer[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchOffers = async () => {
            try {
                const response = await apiClient.get('/offers/active');
                const rows = Array.isArray(response.data) ? response.data : [];

                if (mounted) {
                    setActiveOffers(
                        rows.map((offer: any) => ({
                            ...offer,
                            products: Array.isArray(offer.products) ? offer.products : [],
                        }))
                    );
                }
            } catch (error) {
                console.error('Failed to load active offers:', error);
                if (mounted) setActiveOffers([]);
            } finally {
                if (mounted) setLoadingOffers(false);
            }
        };

        fetchOffers();
        return () => {
            mounted = false;
        };
    }, []);

    const getBestOfferForProduct = useMemo(
        () => (productId: string, price: number) => {
            const eligible = activeOffers.filter((offer) => {
                const applies =
                    offer.applyTo === 'ALL' ||
                    (offer.applyTo === 'SELECTED' && offer.products.some((product) => product.id === productId));

                const meetsMinimum =
                    offer.minOrderAmount == null || price >= Number(offer.minOrderAmount);

                return offer.autoApply && applies && meetsMinimum;
            });

            if (!eligible.length) return null;

            return eligible.reduce((best, current) => {
                const bestDiscount = best.type === 'PERCENTAGE'
                    ? price * (Number(best.value) / 100)
                    : Number(best.value);
                const currentDiscount = current.type === 'PERCENTAGE'
                    ? price * (Number(current.value) / 100)
                    : Number(current.value);

                return currentDiscount > bestDiscount ? current : best;
            });
        },
        [activeOffers]
    );

    return (
        <OfferContext.Provider value={{ activeOffers, loadingOffers, getBestOfferForProduct }}>
            {children}
        </OfferContext.Provider>
    );
};

export const useOffers = () => useContext(OfferContext);

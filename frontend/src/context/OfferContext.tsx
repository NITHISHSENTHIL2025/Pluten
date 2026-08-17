"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/apiClient';

export interface OfferProduct { id: string; }
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
        if (!mounted) return;
        const rows = Array.isArray(response.data) ? response.data : [];
        const now = Date.now();
        setActiveOffers(rows.filter((offer: ActiveOffer) => {
          const start = new Date(offer.startAt).getTime();
          const end = new Date(offer.endAt).getTime();
          return offer.status === 'ACTIVE' && start <= now && end >= now;
        }).map((offer: ActiveOffer) => ({
          ...offer,
          products: Array.isArray(offer.products) ? offer.products : [],
        })));
      } catch (error) {
        console.error('Failed to load active offers:', error);
        if (mounted) setActiveOffers([]);
      } finally {
        if (mounted) setLoadingOffers(false);
      }
    };

    fetchOffers();
    return () => { mounted = false; };
  }, []);

  const getBestOfferForProduct = useMemo(() => {
    return (productId: string, price: number) => {
      const eligible = activeOffers.filter((offer) => {
        const applies = offer.applyTo === 'ALL' || (offer.applyTo === 'SELECTED' && offer.products.some((product) => product.id === productId));
        const meetsMinimum = offer.minOrderAmount == null || price >= Number(offer.minOrderAmount);
        return offer.autoApply && applies && meetsMinimum;
      });

      if (!eligible.length) return null;
      return eligible.reduce((best, current) => {
        const bestDiscount = Math.min(price, best.type === 'PERCENTAGE' ? price * (Number(best.value) / 100) : Number(best.value));
        const currentDiscount = Math.min(price, current.type === 'PERCENTAGE' ? price * (Number(current.value) / 100) : Number(current.value));
        return currentDiscount > bestDiscount ? current : best;
      });
    };
  }, [activeOffers]);

  return <OfferContext.Provider value={{ activeOffers, loadingOffers, getBestOfferForProduct }}>{children}</OfferContext.Provider>;
};

export const useOffers = () => useContext(OfferContext);

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import apiClient from "@/lib/apiClient";

export interface OfferProduct {
  id: string;
  title?: string;
}

export interface Offer {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  applyTo: "ALL" | "SELECTED";
  minOrderAmount: number | null;
  couponCode: string | null;
  autoApply: boolean;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED";
  startAt: string;
  endAt: string;
  products?: OfferProduct[];
}

interface OfferContextType {
  activeOffers: Offer[];
  loadingOffers: boolean;
  offerError: string | null;
  refreshOffers: () => Promise<void>;
}

const OfferContext = createContext<OfferContextType>({
  activeOffers: [],
  loadingOffers: true,
  offerError: null,
  refreshOffers: async () => undefined,
});

export const OfferProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [offerError, setOfferError] = useState<string | null>(null);

  const refreshOffers = useCallback(async () => {
    setOfferError(null);

    try {
      const response = await apiClient.get<Offer[]>("/offers/active");

      setActiveOffers(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Pluten offer sync failed:", error);
      setOfferError("Offers are temporarily unavailable.");
    } finally {
      setLoadingOffers(false);
    }
  }, []);

  useEffect(() => {
    refreshOffers();
  }, [refreshOffers]);

  return (
    <OfferContext.Provider
      value={{
        activeOffers,
        loadingOffers,
        offerError,
        refreshOffers,
      }}
    >
      {children}
    </OfferContext.Provider>
  );
};

export const useOffers = () => useContext(OfferContext);

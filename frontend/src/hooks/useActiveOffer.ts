"use client";

import { useMemo } from "react";
import { useOffers } from "@/context/OfferContext";

/**
 * Compatibility hook retained for older screens.
 * New screens should use useOffers() directly so the app performs one
 * global active-offer request instead of fetching the same endpoint again.
 */
export const useActiveOffer = (productId?: string) => {
  const { activeOffers, loadingOffers } = useOffers();

  const offer = useMemo(() => {
    return (
      activeOffers.find((item) => {
        if (!item.autoApply || item.status !== "ACTIVE") return false;
        if (item.applyTo === "ALL") return true;
        if (item.applyTo === "SELECTED" && productId) {
          return item.products?.some((product) => product.id === productId);
        }
        return false;
      }) ?? null
    );
  }, [activeOffers, productId]);

  return {
    offer,
    loading: loadingOffers,
  };
};

export interface PriceResult {
  finalPrice: number;
  discountAmount: number;
}

export interface PriceOffer {
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  status?: string;
}

export const calculateDiscount = (originalPrice: number, offer?: PriceOffer | null): PriceResult => {
  const base = Number(originalPrice);
  if (!Number.isFinite(base) || base < 0) return { finalPrice: 0, discountAmount: 0 };
  if (!offer || (offer.status && offer.status !== 'ACTIVE')) return { finalPrice: Number(base.toFixed(2)), discountAmount: 0 };

  const raw = offer.type === 'PERCENTAGE'
    ? base * (Number(offer.value) / 100)
    : offer.type === 'FIXED'
      ? Number(offer.value)
      : 0;

  const discountAmount = Math.max(0, Math.min(base, Number(raw.toFixed(2))));
  return { finalPrice: Number((base - discountAmount).toFixed(2)), discountAmount };
};

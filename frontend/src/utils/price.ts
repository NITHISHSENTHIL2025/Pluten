export interface PriceResult {
  finalPrice: number;
  discountAmount: number;
}

export const calculateDiscount = (
  originalPrice: number,
  offer: any
): PriceResult => {
  const base =
    Number(originalPrice);

  if (
    !Number.isFinite(base) ||
    base < 0
  ) {
    return {
      finalPrice: 0,
      discountAmount: 0,
    };
  }

  if (
    !offer ||
    offer.status !== "ACTIVE"
  ) {
    return {
      finalPrice: Number(
        base.toFixed(2)
      ),
      discountAmount: 0,
    };
  }

  let discountAmount = 0;

  if (
    offer.type ===
    "PERCENTAGE"
  ) {
    discountAmount =
      base *
      (Number(offer.value) / 100);
  }

  if (
    offer.type === "FIXED"
  ) {
    discountAmount =
      Number(offer.value);
  }

  discountAmount = Math.max(
    0,
    Math.min(
      base,
      Number(
        discountAmount.toFixed(2)
      )
    )
  );

  const finalPrice =
    Number(
      Math.max(
        0,
        base - discountAmount
      ).toFixed(2)
    );

  return {
    finalPrice,
    discountAmount,
  };
};
// frontend/src/utils/price.ts
export const calculateDiscount = (originalPrice: number, offer: any) => {
    if (!offer || offer.status !== 'ACTIVE') {
        return { finalPrice: originalPrice, discountAmount: 0 };
    }

    let discountAmount = 0;

    if (offer.type === 'PERCENTAGE') {
        discountAmount = originalPrice * (offer.value / 100);
    } else if (offer.type === 'FIXED') {
        discountAmount = offer.value;
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    // THE FIX: Use precise 2-decimal formatting instead of Math.round()
    return { 
        finalPrice: Number(finalPrice.toFixed(2)), 
        discountAmount: Number(discountAmount.toFixed(2)) 
    };
};
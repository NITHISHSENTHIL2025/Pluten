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

    return { 
        finalPrice: Math.round(finalPrice), 
        discountAmount: Math.round(discountAmount) 
    };
};
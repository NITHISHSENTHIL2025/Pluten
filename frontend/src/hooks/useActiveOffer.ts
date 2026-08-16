import { useOffers } from '@/context/OfferContext';

export const useActiveOffer = (productId?: string, price?: number) => {
    const { activeOffers, loadingOffers, getBestOfferForProduct } = useOffers();

    return {
        offer: productId && price !== undefined
            ? getBestOfferForProduct(productId, price)
            : activeOffers.find((offer) => offer.autoApply) || null,
        loading: loadingOffers,
    };
};

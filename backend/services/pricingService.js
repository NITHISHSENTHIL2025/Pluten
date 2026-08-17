const prisma = require('../lib/prisma');

const normalizeMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : null;
};

const normalizeCoupon = (value) => String(value || '').trim().toUpperCase();

const getActiveOffers = async (now = new Date()) => prisma.offer.findMany({
  where: {
    status: 'ACTIVE',
    startAt: { lte: now },
    endAt: { gte: now },
  },
  include: { products: { select: { id: true } } },
  orderBy: { createdAt: 'desc' },
});

const offerAppliesToProduct = (offer, product) => {
  if (offer.applyTo === 'ALL') return true;
  return offer.applyTo === 'SELECTED' && offer.products.some((item) => item.id === product.id);
};

const discountFor = (offer, basePrice) => {
  const raw = offer.type === 'PERCENTAGE'
    ? basePrice * (Number(offer.value) / 100)
    : offer.type === 'FIXED'
      ? Number(offer.value)
      : 0;
  return Math.max(0, Math.min(basePrice, Number(raw.toFixed(2))));
};

const selectBestOffer = (product, offers, couponCode = '') => {
  const normalizedCoupon = normalizeCoupon(couponCode);
  const candidates = offers.filter((offer) => {
    if (!offerAppliesToProduct(offer, product)) return false;
    if (offer.minOrderAmount !== null && Number(product.price) < Number(offer.minOrderAmount)) return false;

    if (normalizedCoupon) {
      return normalizeCoupon(offer.couponCode) === normalizedCoupon;
    }

    return Boolean(offer.autoApply);
  });

  if (!candidates.length) return null;
  return candidates.reduce((best, current) => {
    if (!best) return current;
    return discountFor(current, Number(product.price)) > discountFor(best, Number(product.price)) ? current : best;
  }, null);
};

const calculateProductPricing = (product, offers, couponCode = '') => {
  const originalPrice = normalizeMoney(product.price);
  if (originalPrice === null) throw new Error('Product price is invalid.');

  const offer = selectBestOffer(product, offers, couponCode);
  const discountAmount = offer ? discountFor(offer, originalPrice) : 0;
  const finalPrice = normalizeMoney(Math.max(0, originalPrice - discountAmount));

  return {
    originalPrice,
    finalPrice,
    discountAmount,
    discountPercent: originalPrice > 0 ? Number(((discountAmount / originalPrice) * 100).toFixed(2)) : 0,
    discountLabel: offer
      ? offer.type === 'PERCENTAGE'
        ? `${Number(offer.value)}% OFF`
        : `₹${Number(offer.value).toLocaleString('en-IN')} OFF`
      : null,
    offer: offer
      ? { id: offer.id, name: offer.name, type: offer.type, value: Number(offer.value), couponCode: offer.couponCode || null }
      : null,
  };
};

module.exports = {
  getActiveOffers,
  calculateProductPricing,
  normalizeCoupon,
};

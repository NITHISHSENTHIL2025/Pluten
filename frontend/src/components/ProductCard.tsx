"use client";

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useOffers } from '@/context/OfferContext';
import styles from '../app/page.module.css';

interface Product {
    id: string;
    title: string;
    price: number | string;
    thumbnail: string | null;
    category?: string;
    description?: string;
}

export default function ProductCard({ product }: { product: Product }) {
    const { getBestOfferForProduct } = useOffers();
    const price = Number(product.price) || 0;
    const offer = getBestOfferForProduct(product.id, price);

    const discount = offer
        ? offer.type === 'PERCENTAGE'
            ? Math.min(price, price * (Number(offer.value) / 100))
            : Math.min(price, Number(offer.value))
        : 0;

    const finalPrice = Math.max(0, price - discount);
    const hasDiscount = discount > 0;

    return (
        <article className={styles.productCard}>
            <Link href={`/product/${product.id}`} className={styles.productCardLink} aria-label={`View ${product.title}`}>
                <div className={styles.productVisual}>
                    {product.thumbnail ? (
                        <img
                            src={product.thumbnail}
                            alt=""
                            className={styles.cardImage}
                            loading="lazy"
                        />
                    ) : (
                        <div className={styles.cardImageFallback} aria-hidden="true">PLUTEN</div>
                    )}
                    {hasDiscount && (
    <span className={styles.offerBadge}>
        {offer?.type === 'PERCENTAGE'
            ? `${offer.value}% OFF`
            : `₹${Number(offer?.value ?? 0).toLocaleString('en-IN')} OFF`}
    </span>
)}
                </div>

                <div className={styles.productMeta}>
                    <span className={styles.productCategory}>{product.category || 'Digital product'}</span>
                    <h3 className={styles.cardTitle}>{product.title}</h3>

                    <div className={styles.cardBottom}>
                        <div className={styles.priceBlock}>
                            <span className={styles.currentPrice}>₹{finalPrice.toLocaleString('en-IN')}</span>
                            {hasDiscount && <span className={styles.originalPrice}>₹{price.toLocaleString('en-IN')}</span>}
                        </div>
                        <span className={styles.viewLabel}>VIEW <ArrowUpRight size={14} /></span>
                    </div>
                </div>
            </Link>
        </article>
    );
}

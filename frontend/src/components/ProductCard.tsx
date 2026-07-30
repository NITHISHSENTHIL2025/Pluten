// frontend/src/components/ProductCard.tsx
"use client";

import { useMemo } from 'react';
import Image from 'next/image';
import { Star, User, Check } from 'lucide-react';
import { useOffers } from '@/context/OfferContext';
import styles from '../app/page.module.css'; 

interface Product {
    id: string;
    title: string;
    price: number | string;
    thumbnail: string | null;
    category?: string;
}

export default function ProductCard({ product }: { product: Product }) {
    const { activeOffers, loadingOffers } = useOffers();

    const { finalPrice, activeOffer } = useMemo(() => {
        let price = Number(product.price);
        
        const offer = activeOffers.find((o: any) => o.autoApply);

        if (offer) {
            let discountAmount = 0;
            if (offer.type === 'PERCENTAGE') {
                discountAmount = price * (Number(offer.value) / 100);
            } else if (offer.type === 'FIXED') {
                discountAmount = Number(offer.value);
            }
            price = Math.max(0, price - discountAmount);
            return { finalPrice: Math.round(price), activeOffer: offer };
        }
        
        return { finalPrice: price, activeOffer: null };
    }, [product.price, activeOffers]);

    const hasDiscount = activeOffer && finalPrice < Number(product.price);

    return (
        <div className={styles.productCard}>
            
            {hasDiscount && activeOffer && (
                <div className={styles.discountBadge}>
                    {activeOffer.type === 'PERCENTAGE' ? `${activeOffer.value}% OFF` : `₹${activeOffer.value} OFF`}
                </div>
            )}

            {product.thumbnail ? (
                <Image 
                    src={product.thumbnail} 
                    alt={product.title} 
                    width={400}
                    height={400}
                    unoptimized={true} 
                    className={styles.cardImage} 
                />
            ) : (
                <div className={styles.noImage}>
                    NO PREVIEW
                </div>
            )}

            <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{product.title}</h3>
                
                <div className={styles.cardVendor}>
                    <div className={styles.vendorAvatar}>
                        <User size={10} color="#555" />
                    </div>
                    <span>iSevens Core</span><Check size={10} color="#dc2626" />
                </div>
                
                <div className={styles.cardRating}>
                    <Star size={12} fill="#737373" color="#737373" /><span>5.0</span>
                </div>
                
                <div className={styles.cardBottom}>
                    {loadingOffers ? (
                        <div style={{ height: '24px', width: '80px', backgroundColor: '#333', borderRadius: '4px', opacity: 0.5 }}></div>
                    ) : hasDiscount ? (
                        <div className={styles.priceContainer}>
                            <span className={styles.currentPrice}>₹{finalPrice.toLocaleString('en-IN')}</span>
                            <span className={styles.oldPrice}>₹{Number(product.price).toLocaleString('en-IN')}</span>
                        </div>
                    ) : (
                        <div className={styles.priceContainer}>
                            <span className={styles.currentPrice}>₹{Number(product.price).toLocaleString('en-IN')}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
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
        <div className={styles.productCard} style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            {hasDiscount && activeOffer && (
                <div style={{
                    position: 'absolute', top: '10px', right: '10px', backgroundColor: '#dc2626', 
                    color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', 
                    borderRadius: '4px', zIndex: 10
                }}>
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
                    style={{ objectFit: 'cover', width: '100%', aspectRatio: '1 / 1', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
                    className={styles.cardImage} 
                />
            ) : (
                <div className={styles.cardImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#222', aspectRatio: '1 / 1', width: '100%' }}>
                    NO PREVIEW
                </div>
            )}

            <div className={styles.cardContent} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 className={styles.cardTitle}>{product.title}</h3>
                
                <div className={styles.cardVendor}>
                    <div className={styles.vendorAvatar}>
                        <User size={10} style={{ margin: 'auto', marginTop: '3px' }} color="#555" />
                    </div>
                    <span>iSevens Core</span><Check size={10} color="#8b0000" style={{ marginLeft: '-2px' }} />
                </div>
                
                <div className={styles.cardRating}>
                    <Star size={12} fill="#666" color="#666" /><span>5.0</span>
                </div>
                
                <div className={styles.cardBottom} style={{ marginTop: 'auto', paddingTop: '15px' }}>
                    {loadingOffers ? (
                        <div style={{ height: '24px', width: '80px', backgroundColor: '#333', borderRadius: '4px', opacity: 0.5 }}></div>
                    ) : hasDiscount ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#666', textDecoration: 'line-through', fontSize: '0.875rem' }}>
                                ₹{Number(product.price).toLocaleString('en-IN')}
                            </span>
                            <div className={styles.priceTag}>
                                ₹{finalPrice.toLocaleString('en-IN')}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.priceTag}>
                            ₹{Number(product.price).toLocaleString('en-IN')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
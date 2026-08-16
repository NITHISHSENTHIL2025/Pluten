"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowDown, RefreshCw } from 'lucide-react';
import PlutenNav from '@/components/PlutenNav';
import PlutenSkeleton from '@/components/skeleton/PlutenSkeleton';
import ProductCard from '@/components/ProductCard';
import apiClient from '@/lib/apiClient';
import styles from './page.module.css';

interface Product {
    id: string;
    title: string;
    category: string;
    description: string;
    price: number;
    thumbnail: string | null;
    createdAt: string;
}

export default function StorefrontPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get<Product[]>('/products');
            setProducts(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Failed to load Pluten products:', err);
            setProducts([]);
            setError('Unable to load products right now.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProducts(); }, []);

    return (
        <main className={styles.page}>
            <PlutenNav />

            <section className={styles.hero}>
                <div className={styles.heroCopy}>
                    <p className={styles.eyebrow}>PLUTEN / 001</p>
                    <h1 className={styles.heroTitle}>Beyond<br/>Ordinary.</h1>
                    <p className={styles.heroDescription}>Premium digital products built for people who refuse ordinary.</p>
                    <div className={styles.heroActions}>
                        <Link href="#products" className={styles.primaryCta}>Explore products <ArrowDown size={17}/></Link>
                        <Link href="/library" className={styles.secondaryCta}>Digital library</Link>
                    </div>
                </div>
                <div className={styles.heroVisual} aria-hidden="true">
                    <div className={styles.orbit}>
                        <span className={styles.orbitDot}/>
                        <img src="/favicon.ico" alt="" className={styles.heroLogo}/>
                    </div>
                    <div className={styles.heroCaption}>PLUTEN · BEYOND ORDINARY</div>
                    <div className={styles.scrollHint}>Scroll to explore <ArrowDown size={12}/></div>
                </div>
            </section>

            <section id="products" className={styles.productsSection}>
                <div className={styles.sectionInner}>
                    <div className={styles.sectionHeader}>
                        <div><p className={styles.sectionEyebrow}>PLUTEN / DIGITAL PRODUCTS</p><h2 className={styles.sectionTitle}>Built to be useful.</h2></div>
                        <span className={styles.sectionMeta}>{products.length} digital assets</span>
                    </div>

                    {loading && <div className={styles.loadingGrid}>{Array.from({length:4}).map((_,i)=><PlutenSkeleton key={i} variant="product"/>)}</div>}

                    {!loading && error && <div className={styles.state}><div className={styles.stateInner}><RefreshCw size={22}/><h3 className={styles.stateTitle}>The catalog is taking a breath.</h3><p className={styles.stateText}>{error}</p><button className={`${styles.primaryCta} ${styles.stateAction}`} onClick={loadProducts}>Try again</button></div></div>}

                    {!loading && !error && products.length === 0 && <div className={styles.state}><div className={styles.stateInner}><h3 className={styles.stateTitle}>Nothing here yet.</h3><p className={styles.stateText}>New products will appear here as they are released.</p></div></div>}

                    {!loading && !error && products.length > 0 && <div className={styles.productGrid}>{products.map((product)=><ProductCard key={product.id} product={product}/>)}</div>}
                </div>
            </section>

            <section className={styles.principle}>
                <div className={styles.principleInner}>
                    <div><p className={styles.principleEyebrow}>02 / THE PLUTEN WAY</p><h2 className={styles.principleTitle}>Ordinary.</h2></div>
                    <p className={styles.principleCopy}>We believe useful products should move you forward. No noise. No filler. Just things worth building, buying and learning.</p>
                </div>
            </section>

            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <Link href="/" className={styles.footerBrand}><img src="/favicon.ico" alt="Pluten"/>PLUTEN</Link>
                    <div className={styles.footerLinks}><a href="https://instagram.com/pluten" target="_blank" rel="noopener noreferrer">Instagram</a><a href="mailto:support@pluten.site">Support</a></div>
                    <span className={styles.footerCopyright}>© 2026 PLUTEN</span>
                </div>
            </footer>
        </main>
    );
}

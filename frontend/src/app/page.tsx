// frontend/src/app/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient'; 
import { Search, Star, User, Check, Package, ArrowRight, LifeBuoy } from 'lucide-react';
import ProductCard from '@/components/ProductCard'; 
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
    const router = useRouter();
    
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [activeSort, setActiveSort] = useState<'latest' | 'trending'>('latest');

    useEffect(() => {
        // THE FIX: Check for the unified 'user' key
        const userData = localStorage.getItem('user');
        if (userData) setIsLoggedIn(true);

        const fetchPublicAssets = async () => {
            try {
                const response = await apiClient.get('/products');
                setProducts(response.data);
            } catch (error) {
                console.error("Failed to sync with database:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPublicAssets();
    }, []);

    const availableCategories = useMemo(() => {
        const categories = products.map(p => p.category || 'Uncategorized');
        return ['All Categories', ...Array.from(new Set(categories))];
    }, [products]);

    const displayedProducts = useMemo(() => {
        let filtered = [...products];
        if (selectedCategory !== 'All Categories') {
            filtered = filtered.filter(p => (p.category || 'Uncategorized') === selectedCategory);
        }
        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(p => p.title.toLowerCase().includes(lowerQuery) || p.description.toLowerCase().includes(lowerQuery));
        }
        filtered.sort((a, b) => {
            if (activeSort === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (activeSort === 'trending') return b.price - a.price; 
            return 0;
        });
        return filtered;
    }, [products, selectedCategory, searchQuery, activeSort]);

    return (
        <div className={styles.storeContainer}>
            
            {/* TACTILE NAVBAR */}
            <nav className={styles.publicNav}>
                <div className={styles.brand} onClick={() => router.push('/')}>iSevens</div>
                
                <div className={styles.searchBar}>
                    <Search size={18} color="#666" />
                    <input 
                        type="text" 
                        placeholder="Search the ecosystem..." 
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className={styles.navActions}>
                    {isLoggedIn ? (
                        <div className={styles.authContainer}>
                            <button onClick={() => router.push('/library')} className={styles.btnPrimary}>
                                <Package size={16} /> My Orders
                            </button>
                            <button onClick={() => router.push('/profile')} className={styles.profileBtn}>
                                <User size={20} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => router.push('/login')} className={styles.btnPrimary}>
                            Access Securely
                        </button>
                    )}
                </div>
            </nav>

            {/* CONTROL PANEL */}
            <div className={styles.subNavbar}>
                <select className={styles.categorySelect} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <div style={{ width: '1px', height: '20px', backgroundColor: '#333' }}></div>
                <button onClick={() => setActiveSort('latest')} className={`${styles.filterPill} ${activeSort === 'latest' ? styles.active : ''}`}>Latest</button>
                <button onClick={() => setActiveSort('trending')} className={`${styles.filterPill} ${activeSort === 'trending' ? styles.active : ''}`}>Trending</button>
            </div>

            {/* MAIN GRID */}
            <main className={styles.mainLayout}>
                <section>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            {searchQuery ? `Query: "${searchQuery}"` : selectedCategory}
                        </h2>
                        <span style={{ color: '#666', fontSize: '0.9rem' }}>{displayedProducts.length} entries located</span>
                    </div>

                    {loading ? (
                        <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: '#666' }}>
                            Syncing database...
                        </div>
                    ) : displayedProducts.length === 0 ? (
                        <div style={{ height: '30vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: '#444' }}>
                            <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>No telemetry matches current parameters.</p>
                        </div>
                    ) : (
                        <div className={styles.productGrid}>
                            {displayedProducts.map((product, index) => (
                                <div 
                                    key={product.id} 
                                    onClick={() => router.push(`/product/${product.id}`)}
                                    style={{ animationDelay: `${index * 0.05}s`, cursor: 'pointer', height: '100%' }}
                                    className="transition-transform hover:scale-[1.02]"
                                >
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* MINIMALIST PREMIUM FOOTER */}
            <footer className={styles.grandFooter}>
                <div className={styles.thankYouText}>
                    Thank you for being a part of the <span>iSevens Ecosystem.</span>
                </div>

                <div className={styles.footerButtons}>
                    <a 
                        href="https://www.instagram.com/i.sevens?igsh=MTZ6eWY2cm04MDF5dQ==" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.footerBtn}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                        </svg>
                        Instagram
                    </a>
                    
                    <a 
                        href="mailto:support@isevens.com" 
                        className={styles.footerBtn}
                    >
                        <LifeBuoy size={18} /> Support
                    </a>
                </div>

                <div className={styles.footerBottomText}>
                    © 2026 iSevens Network. All rights secured.
                </div>
            </footer>

        </div>
    );
}
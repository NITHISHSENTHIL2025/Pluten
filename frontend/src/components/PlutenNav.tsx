"use client";

import Link from 'next/link';
import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PlutenNav() {
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!menuOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [menuOpen]);

    const close = () => setMenuOpen(false);

    return (
        <>
            <header className="pluten-nav">
                <div className="pluten-nav-inner">
                    <Link href="/" className="pluten-brand" aria-label="Pluten home">
                        <span className="pluten-mark" aria-hidden="true" />
                        <span className="pluten-brand-name">PLUTEN</span>
                    </Link>

                    <nav className="pluten-nav-links" aria-label="Primary navigation">
                        <Link href="/#products">Products</Link>
                        <Link href="/library">Library</Link>
                    </nav>

                    <div className="pluten-nav-actions">
                        <Link href="/#products" className="pluten-nav-icon" aria-label="Browse products"><Search size={18} /></Link>
                        <Link href="/profile" className="pluten-nav-icon" aria-label="Profile"><UserRound size={18} /></Link>
                        <Link href="/library" className="pluten-nav-icon" aria-label="Digital library"><ShoppingBag size={18} /></Link>
                        <button type="button" className="pluten-mobile-toggle" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu" aria-expanded={menuOpen}>
                            <Menu size={21} />
                        </button>
                    </div>
                </div>
            </header>

            {menuOpen && (
                <div className="pluten-mobile-overlay" role="dialog" aria-modal="true" aria-label="Navigation menu">
                    <div className="pluten-mobile-panel">
                        <div className="pluten-mobile-header">
                            <span className="pluten-brand-name">PLUTEN</span>
                            <button type="button" className="pluten-mobile-close" onClick={close} aria-label="Close navigation menu"><X size={20} /></button>
                        </div>
                        <nav className="pluten-mobile-links">
                            <Link href="/#products" onClick={close}>Products</Link>
                            <Link href="/library" onClick={close}>Digital Library</Link>
                            <Link href="/profile" onClick={close}>Profile</Link>
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}

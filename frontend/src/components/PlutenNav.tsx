'use client';

import Link from 'next/link';
import { InstagramIcon } from "@/components/InstagramIcon";
import { LibraryBig, Menu, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const instagram = 'https://www.instagram.com/pluten.official/';

export default function PlutenNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = previous; };
  }, [open]);

  return <>
    <header className="pluten-nav">
      <div className="pluten-nav-inner">
        <Link href="/" className="pluten-brand" aria-label="Pluten home">
          <span className="pluten-brand-mark"><img src="/favicon.ico" alt="" className="pluten-brand-logo"/></span>
          <span className="pluten-brand-name">PLUTEN</span>
        </Link>

        <nav className="pluten-nav-links" aria-label="Main navigation">
          <Link href="/#products" className="pluten-nav-link">Products</Link>
          <Link href="/portfolio" className="pluten-nav-link pluten-nav-portfolio">Portfolio Maker <span className="pluten-nav-new">FREE</span></Link>
          <Link href="/support" className="pluten-nav-link">Support</Link>
          <a href={instagram} target="_blank" rel="noreferrer" className="pluten-nav-link"><InstagramIcon size={14}/> Instagram</a>
        </nav>

        <div className="pluten-nav-actions">
          <Link href="/library" className="pluten-nav-icon" aria-label="Digital library"><LibraryBig size={17}/></Link>
          <Link href="/profile" className="pluten-nav-icon" aria-label="Profile"><UserRound size={17}/></Link>
          <button type="button" className="pluten-mobile-toggle" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}><Menu size={20}/></button>
        </div>
      </div>
    </header>

    {open && <div className="pluten-mobile-overlay" role="dialog" aria-modal="true" aria-label="Navigation menu" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="pluten-mobile-panel">
        <div className="pluten-mobile-header"><span className="pluten-brand-name">PLUTEN</span><button className="pluten-mobile-close" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20}/></button></div>
        <nav className="pluten-mobile-links">
          <Link href="/#products" onClick={() => setOpen(false)} className="pluten-mobile-link">Products</Link>
          <Link href="/portfolio" onClick={() => setOpen(false)} className="pluten-mobile-link">Portfolio Maker <span className="pluten-nav-new">FREE</span></Link>
          <Link href="/library" onClick={() => setOpen(false)} className="pluten-mobile-link">Library</Link>
          <Link href="/support" onClick={() => setOpen(false)} className="pluten-mobile-link">Support</Link>
          <Link href="/contact" onClick={() => setOpen(false)} className="pluten-mobile-link">Contact</Link>
          <a href={instagram} target="_blank" rel="noreferrer" className="pluten-mobile-link">Instagram @pluten.official</a>
        </nav>
      </div>
    </div>}
  </>;
}

"use client";

import Link from "next/link";
import { Search, ShoppingBag, UserRound, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function PlutenNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <>
      <header className="pluten-nav">
        <div className="pluten-nav-inner">
          <Link
            href="/"
            className="pluten-brand"
            aria-label="Pluten home"
          >
            <span className="pluten-mark" aria-hidden="true">P</span>
            <span className="pluten-brand-name">PLUTEN</span>
          </Link>

          <nav className="pluten-nav-links" aria-label="Primary navigation">
            <Link href="/#products">Products</Link>
            <Link href="/#products">Explore</Link>
          </nav>

          <div className="pluten-nav-actions">
            <Link
              href="/#products"
              aria-label="Browse products"
              className="pluten-nav-icon"
            >
              <Search size={18} strokeWidth={1.5} />
            </Link>

            <Link
              href="/profile"
              aria-label="Account"
              className="pluten-nav-icon"
            >
              <UserRound size={18} strokeWidth={1.5} />
            </Link>

            <Link
              href="/library"
              aria-label="Digital library"
              className="pluten-nav-icon"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </Link>

            <button
              type="button"
              className="pluten-mobile-toggle"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={21} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="pluten-mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <div className="pluten-mobile-menu-top">
            <span className="text-sm font-bold tracking-[0.22em]">PLUTEN</span>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-800"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={19} />
            </button>
          </div>

          <nav>
            <Link href="/#products" onClick={() => setMenuOpen(false)}>Products</Link>
            <Link href="/#products" onClick={() => setMenuOpen(false)}>Explore</Link>
            <Link href="/library" onClick={() => setMenuOpen(false)}>Digital Library</Link>
            <Link href="/profile" onClick={() => setMenuOpen(false)}>Account</Link>
          </nav>
        </div>
      )}
    </>
  );
}

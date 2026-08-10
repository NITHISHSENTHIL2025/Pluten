"use client";

import Link from "next/link";
import {
  Search,
  ShoppingBag,
  UserRound,
  Menu,
} from "lucide-react";

import { useState } from "react";

export default function PlutenNav() {

  const [menuOpen, setMenuOpen] =
    useState(false);

  return (
    <>

      <header className="pluten-nav">

        <div className="pluten-nav-inner">

          {/* BRAND */}

          <Link
            href="/"
            className="pluten-brand"
            aria-label="Pluten home"
          >

            <span className="pluten-mark">
              P
            </span>

            <span className="pluten-brand-name">
              PLUTEN
            </span>

          </Link>


          {/* DESKTOP NAV */}

          <nav
            className="pluten-nav-links"
            aria-label="Primary navigation"
          >

            <Link href="/products">
              Products
            </Link>

            <Link href="/products">
              Collections
            </Link>

            <Link href="/offers">
              New
            </Link>

          </nav>


          {/* ACTIONS */}

          <div className="pluten-nav-actions">

            <Link
              href="/products"
              aria-label="Search products"
              className="pluten-nav-icon"
            >
              <Search
                size={18}
                strokeWidth={1.5}
              />
            </Link>


            <Link
              href="/profile"
              aria-label="Account"
              className="pluten-nav-icon"
            >
              <UserRound
                size={18}
                strokeWidth={1.5}
              />
            </Link>


            <Link
              href="/library"
              aria-label="Library"
              className="pluten-nav-icon"
            >
              <ShoppingBag
                size={18}
                strokeWidth={1.5}
              />
            </Link>


            <button
              className="pluten-mobile-toggle"
              aria-label="Open menu"
              onClick={() =>
                setMenuOpen(true)
              }
            >
              <Menu
                size={21}
                strokeWidth={1.5}
              />
            </button>

          </div>

        </div>

      </header>


      {/* MOBILE */}

      {menuOpen && (

        <div className="pluten-mobile-menu">

          <div className="pluten-mobile-menu-top">

            <span>
              PLUTEN
            </span>

            <button
              onClick={() =>
                setMenuOpen(false)
              }
            >
              CLOSE
            </button>

          </div>


          <nav>

            <Link
              href="/products"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              Products
            </Link>

            <Link
              href="/products"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              Collections
            </Link>

            <Link
              href="/offers"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              New
            </Link>

            <Link
              href="/library"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              Library
            </Link>

            <Link
              href="/profile"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              Account
            </Link>

          </nav>

        </div>

      )}

    </>
  );
}
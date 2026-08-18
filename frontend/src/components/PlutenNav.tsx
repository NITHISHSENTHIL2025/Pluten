"use client";

import Link from "next/link";
import {
  Compass,
  LibraryBig,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

export default function PlutenNav() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const menuButtonRef =
    useRef<HTMLButtonElement | null>(null);

  const closeButtonRef =
    useRef<HTMLButtonElement | null>(null);

  const menuPanelRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * ---------------------------------------------------------
   * MOBILE MENU EFFECTS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const onKeyDown = (
      event: KeyboardEvent
    ) => {
      /*
       * Escape closes the menu.
       */
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }

      /*
       * Keep keyboard focus inside
       * the mobile navigation panel.
       */
      if (
        event.key !== "Tab" ||
        !menuPanelRef.current
      ) {
        return;
      }

      const focusable =
        Array.from(
          menuPanelRef.current.querySelectorAll<HTMLElement>(
            'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (element) =>
            !element.hasAttribute(
              "disabled"
            ) &&
            element.getAttribute(
              "aria-hidden"
            ) !== "true"
        );

      if (!focusable.length) return;

      const first =
        focusable[0];

      const last =
        focusable[
          focusable.length - 1
        ];

      /*
       * Shift + Tab from first
       * goes to last.
       */
      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
        return;
      }

      /*
       * Tab from last goes to first.
       */
      if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      window.clearTimeout(
        focusTimer
      );

      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [menuOpen]);


  /*
   * Return focus to the menu button
   * after closing the mobile menu.
   */
  useEffect(() => {
    if (!menuOpen) {
      menuButtonRef.current?.focus();
    }
  }, [menuOpen]);


  /*
   * ---------------------------------------------------------
   * MENU CONTROLS
   * ---------------------------------------------------------
   */

  const openMenu = () => {
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };


  /*
   * Close when clicking the dark
   * overlay outside the panel.
   */
  const handleOverlayMouseDown = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (
      event.target ===
      event.currentTarget
    ) {
      closeMenu();
    }
  };


  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <>
      {/* =====================================================
          DESKTOP / PUBLIC NAVBAR
      ===================================================== */}

      <header className="pluten-nav">
        <div className="pluten-nav-inner">

          {/* =================================================
              PLUTEN BRAND

              Uses the real Pluten logo asset instead
              of the old CSS-generated .pluten-mark.
          ================================================= */}

          <Link
            href="/"
            className="pluten-brand"
            aria-label="Pluten home"
          >
            <img
              src="/favicon.ico"
              alt="Pluten"
              className="pluten-brand-logo"
            />

            <span className="pluten-brand-name">
              PLUTEN
            </span>
          </Link>


          {/* =================================================
              DESKTOP TEXT NAVIGATION

              Intentionally empty.

              Products / Library text has been removed.
              Navigation is now represented by icons.
          ================================================= */}

          <nav
            className="pluten-nav-links"
            aria-label="Primary navigation"
          />


          {/* =================================================
              NAVIGATION ACTIONS
          ================================================= */}

          <div className="pluten-nav-actions">

            {/* Products */}
            <Link
              href="/#products"
              className="pluten-nav-icon"
              aria-label="Browse products"
              title="Products"
            >
              <Compass
                size={18}
                strokeWidth={1.7}
              />
            </Link>


            {/* Profile */}
            <Link
              href="/profile"
              className="pluten-nav-icon"
              aria-label="Profile"
              title="Profile"
            >
              <UserRound
                size={18}
                strokeWidth={1.7}
              />
            </Link>


            {/* Digital Library */}
            <Link
              href="/library"
              className="pluten-nav-icon"
              aria-label="Digital library"
              title="Digital library"
            >
              <LibraryBig
                size={18}
                strokeWidth={1.7}
              />
            </Link>


            {/* Mobile menu */}
            <button
              ref={menuButtonRef}
              type="button"
              className="pluten-mobile-toggle"
              onClick={openMenu}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="pluten-mobile-menu"
            >
              <Menu
                size={21}
                strokeWidth={1.8}
              />
            </button>

          </div>
        </div>
      </header>


      {/* =====================================================
          MOBILE NAVIGATION
      ===================================================== */}

      {menuOpen && (
        <div
          className="pluten-mobile-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          onMouseDown={
            handleOverlayMouseDown
          }
        >

          <div
            ref={menuPanelRef}
            className="pluten-mobile-panel"
            id="pluten-mobile-menu"
          >

            {/* =================================================
                MOBILE HEADER
            ================================================= */}

            <div className="pluten-mobile-header">

              <Link
                href="/"
                className="pluten-brand"
                onClick={closeMenu}
                aria-label="Pluten home"
              >
                <img
                  src="/favicon.ico"
                  alt="Pluten"
                  className="pluten-brand-logo"
                />

                <span className="pluten-brand-name">
                  PLUTEN
                </span>
              </Link>


              <button
                ref={closeButtonRef}
                type="button"
                className="pluten-mobile-close"
                onClick={closeMenu}
                aria-label="Close navigation menu"
              >
                <X
                  size={20}
                  strokeWidth={1.8}
                />
              </button>

            </div>


            {/* =================================================
                MOBILE LINKS

                Keep these because mobile needs
                accessible text navigation.
            ================================================= */}

            <nav
              className="pluten-mobile-links"
              aria-label="Mobile navigation"
            >

              <Link
                href="/#products"
                onClick={closeMenu}
              >
                Products
              </Link>

              <Link
                href="/library"
                onClick={closeMenu}
              >
                Digital Library
              </Link>

              <Link
                href="/profile"
                onClick={closeMenu}
              >
                Profile
              </Link>

            </nav>

          </div>
        </div>
      )}
    </>
  );
}
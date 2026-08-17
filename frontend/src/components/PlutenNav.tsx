"use client";

import Link from "next/link";
import {
  Compass,
  LibraryBig,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function PlutenNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const menuButtonRef =
    useRef<HTMLButtonElement | null>(null);

  const closeButtonRef =
    useRef<HTMLButtonElement | null>(null);

  const menuPanelRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusCloseButton = () => {
      closeButtonRef.current?.focus();
    };

    const focusTimer = window.setTimeout(
      focusCloseButton,
      0
    );

    const onKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }

      if (
        event.key !== "Tab" ||
        !menuPanelRef.current
      ) {
        return;
      }

      const focusable = Array.from(
        menuPanelRef.current.querySelectorAll<HTMLElement>(
          'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
        )
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !==
            "true"
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last =
        focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
        return;
      }

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
      window.clearTimeout(focusTimer);

      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      menuButtonRef.current?.focus();
    }
  }, [menuOpen]);

  const openMenu = () => {
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleOverlayMouseDown = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (
      event.target === event.currentTarget
    ) {
      closeMenu();
    }
  };

  return (
    <>
      <header className="pluten-nav">
        <div className="pluten-nav-inner">
          <Link
            href="/"
            className="pluten-brand"
            aria-label="Pluten home"
          >
            <span
              className="pluten-mark"
              aria-hidden="true"
            />
            <span className="pluten-brand-name">
              PLUTEN
            </span>
          </Link>

          <nav
            className="pluten-nav-links"
            aria-label="Primary navigation"
          >
            <Link href="/#products">
              Products
            </Link>

            <Link href="/library">
              Library
            </Link>
          </nav>

          <div className="pluten-nav-actions">
            <Link
              href="/#products"
              className="pluten-nav-icon"
              aria-label="Browse products"
            >
              <Compass size={18} />
            </Link>

            <Link
              href="/profile"
              className="pluten-nav-icon"
              aria-label="Profile"
            >
              <UserRound size={18} />
            </Link>

            <Link
              href="/library"
              className="pluten-nav-icon"
              aria-label="Digital library"
            >
              <LibraryBig size={18} />
            </Link>

            <button
              ref={menuButtonRef}
              type="button"
              className="pluten-mobile-toggle"
              onClick={openMenu}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="pluten-mobile-menu"
            >
              <Menu size={21} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="pluten-mobile-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          onMouseDown={handleOverlayMouseDown}
        >
          <div
            ref={menuPanelRef}
            className="pluten-mobile-panel"
            id="pluten-mobile-menu"
          >
            <div className="pluten-mobile-header">
              <span className="pluten-brand-name">
                PLUTEN
              </span>

              <button
                ref={closeButtonRef}
                type="button"
                className="pluten-mobile-close"
                onClick={closeMenu}
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            </div>

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
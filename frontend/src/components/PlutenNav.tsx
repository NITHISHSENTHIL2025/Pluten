// frontend/src/components/PlutenNav.tsx

"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  ChevronRight,
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

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
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
          'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !==
            "true",
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

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);

      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        onKeyDown,
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
    event: React.MouseEvent<HTMLDivElement>,
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
            <span className="pluten-brand-mark">
              <img
                src="/favicon.ico"
                alt=""
                className="pluten-brand-logo"
              />
            </span>

            <span className="pluten-brand-name">
              PLUTEN
            </span>
          </Link>

          <nav
            className="pluten-nav-links"
            aria-label="Primary navigation"
          >
            <Link
              href="/#products"
              className="pluten-nav-link"
            >
              <Compass
                size={15}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <span>Products</span>
            </Link>

            <Link
              href="/portfolio"
              className="pluten-nav-link pluten-nav-portfolio"
            >
              <BriefcaseBusiness
                size={15}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <span>Portfolio Maker</span>

              <span className="pluten-nav-new">
                NEW
              </span>
            </Link>

            <Link
              href="/services/portfolio"
              className="pluten-nav-link"
            >
              Services
            </Link>
          </nav>

          <div className="pluten-nav-actions">
            <Link
              href="/library"
              className="pluten-nav-icon"
              aria-label="Digital library"
              title="Digital library"
            >
              <LibraryBig
                size={17}
                strokeWidth={1.7}
                aria-hidden="true"
              />
            </Link>

            <Link
              href="/profile"
              className="pluten-nav-icon"
              aria-label="Profile"
              title="Profile"
            >
              <UserRound
                size={17}
                strokeWidth={1.7}
                aria-hidden="true"
              />
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
              <Menu
                size={20}
                strokeWidth={1.8}
                aria-hidden="true"
              />
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
              <Link
                href="/"
                className="pluten-brand"
                onClick={closeMenu}
                aria-label="Pluten home"
              >
                <span className="pluten-brand-mark">
                  <img
                    src="/favicon.ico"
                    alt=""
                    className="pluten-brand-logo"
                  />
                </span>

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
                  aria-hidden="true"
                />
              </button>
            </div>

            <nav
              className="pluten-mobile-links"
              aria-label="Mobile navigation"
            >
              <Link
                href="/#products"
                onClick={closeMenu}
                className="pluten-mobile-link"
              >
                <span className="pluten-mobile-link-left">
                  <span className="pluten-mobile-number">
                    01
                  </span>

                  <span>Products</span>
                </span>

                <ChevronRight
                  size={17}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
              </Link>

              <Link
                href="/portfolio"
                onClick={closeMenu}
                className="pluten-mobile-link pluten-mobile-portfolio"
              >
                <span className="pluten-mobile-link-left">
                  <span className="pluten-mobile-number">
                    02
                  </span>

                  <span className="pluten-mobile-portfolio-text">
                    <span>
                      Portfolio Maker
                    </span>

                    <small>
                      Build your professional presence
                    </small>
                  </span>
                </span>

                <ChevronRight
                  size={17}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
              </Link>

              <Link
                href="/services/portfolio"
                onClick={closeMenu}
                className="pluten-mobile-link"
              >
                <span className="pluten-mobile-link-left">
                  <span className="pluten-mobile-number">
                    03
                  </span>

                  <span>Services</span>
                </span>

                <ChevronRight
                  size={17}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
              </Link>

              <Link
                href="/library"
                onClick={closeMenu}
                className="pluten-mobile-link"
              >
                <span className="pluten-mobile-link-left">
                  <span className="pluten-mobile-number">
                    04
                  </span>

                  <span>Digital Library</span>
                </span>

                <ChevronRight
                  size={17}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
              </Link>

              <Link
                href="/profile"
                onClick={closeMenu}
                className="pluten-mobile-link"
              >
                <span className="pluten-mobile-link-left">
                  <span className="pluten-mobile-number">
                    05
                  </span>

                  <span>Profile</span>
                </span>

                <ChevronRight
                  size={17}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
              </Link>
            </nav>

            <div className="pluten-mobile-footer">
              

              <Link
                href="/portfolio"
                className="pluten-mobile-portfolio-button"
                onClick={closeMenu}
              >
                Portfolio Maker
              </Link>
            </div>

            <div className="pluten-mobile-caption">
              PLUTEN / BEYOND ORDINARY
            </div>
          </div>
        </div>
      )}
    </>
  );
}
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

import apiClient from "@/lib/apiClient";
import ProductCard from "@/components/ProductCard";

import styles from "./page.module.css";

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

  const heroRef = useRef<HTMLElement>(null);
  const heroLogoRef = useRef<HTMLImageElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroDescriptionRef = useRef<HTMLParagraphElement>(null);
  const heroButtonRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLElement>(null);

  /* =========================================================
     LOAD REAL PRODUCTS
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        const response =
          await apiClient.get<Product[]>("/products");

        if (!mounted) return;

        setProducts(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load Pluten products:",
          error
        );

        if (mounted) {
          setProducts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     REAL PRODUCTS ONLY

     No fake products.
     No fake categories.
     No fake sorting.
     No fake search.
  ========================================================= */

  const displayedProducts = useMemo(() => {
    return [...products].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }, [products]);

  /* =========================================================
     HERO LOGO PARALLAX
  ========================================================= */

  useEffect(() => {
    const hero = heroRef.current;
    const logo = heroLogoRef.current;

    if (!hero || !logo) return;

    const move = (event: MouseEvent) => {
      const rect =
        hero.getBoundingClientRect();

      const x =
        (event.clientX -
          rect.left -
          rect.width / 2) /
        rect.width;

      const y =
        (event.clientY -
          rect.top -
          rect.height / 2) /
        rect.height;

      gsap.to(logo, {
        x: x * 18,
        y: y * 14,
        rotateY: x * 6,
        rotateX: y * -6,
        duration: 0.8,
        ease: "power3.out",
        overwrite: true,
      });
    };

    const leave = () => {
      gsap.to(logo, {
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        duration: 1,
        ease: "elastic.out(1,.45)",
        overwrite: true,
      });
    };

    hero.addEventListener(
      "mousemove",
      move
    );

    hero.addEventListener(
      "mouseleave",
      leave
    );

    return () => {
      hero.removeEventListener(
        "mousemove",
        move
      );

      hero.removeEventListener(
        "mouseleave",
        leave
      );
    };
  }, []);

  /* =========================================================
     HERO ENTRANCE
  ========================================================= */

  useEffect(() => {
    const logo = heroLogoRef.current;
    const title = heroTitleRef.current;
    const description =
      heroDescriptionRef.current;
    const button = heroButtonRef.current;

    if (
      !logo ||
      !title ||
      !description ||
      !button
    ) {
      return;
    }

    const timeline = gsap.timeline();

    timeline.fromTo(
      logo,
      {
        scale: 0.72,
        opacity: 0,
        rotate: -8,
      },
      {
        scale: 1,
        opacity: 1,
        rotate: 0,
        duration: 1.15,
        ease: "power4.out",
      }
    );

    timeline.fromTo(
      title,
      {
        y: 60,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: "power4.out",
      },
      "-=.75"
    );

    timeline.fromTo(
      description,
      {
        y: 25,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power4.out",
      },
      "-=.5"
    );

    timeline.fromTo(
      button,
      {
        y: 20,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: "power4.out",
      },
      "-=.35"
    );

    return () => {
      timeline.kill();
    };
  }, []);

  /* =========================================================
     SCROLL
  ========================================================= */

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className={styles.page}>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className={styles.nav}>
        <div className={styles.navInner}>

          <a
            href="/"
            className={styles.brand}
            aria-label="Pluten home"
          >
            <img
              src="/favicon.ico"
              alt="Pluten"
              className={styles.brandLogo}
            />

            <span>PLUTEN</span>
          </a>

          <button
            type="button"
            className={styles.navProducts}
            onClick={scrollToProducts}
          >
            Products
          </button>

          <div className={styles.navSpacer} />

        </div>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        ref={heroRef}
        className={styles.hero}
      >

        <div className={styles.heroGlow} />

        <div className={styles.heroContent}>

          <div className={styles.heroEyebrow}>
            <span />
            PLUTEN / 001
          </div>

          <h1
            ref={heroTitleRef}
            className={styles.heroTitle}
          >
            BEYOND
            <br />
            <span>ORDINARY.</span>
          </h1>

          <p
            ref={heroDescriptionRef}
            className={
              styles.heroDescription
            }
          >
            Premium digital products
            built for people who refuse
            ordinary.
          </p>

          <div
            ref={heroButtonRef}
            className={styles.heroActions}
          >
            <button
              type="button"
              className={styles.primaryButton}
              onClick={scrollToProducts}
            >
              Explore products

              <ArrowUpRight
                size={18}
                strokeWidth={2.2}
              />
            </button>
          </div>

          <div className={styles.heroMeta}>
            <span>DIGITAL PRODUCTS</span>
            <span>EST. 2026</span>
          </div>

        </div>

        {/* =================================================
            REAL PLUTEN LOGO
        ================================================= */}

        <div className={styles.logoArea}>

          <div className={styles.logoHalo} />

          <div className={styles.logoOrbit} />

          <img
            ref={heroLogoRef}
            src="/favicon.ico"
            alt="Pluten logo"
            className={styles.heroLogo}
          />

          <div className={styles.logoLabel}>
            <span>PLUTEN</span>
            <strong>BEYOND ORDINARY.</strong>
          </div>

        </div>

        <button
          type="button"
          className={styles.scrollIndicator}
          onClick={scrollToProducts}
        >
          <span>SCROLL TO EXPLORE</span>

          <ArrowDown
            size={15}
            strokeWidth={2}
          />
        </button>

      </section>

      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      <section
        ref={productsRef}
        id="products"
        className={styles.products}
      >

        <div className={styles.productsHeader}>

          <div>
            <span
              className={
                styles.sectionEyebrow
              }
            >
              01 / PRODUCTS
            </span>

            <h2>
              Made to
              <br />
              matter.
            </h2>
          </div>

          <p>
            Digital products designed
            with purpose.
          </p>

        </div>

        {/* LOADING */}

        {loading && (
          <div className={styles.loading}>
            <span />
            Loading products...
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          displayedProducts.length === 0 && (
            <div className={styles.empty}>
              <strong>
                NO PRODUCTS YET.
              </strong>

              <p>
                New products are coming soon.
              </p>
            </div>
          )}

        {/* REAL PRODUCTS */}

        {!loading &&
          displayedProducts.length > 0 && (
            <div
              className={
                styles.productGrid
              }
            >
              {displayedProducts.map(
                (product, index) => (
                  <div
                    key={product.id}
                    className={
                      styles.productItem
                    }
                    style={{
                      animationDelay:
                        `${index * 70}ms`,
                    }}
                    onClick={() =>
                      router.push(
                        `/product/${product.id}`
                      )
                    }
                  >
                    <ProductCard
                      product={product}
                      index={index}
                    />
                  </div>
                )
              )}
            </div>
          )}

      </section>

      {/* =====================================================
          PHILOSOPHY
      ===================================================== */}

      <section
        className={styles.philosophy}
      >

        <div className={styles.philosophyTop}>
          <span>02 / THE PLUTEN WAY</span>
          <span>BEYOND ORDINARY.</span>
        </div>

        <div
          className={
            styles.philosophyContent
          }
        >

          <span
            className={
              styles.philosophyLabel
            }
          >
            OUR PRINCIPLE
          </span>

          <h2>
            Build.
            <br />
            Measure.
            <br />
            Improve.
            <br />
            Ship.
          </h2>

          <p>
            We believe useful products
            should move you forward.
            No noise. No filler.
            Just things worth building
            and learning.
          </p>

        </div>

      </section>

      {/* =====================================================
          SMALL FOOTER
      ===================================================== */}

      <footer className={styles.footer}>

        <div className={styles.footerInner}>

          <a
            href="/"
            className={styles.footerBrand}
          >
            <img
              src="/favicon.ico"
              alt="Pluten"
            />

            <span>PLUTEN</span>
          </a>

          <div
            className={
              styles.footerLinks
            }
          >
            <a
              href="https://instagram.com/pluten"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>

            <a href="mailto:support@pluten.site">
              Support
            </a>
          </div>

          <span
            className={
              styles.footerCopyright
            }
          >
            © 2026 PLUTEN
          </span>

        </div>

      </footer>

    </main>
  );
}
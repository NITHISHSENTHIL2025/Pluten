"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowDown,
  ArrowUpRight,
} from "lucide-react";

import gsap from "gsap";

import apiClient from "@/lib/apiClient";

import ProductCard from "@/components/ProductCard";

import PlutenNav from "@/components/PlutenNav";

import styles from "./page.module.css";


/* =========================================================
   PRODUCT
========================================================= */

interface Product {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  thumbnail: string | null;
  createdAt: string;
}


/* =========================================================
   PAGE
========================================================= */

export default function StorefrontPage() {

  const router = useRouter();


  /* =========================================================
     STATE
  ========================================================= */

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);


  /* =========================================================
     REFS
  ========================================================= */

  const heroRef =
    useRef<HTMLDivElement>(null);

  const heroTitleRef =
    useRef<HTMLHeadingElement>(null);

  const heroSubRef =
    useRef<HTMLParagraphElement>(null);

  const heroButtonsRef =
    useRef<HTMLDivElement>(null);

  const planetRef =
    useRef<HTMLDivElement>(null);

  const productsRef =
    useRef<HTMLElement>(null);


  /* =========================================================
     FETCH REAL PRODUCTS
  ========================================================= */

  useEffect(() => {

    let mounted = true;


    const fetchProducts = async () => {

      try {

        const response =
          await apiClient.get<Product[]>(
            "/products"
          );


        if (!mounted) {
          return;
        }


        setProducts(
          Array.isArray(response.data)
            ? response.data
            : []
        );

      } catch (error) {

        console.error(
          "Failed to load products:",
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


    fetchProducts();


    return () => {

      mounted = false;

    };

  }, []);


  /* =========================================================
     PRODUCTS
     
     Only real API products.
     No fake filters/search/sorting.
  ========================================================= */

  const featuredProducts =
    useMemo(() => {

      return [...products]
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ).getTime()
            -
            new Date(
              a.createdAt
            ).getTime()
        )
        .slice(0, 4);

    }, [products]);


  /* =========================================================
     HERO PARALLAX
  ========================================================= */

  useEffect(() => {

    const hero =
      heroRef.current;

    const planet =
      planetRef.current;


    if (
      !hero ||
      !planet
    ) {
      return;
    }


    const move =
      (event: MouseEvent) => {

        const rect =
          hero.getBoundingClientRect();


        const x =
          (
            event.clientX -
            rect.left -
            rect.width / 2
          )
          /
          rect.width;


        const y =
          (
            event.clientY -
            rect.top -
            rect.height / 2
          )
          /
          rect.height;


        gsap.to(
          planet,
          {
            x: x * 24,
            y: y * 18,

            rotateY: x * 5,
            rotateX: y * -5,

            duration: .8,

            ease: "power3.out",

            overwrite: true,
          }
        );

      };


    const leave = () => {

      gsap.to(
        planet,
        {
          x: 0,
          y: 0,

          rotateX: 0,
          rotateY: 0,

          duration: 1,

          ease:
            "elastic.out(1,.45)",

          overwrite: true,
        }
      );

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

    const title =
      heroTitleRef.current;

    const sub =
      heroSubRef.current;

    const buttons =
      heroButtonsRef.current;

    const planet =
      planetRef.current;


    if (
      !title ||
      !sub ||
      !buttons ||
      !planet
    ) {
      return;
    }


    const timeline =
      gsap.timeline();


    timeline.fromTo(
      title,
      {
        y: 70,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,

        duration: .9,

        ease:
          "power4.out",
      }
    );


    timeline.fromTo(
      sub,
      {
        y: 30,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,

        duration: .65,

        ease:
          "power4.out",
      },
      "-=.55"
    );


    timeline.fromTo(
      buttons,
      {
        y: 25,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,

        duration: .55,

        ease:
          "power4.out",
      },
      "-=.4"
    );


    timeline.fromTo(
      planet,
      {
        scale: .82,
        opacity: 0,
        rotate: -8,
      },
      {
        scale: 1,
        opacity: 1,
        rotate: 0,

        duration: 1.2,

        ease:
          "power4.out",
      },
      "-=.8"
    );


    return () => {

      timeline.kill();

    };

  }, []);


  /* =========================================================
     SCROLL
  ========================================================= */

  const scrollToProducts =
    () => {

      productsRef.current?.scrollIntoView(
        {
          behavior: "smooth",
          block: "start",
        }
      );

    };


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <main
      className={
        styles.page
      }
    >

      <PlutenNav />


      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        ref={heroRef}
        className={
          styles.hero
        }
      >

        <div
          className={
            styles.heroNoise
          }
        />


        <div
          className={
            styles.heroGlow
          }
        />


        <div
          className={
            styles.heroContent
          }
        >

          <div
            className={
              styles.heroEyebrow
            }
          >

            <span />

            PLUTEN / 001

          </div>


          <h1
            ref={heroTitleRef}
            className={
              styles.heroTitle
            }
          >

            BEYOND

            <br />

            <span>
              ORDINARY.
            </span>

          </h1>


          <p
            ref={heroSubRef}
            className={
              styles.heroDescription
            }
          >

            Premium digital products
            built for people who
            refuse ordinary.

          </p>


          <div
            ref={heroButtonsRef}
            className={
              styles.heroActions
            }
          >

            <button
              type="button"
              className={
                styles.primaryButton
              }
              onClick={
                scrollToProducts
              }
            >

              Explore products

              <ArrowUpRight
                size={17}
                strokeWidth={2}
              />

            </button>

          </div>


          <div
            className={
              styles.heroMeta
            }
          >

            <span>
              DIGITAL PRODUCTS
            </span>

            <span>
              EST. 2026
            </span>

          </div>

        </div>


        {/* PLANET */}

        <div
          className={
            styles.planetArea
          }
        >

          <div
            className={
              styles.planetHalo
            }
          />


          <div
            ref={planetRef}
            className={
              styles.planet
            }
          >

            <div
              className={
                styles.planetSurface
              }
            />

            <div
              className={
                styles.planetHighlight
              }
            />

          </div>


          <div
            className={
              styles.planetOrbit
            }
          />


          <div
            className={
              styles.planetLabel
            }
          >

            <span>
              OBJECT 01
            </span>

            <strong>
              THE BEGINNING
            </strong>

          </div>

        </div>


        {/* SCROLL */}

        <button
          type="button"
          className={
            styles.scrollIndicator
          }
          onClick={
            scrollToProducts
          }
          aria-label="Scroll to products"
        >

          <span>
            SCROLL TO EXPLORE
          </span>

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
        className={
          styles.products
        }
      >

        <div
          className={
            styles.productsHeader
          }
        >

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
            with purpose. Nothing extra.
          </p>

        </div>


        {loading ? (

          <div
            className={
              styles.loading
            }
          >

            <span />

            Loading products...

          </div>

        ) : featuredProducts.length === 0 ? (

          <div
            className={
              styles.empty
            }
          >

            <strong>
              NO PRODUCTS YET.
            </strong>

            <p>
              New products are coming soon.
            </p>

          </div>

        ) : (

          <div
            className={
              styles.productGrid
            }
          >

            {featuredProducts.map(
              (
                product,
                index
              ) => (

                <div
                  key={
                    product.id
                  }
                  className={
                    styles.productItem
                  }
                  style={{
                    animationDelay:
                      `${index * 100}ms`,
                  }}
                  onClick={() =>
                    router.push(
                      `/product/${product.id}`
                    )
                  }
                >

                  <ProductCard
                    product={
                      product
                    }
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
        className={
          styles.philosophy
        }
      >

        <div
          className={
            styles.philosophyTop
          }
        >

          <span>
            02 / THE PLUTEN WAY
          </span>

          <span>
            BEYOND ORDINARY.
          </span>

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

      <footer
        className={
          styles.footer
        }
      >

        <div
          className={
            styles.footerInner
          }
        >

          <div
            className={
              styles.footerBrand
            }
          >

            <img
              src="/favicon.ico"
              alt="Pluten"
              className={
                styles.footerLogo
              }
            />

            <span>
              PLUTEN
            </span>

          </div>


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


            <a
              href="mailto:support@pluten.site"
            >
              Support
            </a>

          </div>


          <div
            className={
              styles.footerCopyright
            }
          >

            © 2026 PLUTEN

          </div>

        </div>

      </footer>

    </main>
  );
}
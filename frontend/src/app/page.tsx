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
  ArrowRight,
  ArrowUpRight,
  Search,
} from "lucide-react";

import gsap from "gsap";

import apiClient from "@/lib/apiClient";

import ProductCard from "@/components/ProductCard";

import PlutenNav from "@/components/PlutenNav";

import styles from "./page.module.css";


/* =========================================================
   PRODUCT TYPE
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
   STOREFRONT
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

  const [searchQuery, setSearchQuery] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All Categories");

  const [activeSort, setActiveSort] =
    useState<"latest" | "trending">(
      "latest"
    );


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

  const featuredRef =
    useRef<HTMLElement>(null);


  /* =========================================================
     FETCH PRODUCTS
  ========================================================= */

  useEffect(() => {

    let mounted = true;


    const fetchProducts = async () => {

      try {

        const response =
          await apiClient.get<Product[]>(
            "/products"
          );


        if (mounted) {

          setProducts(
            Array.isArray(response.data)
              ? response.data
              : []
          );

        }

      } catch (error) {

        console.error(
          "Failed to sync products:",
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
     CATEGORIES
  ========================================================= */

  const availableCategories =
    useMemo(() => {

      const categories =
        products
          .map(
            (product) =>
              product.category?.trim() ||
              "Uncategorized"
          )
          .filter(Boolean);


      return [
        "All Categories",
        ...Array.from(
          new Set(categories)
        ),
      ];

    }, [products]);


  /* =========================================================
     FILTER + SORT
  ========================================================= */

  const displayedProducts =
    useMemo(() => {

      let filtered =
        [...products];


      /* CATEGORY */

      if (
        selectedCategory !==
        "All Categories"
      ) {

        filtered =
          filtered.filter(
            (product) =>
              (
                product.category?.trim() ||
                "Uncategorized"
              ) ===
              selectedCategory
          );

      }


      /* SEARCH */

      const query =
        searchQuery
          .trim()
          .toLowerCase();


      if (query) {

        filtered =
          filtered.filter(
            (product) => {

              const title =
                product.title
                  ?.toLowerCase() || "";

              const description =
                product.description
                  ?.toLowerCase() || "";

              const category =
                product.category
                  ?.toLowerCase() || "";


              return (
                title.includes(query) ||
                description.includes(query) ||
                category.includes(query)
              );

            }
          );

      }


      /* SORT */

      filtered.sort(
        (a, b) => {

          if (
            activeSort ===
            "latest"
          ) {

            return (
              new Date(
                b.createdAt
              ).getTime()
              -
              new Date(
                a.createdAt
              ).getTime()
            );

          }


          /*
             Trending fallback.
             Until a real popularity metric exists,
             preserve the current product order.
          */

          return 0;

        }
      );


      return filtered;

    }, [
      products,
      selectedCategory,
      searchQuery,
      activeSort,
    ]);


  /* =========================================================
     FEATURED PRODUCTS
     
     FOUR PRODUCTS ON DESKTOP
  ========================================================= */

  const featuredProducts =
    displayedProducts.slice(
      0,
      4
    );


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


    const leave =
      () => {

        gsap.to(
          planet,
          {
            x: 0,

            y: 0,

            rotateX: 0,

            rotateY: 0,

            duration: 1,

            ease: "elastic.out(1,.45)",

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

        ease: "power4.out",
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

        ease: "power4.out",
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

        ease: "power4.out",
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

        ease: "power4.out",
      },

      "-=.8"
    );


    return () => {

      timeline.kill();

    };

  }, []);


  /* =========================================================
     SCROLL TO PRODUCTS
  ========================================================= */

  const scrollToProducts =
    () => {

      featuredRef.current?.scrollIntoView(
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


        {/* HERO CONTENT */}

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


            <button
              type="button"
              className={
                styles.textButton
              }
              onClick={
                scrollToProducts
              }
            >

              Discover Pluten

              <ArrowRight
                size={15}
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
          FEATURED COLLECTION
      ===================================================== */}

      <section
        ref={featuredRef}
        className={
          styles.featured
        }
      >

        {/* HEADER */}

        <div
          className={
            styles.sectionHeader
          }
        >

          <div>

            <span
              className={
                styles.sectionEyebrow
              }
            >
              01 / COLLECTION
            </span>

            <h2>

              Selected

              <br />

              works.

            </h2>

          </div>


          <div
            className={
              styles.sectionSide
            }
          >

            <p>
              A growing collection of
              practical digital products
              designed to help you build,
              learn and move further.
            </p>


            <button
              type="button"
              onClick={() =>
                router.push(
                  "/products"
                )
              }
            >

              View all

              <ArrowUpRight
                size={15}
                strokeWidth={2}
              />

            </button>

          </div>

        </div>


        {/* FILTERS */}

        <div
          className={
            styles.filterRow
          }
        >

          <div
            className={
              styles.categoryList
            }
          >

            {availableCategories
              .slice(0, 5)
              .map(
                (category) => (

                  <button
                    key={category}
                    type="button"
                    className={
                      selectedCategory ===
                      category
                        ? styles.filterActive
                        : styles.filter
                    }
                    onClick={() =>
                      setSelectedCategory(
                        category
                      )
                    }
                  >

                    {category}

                  </button>

                )
              )}

          </div>


          <div
            className={
              styles.sortArea
            }
          >

            <button
              type="button"
              className={
                activeSort ===
                "latest"
                  ? styles.sortActive
                  : styles.sort
              }
              onClick={() =>
                setActiveSort(
                  "latest"
                )
              }
            >

              Latest

            </button>


            <button
              type="button"
              className={
                activeSort ===
                "trending"
                  ? styles.sortActive
                  : styles.sort
              }
              onClick={() =>
                setActiveSort(
                  "trending"
                )
              }
            >

              Trending

            </button>

          </div>

        </div>


        {/* SEARCH */}

        <div
          className={
            styles.searchWrapper
          }
        >

          <Search
            size={17}
            strokeWidth={2}
          />

          <input
            value={
              searchQuery
            }
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
            placeholder="Search products..."
            aria-label="Search products"
          />

        </div>


        {/* PRODUCTS */}

        {loading ? (

          <div
            className={
              styles.loading
            }
          >

            <span />

            Loading collection...

          </div>

        ) : featuredProducts.length === 0 ? (

          <div
            className={
              styles.empty
            }
          >

            <span>
              NOTHING HERE YET.
            </span>

            <p>
              Try another search
              or category.
            </p>

          </div>

        ) : (

          <div
            className={
              styles.productGrid
            }
          >

            {featuredProducts.map(
              (product, index) => (

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
          FOOTER
      ===================================================== */}

      <footer
        className={
          styles.footer
        }
      >

        <div
          className={
            styles.footerMain
          }
        >

          {/* BRAND */}

          <div>

            <div
              className={
                styles.footerBrand
              }
            >

              {/* REAL PLUTEN LOGO */}

              <img
                src="/favicon.ico"
                alt="Pluten"
                className={
                  styles.footerLogo
                }
              />

              PLUTEN

            </div>


            <p>
              Beyond ordinary.
            </p>

          </div>


          {/* LINKS */}

          <div
            className={
              styles.footerLinks
            }
          >

            <div>

              <span>
                EXPLORE
              </span>


              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/products"
                  )
                }
              >
                Products
              </button>


              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/offers"
                  )
                }
              >
                New
              </button>


              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/library"
                  )
                }
              >
                Library
              </button>

            </div>


            <div>

              <span>
                ACCOUNT
              </span>


              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/profile"
                  )
                }
              >
                Profile
              </button>


              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/login"
                  )
                }
              >
                Sign in
              </button>

            </div>

          </div>

        </div>


        {/* COPYRIGHT */}

        <div
          className={
            styles.footerBottom
          }
        >

          <span>
            © 2026 PLUTEN
          </span>

          <span>
            BEYOND ORDINARY.
          </span>

        </div>

      </footer>

    </main>
  );
}
"use client";
import PlutenSkeleton from "@/components/skeleton/PlutenSkeleton";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Library,
  Loader2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import apiClient from "@/lib/apiClient";

import styles from "./library.module.css";


/* =========================================================
   TYPES
   ========================================================= */

interface PurchasedAsset {
  id: string;
  title: string;
  thumbnail: string | null;
}


/* =========================================================
   PAGE
   ========================================================= */

export default function MyLibraryPage() {
  const router = useRouter();

  const [assets, setAssets] = useState<PurchasedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);


  /* =========================================================
     FETCH AUTHENTICATED LIBRARY
     
     IMPORTANT:
     This remains the same backend flow.
     ========================================================= */

  useEffect(() => {
    let mounted = true;

    const fetchLibrary = async () => {
      try {
        const response =
          await apiClient.get<PurchasedAsset[]>(
            "/user/library"
          );

        if (!mounted) {
          return;
        }

        setAssets(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (error: any) {
        console.error(
          "Failed to load library:",
          error
        );

        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          router.push("/login");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchLibrary();

    return () => {
      mounted = false;
    };
  }, [router]);


  /* =========================================================
     SECURE DOWNLOAD
     
     The frontend does NOT directly expose or construct
     the protected asset URL.

     The backend returns the authorized download URL.
     ========================================================= */

  const handleDownload = async (
    productId: string
  ) => {
    if (downloadingId) {
      return;
    }

    try {
      setDownloadError(null);
      setDownloadingId(productId);

      const response =
        await apiClient.get(
          `/user/download/${productId}`
        );

      const downloadUrl =
        response?.data?.downloadUrl;

      if (
        typeof downloadUrl !== "string" ||
        !downloadUrl
      ) {
        throw new Error(
          "No secure download URL returned."
        );
      }

      window.open(
        downloadUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error: any) {
      console.error(
        "Secure download failed:",
        error
      );

      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        router.push("/login");
        return;
      }

      setDownloadError(
        error?.response?.data?.error ||
          "Download failed. Please try again."
      );
    } finally {
      setDownloadingId(null);
    }
  };


  /* =========================================================
     LOADING STATE
     ========================================================= */

  if (loading) {
  return (
    <div className={styles.contentWrapper}>
      <div className={styles.assetGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <PlutenSkeleton
            key={index}
            variant="library"
          />
        ))}
      </div>
    </div>
  );
}


  /* =========================================================
     MAIN
     ========================================================= */

  return (
    <main className={styles.pageContainer}>

      {/* =====================================================
          TOP NAVIGATION
      ===================================================== */}

      <header className={styles.topNav}>
        <div className={styles.topNavInner}>

          <Link
            href="/"
            className={styles.brand}
            aria-label="Pluten home"
          >
            <img
              src="/favicon.ico"
              alt="Pluten"
              className={styles.brandLogo}
            />

            <span className={styles.brandName}>
              PLUTEN
            </span>
          </Link>


          <nav className={styles.navActions}>

            <Link
              href="/profile"
              className={styles.navLink}
            >
              <UserRound
                size={16}
                strokeWidth={2}
              />

              <span>
                Profile
              </span>
            </Link>

          </nav>

        </div>
      </header>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className={styles.contentWrapper}>

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className={styles.header}>

          <div className={styles.headerLeft}>

            <button
              type="button"
              onClick={() => router.push("/")}
              className={styles.backBtn}
            >
              <ArrowLeft
                size={15}
                strokeWidth={2}
              />

              <span>
                Back to Pluten
              </span>
            </button>


            <span className={styles.pageEyebrow}>
              PLUTEN / DIGITAL LIBRARY
            </span>


            <h1 className={styles.pageTitle}>
              Your Library.
            </h1>


            <p className={styles.subtitle}>
              Everything you've acquired from
              Pluten, securely stored and ready
              when you need it.
            </p>

          </div>


          {/* SECURITY BADGE */}

          <div className={styles.vaultBadge}>
            <ShieldCheck
              size={15}
              strokeWidth={2}
            />

            <span>
              Secure Library
            </span>
          </div>

        </header>


        {/* ===================================================
            LIBRARY META
        =================================================== */}

        {downloadError && (
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-950 bg-red-950/20 p-4 text-sm text-red-300 sm:flex-row sm:items-center sm:justify-between">
            <div>{downloadError}</div>
            <button
              type="button"
              onClick={() => setDownloadError(null)}
              className="shrink-0 rounded-lg border border-red-900 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-200"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className={styles.libraryMeta}>

          <span className={styles.assetCount}>
            <strong>
              {assets.length}
            </strong>{" "}
            {assets.length === 1
              ? "DIGITAL ASSET"
              : "DIGITAL ASSETS"}
          </span>

        </div>


        {/* ===================================================
            EMPTY LIBRARY
        =================================================== */}

        {assets.length === 0 && (
          <section className={styles.empty}>

            <div className={styles.emptyIcon}>
              <Library
                size={24}
                strokeWidth={1.8}
              />
            </div>

            <h2 className={styles.emptyTitle}>
              Your library is empty.
            </h2>

            <p className={styles.emptyText}>
              Products you purchase from Pluten
              will appear here automatically.
            </p>

          </section>
        )}


        {/* ===================================================
            REAL PURCHASED ASSETS
        =================================================== */}

        {assets.length > 0 && (
          <section className={styles.assetGrid}>

            {assets.map(
              (asset, index) => (
                <article
                  key={asset.id}
                  className={styles.assetCard}
                  style={{
                    animationDelay:
                      `${index * 70}ms`,
                  }}
                >

                  {/* =========================================
                      IMAGE
                  ========================================= */}

                  <div
                    className={
                      styles.cardImageWrap
                    }
                  >

                    {asset.thumbnail ? (
                      <img
                        src={asset.thumbnail}
                        alt={asset.title}
                        className={
                          styles.cardImage
                        }
                      />
                    ) : (
                      <div
                        className={
                          styles.noImage
                        }
                      >
                        NO PREVIEW
                      </div>
                    )}

                    {asset.thumbnail && (
                      <div
                        className={
                          styles.cardImageShade
                        }
                      />
                    )}

                  </div>


                  {/* =========================================
                      CONTENT
                  ========================================= */}

                  <div
                    className={
                      styles.cardContent
                    }
                  >

                    <span
                      className={
                        styles.cardEyebrow
                      }
                    >
                      DIGITAL PRODUCT
                    </span>


                    <h2
                      className={
                        styles.cardTitle
                      }
                    >
                      {asset.title}
                    </h2>


                    <div
                      className={
                        styles.cardFooter
                      }
                    >

                      <span
                        className={
                          styles.cardStatus
                        }
                      >
                        <span
                          className={
                            styles.cardStatusDot
                          }
                        />

                        Owned
                      </span>


                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(
                            asset.id
                          )
                        }
                        disabled={
                          downloadingId !== null
                        }
                        className={
                          styles.downloadBtn
                        }
                      >

                        {downloadingId ===
                        asset.id ? (
                          <>
                            <Loader2
                              size={15}
                              strokeWidth={2}
                              className="animate-spin"
                            />

                            <span>
                              Preparing
                            </span>
                          </>
                        ) : (
                          <>
                            <Download
                              size={15}
                              strokeWidth={2}
                            />

                            <span>
                              Download
                            </span>
                          </>
                        )}

                      </button>

                    </div>

                  </div>

                </article>
              )
            )}

          </section>
        )}

      </div>


      {/* =====================================================
          SMALL FOOTER
      ===================================================== */}

      <footer className={styles.footer}>

        <div className={styles.footerInner}>

          <Link
            href="/"
            className={styles.footerBrand}
          >
            <img
              src="/favicon.ico"
              alt="Pluten"
            />

            <span>
              PLUTEN
            </span>
          </Link>


          <div className={styles.footerLinks}>

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


          <span
            className={styles.footerCopyright}
          >
            © 2026 PLUTEN
          </span>

        </div>

      </footer>

    </main>
  );
}

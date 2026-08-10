"use client";

import {
  Suspense,
  useState,
} from "react";

import {
  Loader2,
  ShieldCheck,
} from "lucide-react";

import {
  useSearchParams,
} from "next/navigation";

import apiClient from "@/lib/apiClient";

import styles from "./login.module.css";

import {
  GoogleOAuthProvider,
  GoogleLogin,
} from "@react-oauth/google";


/* =========================================================
   LOGIN ENGINE
   ========================================================= */

function LoginEngine() {
  const searchParams =
    useSearchParams();

  const redirectUrl =
    searchParams.get("redirect");

  const isExpired =
    searchParams.get("expired");


  /* =========================================================
     STATE
     ========================================================= */

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  /* =========================================================
     GOOGLE LOGIN
     ========================================================= */

  const handleGoogleSuccess =
    async (
      credentialResponse: any
    ) => {
      try {
        setLoading(true);

        setError("");


        /* =====================================================
           SEND GOOGLE TOKEN TO BACKEND
        ===================================================== */

        const response =
          await apiClient.post(
            "/auth/google-login",
            {
              token:
                credentialResponse.credential,
            }
          );


        /* =====================================================
           EXTRACT AUTH DATA
        ===================================================== */

        const userRole =
          response.data.user?.role ||
          "CUSTOMER";

        const secureToken =
          response.data.token;


        /* =====================================================
           STORE CLIENT AUTH
        ===================================================== */

        localStorage.setItem(
          "token",
          secureToken
        );

        localStorage.setItem(
          "user",
          JSON.stringify(
            response.data.user
          )
        );

        localStorage.setItem(
          "role",
          userRole
        );


        /* =====================================================
           MIDDLEWARE COOKIES
        ===================================================== */

        document.cookie =
          `client_auth=true; path=/; max-age=86400; Secure; SameSite=Lax`;

        document.cookie =
          `user_role=${userRole}; path=/; max-age=86400; Secure; SameSite=Lax`;


        /* =====================================================
           COOKIE RACE CONDITION PROTECTION

           Give the browser enough time to persist the
           cookies before navigating.
        ===================================================== */

        setTimeout(() => {
          if (
            userRole ===
              "SUPER_ADMIN" ||
            userRole ===
              "PRODUCT_MANAGER" ||
            userRole ===
              "FINANCE_MANAGER"
          ) {
            window.location.href =
              "/admin/products";

            return;
          }


          if (
            redirectUrl &&
            redirectUrl !== "/dashboard"
          ) {
            window.location.href =
              redirectUrl;

            return;
          }


          window.location.href =
            "/";
        }, 300);

      } catch (err: any) {
        console.error(
          "Google login failed:",
          err
        );

        setError(
          err.response?.data?.error ||
            "Google authentication failed. Please try again."
        );

        setLoading(false);
      }
    };


  /* =========================================================
     GOOGLE LOGIN ERROR
     ========================================================= */

  const handleGoogleError =
    () => {
      setError(
        "Google authentication failed. Please try again."
      );
    };


  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <GoogleOAuthProvider
      clientId={
        process.env
          .NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        ""
      }
    >

      <main
        className={
          styles.premiumContainer
        }
      >

        {/* ===================================================
            BACKGROUND
        =================================================== */}

        <div
          className={
            styles.backgroundGrid
          }
          aria-hidden="true"
        />

        <div
          className={
            styles.backgroundGlow
          }
          aria-hidden="true"
        />


        {/* ===================================================
            TOP PAGE LABEL
        =================================================== */}

        <div
          className={
            styles.pageLabel
          }
          aria-hidden="true"
        >
          PLUTEN / ACCOUNT
        </div>


        {/* ===================================================
            LOGIN CARD
        =================================================== */}

        <section
          className={
            styles.skeuomorphicCard
          }
          aria-label="Pluten secure login"
        >

          {/* =================================================
              BRAND
          ================================================= */}

          <div
            className={
              styles.brand
            }
          >

            <img
              src="/favicon.ico"
              alt="Pluten"
              className={
                styles.brandLogo
              }
            />

            <span
              className={
                styles.brandName
              }
            >
              PLUTEN
            </span>

          </div>


          {/* =================================================
              SECURITY ICON
          ================================================= */}

          <div
            className={
              styles.securityIcon
            }
            aria-hidden="true"
          >
            <ShieldCheck
              size={21}
              strokeWidth={1.7}
            />
          </div>


          {/* =================================================
              TITLE
          ================================================= */}

          <h1
            className={
              styles.title
            }
          >
            Access securely.
          </h1>


          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <p
            className={
              styles.description
            }
          >
            Sign in with Google to
            access your Pluten Digital
            Library and manage your
            purchases.
          </p>


          {/* =================================================
              EXPIRED SESSION
          ================================================= */}

          {isExpired === "true" && (
            <div
              className={`${styles.statusMessage} ${styles.expiredMessage}`}
              role="status"
            >
              Your secure session has
              expired. Please authenticate
              again.
            </div>
          )}


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className={`${styles.statusMessage} ${styles.errorMessage}`}
              role="alert"
            >
              {error}
            </div>
          )}


          {/* =================================================
              GOOGLE AUTHENTICATION
          ================================================= */}

          <div
            className={
              styles.googleArea
            }
          >

            {loading ? (

              <div
                className={
                  styles.loadingState
                }
                aria-live="polite"
              >

                <Loader2
                  size={22}
                  className="animate-spin"
                />

              </div>

            ) : (

              <GoogleLogin
                onSuccess={
                  handleGoogleSuccess
                }
                onError={
                  handleGoogleError
                }
                theme="outline"
                shape="rectangular"
                size="large"
                text="signin_with"
                width="320"
              />

            )}

          </div>


          {/* =================================================
              TRUST LINE
          ================================================= */}

          <div
            className={
              styles.trustLine
            }
          >

            <ShieldCheck
              size={13}
              strokeWidth={1.7}
            />

            <span>
              Secure authentication
            </span>

          </div>

        </section>


        {/* ===================================================
            BOTTOM BRAND
        =================================================== */}

        <div
          className={
            styles.bottomLabel
          }
          aria-hidden="true"
        >
          PLUTEN — BEYOND ORDINARY.
        </div>

      </main>

    </GoogleOAuthProvider>
  );
}


/* =========================================================
   PAGE
   ========================================================= */

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main
          className={
            styles.premiumContainer
          }
        >
          <div
            className={
              styles.loadingState
            }
          >
            <Loader2
              size={24}
              className="animate-spin"
            />
          </div>
        </main>
      }
    >
      <LoginEngine />
    </Suspense>
  );
}
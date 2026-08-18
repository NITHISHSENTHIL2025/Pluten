"use client";

import {
  Suspense,
  useMemo,
  useState,
} from "react";

import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { useSearchParams } from "next/navigation";

import apiClient from "@/lib/apiClient";

import {
  GoogleLogin,
  GoogleOAuthProvider,
} from "@react-oauth/google";

import styles from "./login.module.css";


const ADMIN_ROLES = new Set([
  "SUPER_ADMIN",
  "PRODUCT_MANAGER",
  "FINANCE_MANAGER",
  "CUSTOMER_SUPPORT",
]);


/* =========================================================
   USER AGENT
========================================================= */

function getUserAgent(): string {
  if (typeof navigator === "undefined") {
    return "";
  }

  return navigator.userAgent || "";
}


/* =========================================================
   IN-APP BROWSER DETECTION
========================================================= */

function isInAppBrowser(): boolean {
  const ua = getUserAgent();

  return /Instagram|FBAN|FBAV|FB_IAB|Threads|Line\//i.test(
    ua
  );
}


/* =========================================================
   PLATFORM DETECTION
========================================================= */

function isAndroid(): boolean {
  return /Android/i.test(getUserAgent());
}


function isIOS(): boolean {
  const ua = getUserAgent();

  return (
    /iPhone|iPad|iPod/i.test(ua) ||
    (
      /Macintosh/i.test(ua) &&
      typeof navigator !== "undefined" &&
      "ontouchend" in document
    )
  );
}


/* =========================================================
   CURRENT URL
========================================================= */

function buildCurrentUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.href;
}


/* =========================================================
   ANDROID CHROME INTENT
========================================================= */

/*
 * IMPORTANT:
 *
 * Do NOT build this using:
 *
 * [
 *   "intent://...",
 *   "#Intent",
 *   "scheme=https",
 *   ...
 * ].join(";")
 *
 * That creates:
 *
 * intent://pluten.site/profile;#Intent...
 *
 * and Android can interpret the ";" as part of
 * the requested path.
 *
 * Correct:
 *
 * intent://pluten.site/profile#Intent;scheme=https;...
 */
function buildChromeIntentUrl(
  currentUrl: string
): string {
  try {
    const url = new URL(currentUrl);

    /*
     * Keep the pathname exactly as it is.
     *
     * Example:
     * /profile
     *
     * Never allow an accidental trailing semicolon.
     */
    const cleanPath =
      `${url.pathname}${url.search}${url.hash}`
        .replace(/;$/, "");

    /*
     * The actual HTTPS URL we want Chrome to open.
     */
    const targetUrl =
      `https://${url.host}${cleanPath}`;

    /*
     * Android fallback if Chrome cannot be opened.
     */
    const fallbackUrl =
      encodeURIComponent(targetUrl);

    /*
     * IMPORTANT:
     *
     * #Intent comes immediately after
     * the URL/path.
     *
     * There is NO semicolon before #Intent.
     */
    return (
      `intent://${url.host}${cleanPath}` +
      `#Intent;` +
      `scheme=https;` +
      `package=com.android.chrome;` +
      `S.browser_fallback_url=${fallbackUrl};` +
      `end`
    );
  } catch {
    return "";
  }
}


/* =========================================================
   LOGIN ENGINE
========================================================= */

function LoginEngine() {
  const searchParams =
    useSearchParams();

  const redirectUrl =
    searchParams.get("redirect");

  const expired =
    searchParams.get("expired");


  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    browserInstructions,
    setBrowserInstructions,
  ] = useState(false);

  const [
    copied,
    setCopied,
  ] = useState(false);


  /* -------------------------------------------------------
     ENVIRONMENT
  ------------------------------------------------------- */

  const embedded = useMemo(
    () => isInAppBrowser(),
    []
  );

  const android = useMemo(
    () => isAndroid(),
    []
  );

  const ios = useMemo(
    () => isIOS(),
    []
  );


  /* -------------------------------------------------------
     SAFE REDIRECT
  ------------------------------------------------------- */

  const safeRedirect =
    redirectUrl &&
    redirectUrl.startsWith("/") &&
    !redirectUrl.startsWith("//")
      ? redirectUrl
      : null;


  /* =======================================================
     GOOGLE LOGIN
  ======================================================= */

  const handleGoogleSuccess = async (
    credentialResponse: {
      credential?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError("");

      /*
       * Google must return an ID credential.
       */
      if (
        !credentialResponse?.credential
      ) {
        throw new Error(
          "Google did not return a credential."
        );
      }


      /*
       * Send Google credential to Pluten API.
       */
      const response =
        await apiClient.post(
          "/auth/google-login",
          {
            token:
              credentialResponse.credential,
          }
        );


      /*
       * Backend should return the
       * authenticated user.
       */
      const user =
        response.data?.user;


      if (!user) {
        throw new Error(
          "Account session was not returned by the server."
        );
      }


      /*
       * Admin users go to admin.
       *
       * Normal users go to:
       *
       * redirect destination
       * OR
       * homepage
       */
      const destination =
        ADMIN_ROLES.has(user.role)
          ? "/admin"
          : safeRedirect || "/";


      /*
       * Full navigation is intentional.
       *
       * This guarantees the new authenticated
       * session is picked up by the application.
       */
      window.location.replace(
        destination
      );
    } catch (err: any) {
      console.error(
        "[PLUTEN] Google login failed:",
        err
      );

      setError(
        err?.response?.data?.error ||
        err?.message ||
        "Google authentication failed. Please try again."
      );

      setLoading(false);
    }
  };


  /* =======================================================
     OPEN EXTERNAL BROWSER
  ======================================================= */

  const openExternalBrowser = () => {
    const currentUrl =
      buildCurrentUrl();


    /*
     * Safety fallback.
     */
    if (!currentUrl) {
      setBrowserInstructions(true);
      return;
    }


    /* =====================================================
       ANDROID
    ===================================================== */

    if (android) {
      const intentUrl =
        buildChromeIntentUrl(
          currentUrl
        );


      if (intentUrl) {
        console.log(
          "[PLUTEN] Opening Chrome:",
          intentUrl
        );


        /*
         * location.assign() asks the current
         * browser to navigate to the Android
         * external-app intent.
         */
        window.location.assign(
          intentUrl
        );


        /*
         * If Instagram refuses to launch Chrome,
         * expose the manual instructions.
         */
        window.setTimeout(() => {
          setBrowserInstructions(
            true
          );
        }, 1500);


        return;
      }
    }


    /* =====================================================
       IOS / OTHER IN-APP BROWSERS
    ===================================================== */

    /*
     * Websites cannot reliably force Safari from
     * Instagram's iOS WebView.
     *
     * Therefore show the correct manual instructions.
     */
    setBrowserInstructions(true);
  };


  /* =======================================================
     COPY CURRENT URL
  ======================================================= */

  const copyUrl = async () => {
    const currentUrl =
      buildCurrentUrl();


    if (!currentUrl) {
      return;
    }


    try {
      await navigator.clipboard.writeText(
        currentUrl
      );


      setCopied(true);


      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      /*
       * Clipboard may be blocked by
       * Instagram's WebView.
       */
      setBrowserInstructions(
        true
      );
    }
  };


  /* =======================================================
     UI
  ======================================================= */

  return (
    <GoogleOAuthProvider
      clientId={
        process.env
          .NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
      }
    >
      <main
        className={
          styles.premiumContainer
        }
      >

        {/* Background */}

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


        {/* Login card */}

        <section
          className={
            styles.skeuomorphicCard
          }
        >

          {/* Brand */}

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


          {/* Security icon */}

          <div
            className={
              styles.securityIcon
            }
            aria-hidden="true"
          >
            <ShieldCheck
              size={21}
            />
          </div>


          {/* Heading */}

          <h1
            className={
              styles.title
            }
          >
            Welcome back.
          </h1>


          <p
            className={
              styles.description
            }
          >
            {expired
              ? "Your previous session expired. Sign in again to continue."
              : "One secure sign-in to your products, library and account."}
          </p>


          {/* Error */}

          {error && (
            <div
              className={
                styles.statusMessage
              }
              role="alert"
            >
              {error}
            </div>
          )}


          {/* =================================================
              INSTAGRAM / IN-APP BROWSER
          ================================================= */}

          {embedded ? (
            <div
              className={
                styles.embeddedNotice
              }
            >

              <strong>
                Open Pluten in your
                browser.
              </strong>


              <span>
                Google sign-in is
                restricted inside
                Instagram's built-in
                browser.
              </span>


              {!browserInstructions ? (
                <>
                  <button
                    type="button"
                    className={
                      styles.browserButton
                    }
                    onClick={
                      openExternalBrowser
                    }
                  >
                    Continue in browser

                    <ExternalLink
                      size={15}
                    />
                  </button>


                  <button
                    type="button"
                    className={
                      styles.browserSecondary
                    }
                    onClick={() =>
                      setBrowserInstructions(
                        true
                      )
                    }
                  >
                    Show instructions
                  </button>
                </>
              ) : (

                /* ===========================================
                   MANUAL INSTRUCTIONS
                =========================================== */

                <div
                  className={
                    styles.browserInstructions
                  }
                >

                  <p>
                    {android
                      ? "If Instagram did not open Chrome, use Instagram's menu and choose Open in browser."
                      : ios
                      ? "Instagram does not always allow websites to force Safari open."
                      : "Open this page in your normal browser to continue."}
                  </p>


                  <ol>

                    <li>
                      Tap the{" "}
                      <strong>
                        •••
                      </strong>{" "}
                      menu in
                      Instagram.
                    </li>


                    <li>
                      Choose{" "}
                      <strong>
                        Open in browser
                      </strong>
                      .
                    </li>


                    <li>
                      Complete Google
                      sign-in in Chrome
                      or Safari.
                    </li>

                  </ol>


                  {/* Copy URL */}

                  <button
                    type="button"
                    className={
                      styles.browserButton
                    }
                    onClick={
                      copyUrl
                    }
                  >

                    {copied ? (
                      <>
                        <Check
                          size={15}
                        />

                        Link copied
                      </>
                    ) : (
                      <>
                        <Copy
                          size={15}
                        />

                        Copy link
                      </>
                    )}

                  </button>

                </div>
              )}

            </div>
          ) : (

            /* =================================================
               NORMAL BROWSER GOOGLE LOGIN
            ================================================= */

            <div
              className={
                styles.googleWrap
              }
              aria-busy={loading}
            >

              {loading ? (
                <Loader2
                  className="pluten-login-spinner"
                  size={28}
                />
              ) : (
                <GoogleLogin
                  onSuccess={
                    handleGoogleSuccess
                  }
                  onError={() =>
                    setError(
                      "Google authentication failed. Please try again."
                    )
                  }
                  useOneTap={false}
                  width="320"
                />
              )}

            </div>
          )}


          {/* Footer */}

          <p
            className={
              styles.footerNote
            }
          >
            Secure account access ·
            Pluten
          </p>

        </section>

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
        <main className="pluten-auth-fallback">
          <Loader2
            className="pluten-login-spinner"
            size={32}
          />
        </main>
      }
    >
      <LoginEngine />
    </Suspense>
  );
}
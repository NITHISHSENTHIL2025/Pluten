"use client";

import {
  Suspense,
  useMemo,
  useState,
} from "react";
import {
  ExternalLink,
  Loader2,
  ShieldCheck,
  Copy,
  Check,
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

function getUserAgent() {
  if (
    typeof navigator === "undefined"
  ) {
    return "";
  }

  return (
    navigator.userAgent ||
    ""
  );
}

function isInAppBrowser() {
  const ua = getUserAgent();

  return /Instagram|FBAN|FBAV|FB_IAB|Threads|Line\//i.test(
    ua
  );
}

function isAndroid() {
  return /Android/i.test(
    getUserAgent()
  );
}

function isIOS() {
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

function buildCurrentUrl() {
  if (
    typeof window === "undefined"
  ) {
    return "";
  }

  return window.location.href;
}

function buildChromeIntentUrl(
  currentUrl: string
) {
  try {
    const url = new URL(
      currentUrl
    );

    return [
      `intent://${url.host}${url.pathname}${url.search}${url.hash}`,
      "#Intent",
      "scheme=https",
      "package=com.android.chrome",
      "end",
    ].join(";");
  } catch {
    return "";
  }
}

function LoginEngine() {
  const searchParams =
    useSearchParams();

  const redirectUrl =
    searchParams.get("redirect");

  const expired =
    searchParams.get("expired");

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

  const safeRedirect =
    redirectUrl &&
    redirectUrl.startsWith("/") &&
    !redirectUrl.startsWith("//")
      ? redirectUrl
      : null;

  const handleGoogleSuccess =
    async (
      credentialResponse: {
        credential?: string;
      }
    ) => {
      try {
        setLoading(true);
        setError("");

        if (
          !credentialResponse?.credential
        ) {
          throw new Error(
            "Google did not return a credential."
          );
        }

        const response =
          await apiClient.post(
            "/auth/google-login",
            {
              token:
                credentialResponse.credential,
            }
          );

        const user =
          response.data?.user;

        if (!user) {
          throw new Error(
            "Account session was not returned by the server."
          );
        }

        const destination =
          ADMIN_ROLES.has(
            user.role
          )
            ? "/admin"
            : safeRedirect || "/";

        window.location.replace(
          destination
        );
      } catch (err: any) {
        console.error(
          "[PLUTEN] Google login failed:",
          err
        );

        setError(
          err?.response?.data
            ?.error ||
            err?.message ||
            "Google authentication failed. Please try again."
        );

        setLoading(false);
      }
    };

  const openExternalBrowser =
    () => {
      const currentUrl =
        buildCurrentUrl();

      if (!currentUrl) {
        setBrowserInstructions(
          true
        );
        return;
      }

      /*
       * Android Instagram/Facebook:
       *
       * Ask Android to launch Chrome
       * rather than loading the URL back
       * inside the Instagram WebView.
       */
      if (android) {
        const intentUrl =
          buildChromeIntentUrl(
            currentUrl
          );

        if (intentUrl) {
          window.location.href =
            intentUrl;

          /*
           * If Instagram refuses the intent,
           * reveal manual instructions.
           */
          window.setTimeout(
            () => {
              setBrowserInstructions(
                true
              );
            },
            1200
          );

          return;
        }
      }

      /*
       * iOS Instagram:
       *
       * Safari cannot be reliably forced from
       * an embedded browser by website JS.
       * Give the user the correct manual path.
       */
      setBrowserInstructions(
        true
      );
    };

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
      setBrowserInstructions(
        true
      );
    }
  };

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

        <section
          className={
            styles.skeuomorphicCard
          }
        >
          <div
            className={styles.brand}
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

          <div
            className={
              styles.securityIcon
            }
            aria-hidden="true"
          >
            <ShieldCheck size={21} />
          </div>

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

                  <button
                    type="button"
                    className={
                      styles.browserButton
                    }
                    onClick={copyUrl}
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
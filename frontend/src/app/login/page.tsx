"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import PlutenMotion from "@/components/system/PlutenMotion";
import styles from "./login.module.css";

const ADMIN_ROLES = new Set([
  "SUPER_ADMIN",
  "PRODUCT_MANAGER",
  "FINANCE_MANAGER",
  "CUSTOMER_SUPPORT",
]);

function getUserAgent(): string {
  return typeof navigator === "undefined" ? "" : navigator.userAgent || "";
}

function isInAppBrowser(): boolean {
  return /Instagram|FBAN|FBAV|FB_IAB|Threads|Line\//i.test(getUserAgent());
}

function isAndroid(): boolean {
  return /Android/i.test(getUserAgent());
}

function isIOS(): boolean {
  const ua = getUserAgent();
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && typeof navigator !== "undefined" && "ontouchend" in document);
}

function buildCurrentUrl(): string {
  return typeof window === "undefined" ? "" : window.location.href;
}

function buildChromeIntentUrl(currentUrl: string): string {
  try {
    const url = new URL(currentUrl);
    const cleanPath = `${url.pathname}${url.search}${url.hash}`.replace(/;$/, "");
    const targetUrl = `https://${url.host}${cleanPath}`;
    const fallbackUrl = encodeURIComponent(targetUrl);
    return `intent://${url.host}${cleanPath}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallbackUrl};end`;
  } catch {
    return "";
  }
}

function LoginEngine() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const expired = searchParams.get("expired");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [browserInstructions, setBrowserInstructions] = useState(false);
  const [copied, setCopied] = useState(false);

  const embedded = useMemo(() => isInAppBrowser(), []);
  const android = useMemo(() => isAndroid(), []);
  const ios = useMemo(() => isIOS(), []);

  const safeRedirect = redirectUrl && redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")
    ? redirectUrl
    : null;

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    try {
      setLoading(true);
      setError("");

      if (!credentialResponse?.credential) {
        throw new Error("Google did not return a credential.");
      }

      const response = await apiClient.post("/auth/google-login", {
        token: credentialResponse.credential,
      });

      const user = response.data?.user;
      if (!user) throw new Error("Account session was not returned by the server.");

      const destination = ADMIN_ROLES.has(user.role) ? "/admin" : safeRedirect || "/";
      window.location.replace(destination);
    } catch (err: any) {
      console.error("[PLUTEN] Google login failed:", err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Google authentication failed. Please try again.",
      );
      setLoading(false);
    }
  };

  const openExternalBrowser = () => {
    const currentUrl = buildCurrentUrl();
    if (!currentUrl) {
      setBrowserInstructions(true);
      return;
    }

    if (android) {
      const intentUrl = buildChromeIntentUrl(currentUrl);
      if (intentUrl) {
        window.location.assign(intentUrl);
        window.setTimeout(() => setBrowserInstructions(true), 1500);
        return;
      }
    }

    setBrowserInstructions(true);
  };

  const copyUrl = async () => {
    const currentUrl = buildCurrentUrl();
    if (!currentUrl) return;

    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setBrowserInstructions(true);
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
      <main className={styles.premiumContainer}>
        <section className={styles.authShell}>
          <header className={styles.authHeader}>
            <Link href="/" className={styles.brand} aria-label="Pluten home">
              <img src="/favicon.ico" alt="" className={styles.brandLogo} />
              <span className={styles.brandName}>PLUTEN</span>
            </Link>

            <span className={styles.secureBadge}>
              <ShieldCheck size={14} /> Secure sign-in
            </span>
          </header>

          <div className={styles.authBody}>
            <p className={styles.eyebrow}>ACCOUNT ACCESS</p>
            <h1 className={styles.title}>Welcome back.</h1>
            <p className={styles.description}>
              {expired
                ? "Your previous session ended. Sign in again to continue securely."
                : "Sign in once to access your products, library and Pluten account."}
            </p>

            {error ? (
              <div className={styles.statusMessage} role="alert">
                {error}
              </div>
            ) : null}

            {embedded ? (
              <div className={styles.embeddedNotice}>
                <strong>Continue in your browser</strong>
                <span>Google sign-in is restricted inside some in-app browsers.</span>

                {!browserInstructions ? (
                  <div className={styles.embeddedActions}>
                    <button type="button" className={styles.browserButton} onClick={openExternalBrowser}>
                      Open browser <ExternalLink size={15} />
                    </button>
                    <button type="button" className={styles.browserSecondary} onClick={() => setBrowserInstructions(true)}>
                      Show steps
                    </button>
                  </div>
                ) : (
                  <div className={styles.browserInstructions}>
                    <p>
                      {android
                        ? "Use the app menu and choose Open in browser if Chrome did not open automatically."
                        : ios
                          ? "Use the app menu and choose Open in browser, then continue in Safari."
                          : "Open this page in your normal browser to continue."}
                    </p>
                    <ol>
                      <li>Open the <strong>•••</strong> menu.</li>
                      <li>Choose <strong>Open in browser</strong>.</li>
                      <li>Complete Google sign-in.</li>
                    </ol>
                    <button type="button" className={styles.browserButton} onClick={copyUrl}>
                      {copied ? <><Check size={15} /> Link copied</> : <><Copy size={15} /> Copy link</>}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.googleArea}>
                <span className={styles.googleLabel}>CONTINUE WITH GOOGLE</span>
                <div className={styles.googleWrap} aria-busy={loading}>
                  {loading ? (
                    <div className={styles.loadingState} role="status" aria-live="polite">
                      <PlutenMotion state="processing" size={34} className={styles.inlineMotion} label="Signing in" />
                      <span>Signing you in…</span>
                    </div>
                  ) : (
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError("Google authentication failed. Please try again.")}
                      useOneTap={false}
                      width="280"
                    />
                  )}
                </div>
              </div>
            )}

            <p className={styles.footerNote}>Secure Google authentication · Pluten</p>
          </div>
        </section>
      </main>
    </GoogleOAuthProvider>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="pluten-auth-fallback" role="status" aria-live="polite">
          <PlutenMotion state="loading" size={82} label="Loading sign in" priority="high" />
        </main>
      }
    >
      <LoginEngine />
    </Suspense>
  );
}

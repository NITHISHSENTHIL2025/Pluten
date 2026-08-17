"use client";

import { Suspense, useMemo, useState } from 'react';
import { Loader2, ShieldCheck, ExternalLink } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import styles from './login.module.css';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'PRODUCT_MANAGER', 'FINANCE_MANAGER', 'CUSTOMER_SUPPORT']);

function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Instagram|FBAN|FBAV|FB_IAB|Threads|Line\//i.test(ua);
}

function LoginEngine() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const expired = searchParams.get('expired');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const embedded = useMemo(() => isInAppBrowser(), []);
  const safeRedirect = redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//') ? redirectUrl : null;

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setError('');

      if (!credentialResponse?.credential) {
        throw new Error('Google did not return a credential.');
      }

      const response = await apiClient.post('/auth/google-login', {
        token: credentialResponse.credential,
      });

      const user = response.data?.user;
      if (!user) throw new Error('Account session was not returned by the server.');

      const destination = ADMIN_ROLES.has(user.role) ? '/admin' : safeRedirect || '/';
      window.location.replace(destination);
    } catch (err: any) {
      console.error('[PLUTEN] Google login failed:', err);
      setError(err?.response?.data?.error || err?.message || 'Google authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const openExternalBrowser = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <main className={styles.premiumContainer}>
        <div className={styles.backgroundGrid} aria-hidden="true" />
        <div className={styles.backgroundGlow} aria-hidden="true" />
        <section className={styles.skeuomorphicCard}>
          <div className={styles.brand}>
            <img src="/favicon.ico" alt="Pluten" className={styles.brandLogo} />
            <span className={styles.brandName}>PLUTEN</span>
          </div>

          <div className={styles.securityIcon} aria-hidden="true"><ShieldCheck size={21} /></div>
          <h1 className={styles.title}>Welcome back.</h1>
          <p className={styles.description}>
            {expired
              ? 'Your previous session expired. Sign in again to continue.'
              : 'One secure sign-in to your products, library and account.'}
          </p>

          {error && <div className={styles.statusMessage} role="alert">{error}</div>}

          {embedded ? (
            <div className={styles.embeddedNotice}>
              <strong>Open Pluten in your browser.</strong>
              <span>Instagram’s built-in browser can restrict secure Google sign-in.</span>
              <button type="button" className={styles.browserButton} onClick={openExternalBrowser}>
                Continue in browser <ExternalLink size={15} />
              </button>
            </div>
          ) : (
            <div className={styles.googleWrap} aria-busy={loading}>
              {loading ? (
                <Loader2 className="pluten-login-spinner" size={28} />
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google authentication failed. Please try again.')}
                  useOneTap={false}
                  width="320"
                />
              )}
            </div>
          )}

          <p className={styles.footerNote}>Secure account access · Pluten</p>
        </section>
      </main>
    </GoogleOAuthProvider>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="pluten-auth-fallback"><Loader2 className="pluten-login-spinner" size={32} /></main>}>
      <LoginEngine />
    </Suspense>
  );
}

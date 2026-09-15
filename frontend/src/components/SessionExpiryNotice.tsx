"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SESSION_EXPIRED_EVENT } from "@/lib/apiClient";
import styles from "./SessionExpiryNotice.module.css";

export default function SessionExpiryNotice() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/");

  useEffect(() => {
    const onExpired = () => {
      const target = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      setRedirectPath(target.startsWith("/") && !target.startsWith("//") ? target : "/");
      setVisible(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/login")) setVisible(false);
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!visible || pathname.startsWith("/login")) return null;

  const loginHref = `/login?expired=1&redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <div className={styles.backdrop} role="presentation">
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="session-expired-title">
        <div className={styles.topline}>
          <div className={styles.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.ico" alt="" />
            <span>PLUTEN</span>
          </div>
          <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss" className={styles.close}>
            <X size={16} />
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.kicker}>ACCOUNT SECURITY</p>
          <h2 id="session-expired-title">Your session ended.</h2>
          <p>Your local browser changes are still here. Sign in again to continue securely from this page.</p>
        </div>

        <div className={styles.actions}>
          <Link href={loginHref} className={styles.primary}>Sign in again</Link>
          <button type="button" onClick={() => setVisible(false)} className={styles.secondary}>Not now</button>
        </div>
      </section>
    </div>
  );
}

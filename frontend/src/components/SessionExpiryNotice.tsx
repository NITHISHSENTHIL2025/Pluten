"use client";

import Link from "next/link";
import { LogIn, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SESSION_EXPIRED_EVENT } from "@/lib/apiClient";
import styles from "./SessionExpiryNotice.module.css";

export default function SessionExpiryNotice() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onExpired = () => setVisible(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/login")) setVisible(false);
  }, [pathname]);

  if (!visible || pathname.startsWith("/login")) return null;

  const redirect = encodeURIComponent(`${pathname}${typeof window !== "undefined" ? window.location.search : ""}`);

  return (
    <aside role="status" aria-live="polite" className={styles.notice}>
      <div className={styles.icon} aria-hidden="true"><LogIn size={17} /></div>
      <div className={styles.copy}>
        <strong>Sign in to continue</strong>
        <span>Your local changes are safe. Reconnect your Pluten session to continue securely.</span>
      </div>
      <Link href={`/login?redirect=${redirect}`} className={styles.action}>Sign in</Link>
      <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss" className={styles.close}><X size={15} /></button>
    </aside>
  );
}

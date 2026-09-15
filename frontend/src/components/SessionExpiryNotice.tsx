"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SESSION_EXPIRED_EVENT } from "@/lib/apiClient";
import styles from "./SessionExpiryNotice.module.css";

export default function SessionExpiryNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onExpired = () => setVisible(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  if (!visible) return null;

  return (
    <div role="alertdialog" aria-modal="false" aria-label="Session expired" className={styles.notice}>
      <div className={styles.icon} aria-hidden="true">!</div>
      <div className={styles.copy}>
        <strong>Your session needs attention.</strong>
        <span>Your current changes remain in this browser. Sign in again to continue saving securely.</span>
        <Link href="/login" className={styles.action}>Sign in again →</Link>
      </div>
      <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss session notice" className={styles.close}>×</button>
    </div>
  );
}

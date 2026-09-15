"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PlutenMotion from "./PlutenMotion";
import styles from "./NetworkStatusGate.module.css";

export default function NetworkStatusGate() {
  const pathname = usePathname();
  const router = useRouter();
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const sync = () => {
      const isOffline = !navigator.onLine;
      setOffline(isOffline);
      if (!isOffline) {
        setChecking(false);
        setStatus("");
      }
    };

    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    if (!offline) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [offline]);

  if (!offline || pathname === "/offline") return null;

  const retry = () => {
    if (checking) return;
    setChecking(true);
    setStatus("Checking your connection…");
    window.setTimeout(() => {
      if (navigator.onLine) {
        setOffline(false);
        setStatus("");
        setChecking(false);
        router.refresh();
        return;
      }
      setStatus("Still offline. Reconnect to Wi-Fi or mobile data and try again.");
      setChecking(false);
    }, 620);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="pluten-offline-title">
      <Link href="/" className={styles.brand} aria-label="Pluten home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.ico" alt="" />
        <span>PLUTEN</span>
      </Link>

      <section className={styles.shell}>
        <PlutenMotion
          state={checking ? "retry" : "offline"}
          size={112}
          className={styles.motion}
          label={checking ? "Checking connection" : "Offline"}
          priority="high"
        />
        <p className={styles.kicker}>PLUTEN / CONNECTION</p>
        <h1 id="pluten-offline-title" className={styles.title}>You're offline.</h1>
        <p className={styles.copy}>
          This page is still here. Reconnect to continue loading products, your library, portfolio data or checkout.
        </p>
        <div className={styles.status} aria-live="polite">{status}</div>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={retry} disabled={checking}>
            {checking ? "Checking…" : "Try again"}
          </button>
          <button type="button" className={styles.secondary} onClick={() => setOffline(false)}>
            Keep this page open
          </button>
        </div>
      </section>
    </div>
  );
}

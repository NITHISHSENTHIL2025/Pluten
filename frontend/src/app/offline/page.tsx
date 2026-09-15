"use client";

import Link from "next/link";
import PlutenMotion from "@/components/system/PlutenMotion";
import SystemStateShell from "@/components/system/SystemStateShell";
import styles from "@/components/system/SystemStateShell.module.css";

export default function OfflinePage() {
  return (
    <SystemStateShell
      kicker="PLUTEN / CONNECTION"
      title="You're offline."
      description="Reconnect to Wi-Fi or mobile data to continue. This page can stay open while your connection returns."
      visual={<PlutenMotion state="offline" size={112} label="Offline" priority="high" />}
      actions={
        <>
          <button type="button" className={styles.primary} onClick={() => window.location.reload()}>Try again</button>
          <Link className={styles.secondary} href="/">Pluten home</Link>
        </>
      }
      headerMeta="Connection"
      footerLeft="Pluten · Offline"
    />
  );
}

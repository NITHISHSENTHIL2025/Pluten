"use client";

import Link from "next/link";
import PlutenMotion from "@/components/system/PlutenMotion";
import SystemStateShell from "@/components/system/SystemStateShell";
import styles from "@/components/system/SystemStateShell.module.css";

export default function ServiceUnavailablePage() {
  return (
    <SystemStateShell
      kicker="PLUTEN / SERVICE"
      title="Pluten is temporarily unavailable."
      description="Your internet connection is working, but a Pluten service could not respond. Your account and purchases remain safe."
      visual={<PlutenMotion state="error" size={112} label="Service unavailable" priority="high" />}
      actions={
        <>
          <button type="button" className={styles.primary} onClick={() => window.location.reload()}>Try again</button>
          <Link className={styles.secondary} href="/support">Get support</Link>
        </>
      }
      headerMeta="Service unavailable"
      footerLeft="Pluten · Service status"
    />
  );
}

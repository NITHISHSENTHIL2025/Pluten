"use client";

import { useEffect, useState } from "react";
import PlutenMotion from "./PlutenMotion";
import SystemStateShell from "./SystemStateShell";
import styles from "./SystemStateShell.module.css";

interface ErrorBoundaryViewProps {
  error: Error & { digest?: string; requestId?: string };
  reset: () => void;
  global?: boolean;
}

export default function ErrorBoundaryView({ error, reset, global = false }: ErrorBoundaryViewProps) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    console.error(global ? "[PLUTEN] Global UI error" : "[PLUTEN] UI error boundary", error);
  }, [error, global]);

  const retry = () => {
    if (retrying) return;
    setRetrying(true);
    window.setTimeout(() => reset(), 620);
  };

  const reference = error.requestId || error.digest;

  return (
    <SystemStateShell
      kicker="PLUTEN / SYSTEM"
      title={retrying ? "Trying again." : "Something went wrong."}
      description={
        retrying
          ? "Reopening this part of Pluten now."
          : "The page hit an unexpected problem. Your account, purchases and saved server data remain protected."
      }
      visual={
        <PlutenMotion
          state={retrying ? "retry" : "error"}
          size={116}
          label={retrying ? "Retrying" : "Error"}
          priority="high"
        />
      }
      actions={
        <>
          <button type="button" className={styles.primary} onClick={retry} disabled={retrying}>
            {retrying ? "Retrying…" : "Try again"}
          </button>
          <a className={styles.secondary} href="/">Return home</a>
        </>
      }
      details={
        reference ? (
          <details>
            <summary>Technical reference</summary>
            <p>{reference}</p>
          </details>
        ) : null
      }
      headerMeta="Recovery"
      footerLeft="Pluten · Recovery"
    />
  );
}

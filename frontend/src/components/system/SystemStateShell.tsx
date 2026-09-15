import type { ReactNode } from "react";
import styles from "./SystemStateShell.module.css";

interface SystemStateShellProps {
  kicker: string;
  title: string;
  description: ReactNode;
  visual?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  details?: ReactNode;
  headerMeta?: string;
  footerLeft?: string;
  footerRight?: string;
  statusCode?: string;
}

export default function SystemStateShell({
  kicker,
  title,
  description,
  visual,
  actions,
  meta,
  details,
  headerMeta = "System state",
  footerLeft = "Pluten",
  footerRight = "Your account and purchases remain protected.",
  statusCode,
}: SystemStateShellProps) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.brand} aria-label="Pluten home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.ico" alt="" />
          <span>PLUTEN</span>
        </a>
        <span className={styles.headerMeta}>{headerMeta}</span>
      </header>

      <section className={styles.main}>
        <div className={styles.content}>
          {statusCode ? <div className={styles.statusCode}>{statusCode}</div> : null}
          {visual ? <div className={styles.visual}>{visual}</div> : null}
          <p className={styles.kicker}>{kicker}</p>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.copy}>{description}</div>
          {meta ? <div className={styles.meta}>{meta}</div> : null}
          {actions ? <div className={styles.actions}>{actions}</div> : null}
          {details ? <div className={styles.details}>{details}</div> : null}
        </div>
      </section>

      <footer className={styles.footer}>
        <span>{footerLeft}</span>
        <span>{footerRight}</span>
      </footer>
    </main>
  );
}


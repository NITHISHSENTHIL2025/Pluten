import Link from "next/link";
import SystemStateShell from "@/components/system/SystemStateShell";
import styles from "@/components/system/SystemStateShell.module.css";

export default function NotFound() {
  return (
    <SystemStateShell
      kicker="PLUTEN / 404"
      statusCode="404"
      title="This page isn't here."
      description="The link may have changed, expired, or never existed. Your Pluten account and purchases are unaffected."
      actions={
        <>
          <Link className={styles.primary} href="/">Go to Pluten home</Link>
          <Link className={styles.secondary} href="/#products">Explore products</Link>
        </>
      }
      headerMeta="Page not found"
      footerLeft="Pluten · 404"
      footerRight="Useful things, kept simple."
    />
  );
}

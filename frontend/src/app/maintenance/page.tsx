import Link from "next/link";
import PlutenMotion from "@/components/system/PlutenMotion";
import SystemStateShell from "@/components/system/SystemStateShell";
import styles from "@/components/system/SystemStateShell.module.css";

export const metadata = { title: "Maintenance", robots: { index: false, follow: false } };

export default function MaintenancePage() {
  return (
    <SystemStateShell
      kicker="PLUTEN / SERVICE"
      title="We're making Pluten better."
      description="A short maintenance window is in progress. Your account, purchases and published portfolio remain safe."
      visual={<PlutenMotion state="processing" size={112} label="Maintenance in progress" priority="high" />}
      actions={<Link className={styles.primary} href="/">Check Pluten again</Link>}
      headerMeta="Maintenance"
      footerLeft="Pluten · Service status"
      footerRight="We'll be back as soon as the update is complete."
    />
  );
}

import PlutenMotion from "@/components/system/PlutenMotion";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <main className={styles.page} role="status" aria-live="polite">
      <div className={styles.inner}>
        <PlutenMotion state="loading" size={90} className={styles.motion} label="Loading Pluten" priority="high" />
        <span className={styles.label}>Loading Pluten</span>
      </div>
    </main>
  );
}

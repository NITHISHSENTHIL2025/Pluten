// frontend/src/app/admin/settings/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { LogOut, ArrowLeft, Settings, ShieldAlert, Loader2 } from "lucide-react";
import styles from "../admin.module.css";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Secure logout network fault:", error);
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <main className={styles.settingsPage}>
      <div className={styles.settingsShell}>
        <header className={styles.settingsHeader}>
          <div>
            <div className={styles.pageEyebrow}>PLUTEN / SYSTEM</div>
            <h1 className={styles.pageTitle}>
              <Settings size={22} /> Settings
            </h1>
          </div>
          <button type="button" onClick={() => router.back()} className={styles.secondaryButton}>
            <ArrowLeft size={17} /> Back
          </button>
        </header>

        <section className={styles.settingsCard}>
          <div className={styles.settingsCardTop}>
            <div className={styles.securityIcon}><ShieldAlert size={20} /></div>
            <div>
              <h2>Session security</h2>
              <p>Sign out of the secure admin session. Authentication is managed by the server-side HttpOnly session cookie.</p>
            </div>
          </div>

          <button type="button" onClick={handleLogout} disabled={loggingOut} className={styles.dangerButton}>
            {loggingOut ? <Loader2 size={18} className={styles.spin} /> : <LogOut size={18} />}
            {loggingOut ? "Signing out" : "Secure logout"}
          </button>
        </section>
      </div>
    </main>
  );
}

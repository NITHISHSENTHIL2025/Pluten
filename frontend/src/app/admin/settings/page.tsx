// frontend/src/app/admin/settings/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { LogOut, ArrowLeft, Settings, ShieldAlert, Loader2 } from "lucide-react";

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
    <main className="min-h-[100dvh] bg-[#050505] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-600">
              PLUTEN / SYSTEM
            </div>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight">
              <Settings size={22} />
              Settings
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-neutral-800 px-4 text-sm font-semibold text-neutral-400 hover:text-white sm:self-auto"
          >
            <ArrowLeft size={17} />
            Back
          </button>
        </header>

        <section className="rounded-2xl border border-neutral-900 bg-[#0c0c0c] p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-950 bg-red-950/20 text-red-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Session security</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
                Sign out of the secure admin session. Authentication is managed by the server-side HttpOnly session cookie.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
            {loggingOut ? "Signing out" : "Secure logout"}
          </button>
        </section>
      </div>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Pluten UI error boundary:", error);
  }, [error]);

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-5 py-8 text-white flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-neutral-900 bg-[#0d0d0d] p-6 text-center shadow-2xl sm:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-900/70 bg-red-950/25 text-red-400">
          <AlertTriangle size={30} />
        </div>

        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-600">
          PLUTEN / SYSTEM
        </div>

        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          Something went wrong.
        </h1>

        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Pluten hit an unexpected error. Your account and purchases remain protected.
        </p>

        <div className="mt-8 grid gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-black transition hover:bg-neutral-200"
          >
            <RefreshCw size={17} />
            Try again
          </button>

          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-neutral-800 px-5 text-sm font-semibold text-neutral-300 transition hover:border-neutral-700 hover:text-white"
          >
            <Home size={17} />
            Return to Pluten
          </Link>
        </div>
      </section>
    </main>
  );
}

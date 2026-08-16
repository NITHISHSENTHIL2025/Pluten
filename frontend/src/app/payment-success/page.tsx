"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  Package,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [status, setStatus] = useState<"VERIFYING" | "SUCCESS" | "PENDING" | "ERROR">("VERIFYING");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);

  const verifyOrder = useCallback(async () => {
    if (!orderId) {
      setStatus("ERROR");
      setMessage("This payment link is missing the order reference.");
      return false;
    }

    try {
      await apiClient.post("/payments/verify", { orderId });
      setStatus("SUCCESS");
      setMessage("");
      return true;
    } catch (error: any) {
      const responseStatus = error?.response?.status;
      const apiError = error?.response?.data?.error;

      if (responseStatus === 409) {
        setStatus("PENDING");
        setMessage(
          "Your payment is still being confirmed. We will keep checking automatically."
        );
        return false;
      }

      if (responseStatus === 401 || responseStatus === 403) {
        router.replace(`/login?redirect=${encodeURIComponent(`/payment-success?order_id=${orderId}`)}`);
        return false;
      }

      setStatus("ERROR");
      setMessage(
        apiError ||
          "We could not verify the transaction right now. Your payment status is protected and will not be guessed."
      );
      return false;
    }
  }, [orderId, router]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      const success = await verifyOrder();
      if (cancelled || success) return;

      setAttempt((current) => current + 1);
    };

    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [verifyOrder]);

  useEffect(() => {
    if (status !== "PENDING" || attempt >= 5) return;

    const timer = setTimeout(() => {
      verifyOrder();
    }, 2500);

    return () => clearTimeout(timer);
  }, [attempt, status, verifyOrder]);

  const handleRetry = async () => {
    setRetrying(true);
    setStatus("VERIFYING");
    setMessage("");
    setAttempt(0);
    await verifyOrder();
    setRetrying(false);
  };

  return (
    <main className="min-h-[100dvh] bg-[#050505] px-4 py-6 text-white flex items-center justify-center">
      <section className="w-full max-w-lg rounded-2xl border border-neutral-900 bg-[#0c0c0c] p-5 shadow-2xl sm:p-8">
        <div className="mb-6 text-center sm:mb-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-600">
            PLUTEN / PAYMENT
          </div>
        </div>

        {status === "VERIFYING" && (
          <div className="py-12 text-center">
            <Loader2 size={42} className="mx-auto animate-spin text-neutral-400" />
            <h1 className="mt-6 text-xl font-black uppercase tracking-[0.08em] sm:text-2xl">
              Securing your purchase
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-neutral-500">
              Verifying the transaction with Cashfree before unlocking your library.
            </p>
          </div>
        )}

        {status === "PENDING" && (
          <div className="py-8 text-center sm:py-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-900/70 bg-amber-950/20 text-amber-400">
              <ShieldCheck size={30} />
            </div>
            <h1 className="mt-6 text-xl font-black uppercase tracking-[0.06em] sm:text-2xl">
              Payment confirmation pending
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-neutral-500">
              {message}
            </p>
            {attempt < 5 ? (
              <div className="mt-5 text-xs text-neutral-700">
                Checking again automatically…
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-neutral-800 px-5 text-sm font-bold text-white disabled:opacity-50"
              >
                {retrying ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
                Check again
              </button>
            )}
          </div>
        )}

        {status === "ERROR" && (
          <div className="py-8 text-center sm:py-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-950 bg-red-950/20 text-red-400">
              <AlertCircle size={30} />
            </div>
            <h1 className="mt-6 text-xl font-black uppercase tracking-[0.06em] sm:text-2xl">
              Verification needs attention
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-neutral-500">
              {message}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-black disabled:opacity-50"
            >
              {retrying ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
              Retry verification
            </button>
          </div>
        )}

        {status === "SUCCESS" && (
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-900 bg-emerald-950/20 text-emerald-400">
              <CheckCircle size={42} />
            </div>

            <h1 className="mt-6 text-2xl font-black uppercase tracking-[0.04em] sm:text-3xl">
              Payment successful
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-500">
              Your purchase has been verified and the digital asset is now available in your Pluten library.
            </p>

            <div className="mt-7 rounded-xl border border-neutral-900 bg-black p-4 text-left">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                Order reference
              </div>
              <div className="mt-2 break-all font-mono text-xs font-semibold text-neutral-300">
                {orderId}
              </div>
            </div>

            <div className="mt-7 grid gap-3">
              <button
                type="button"
                onClick={() => router.push("/library")}
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:bg-neutral-200"
              >
                <Package size={18} />
                Access digital library
              </button>

              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-neutral-800 px-5 text-sm font-semibold text-neutral-400 transition hover:border-neutral-700 hover:text-white"
              >
                Return to storefront
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center text-neutral-500">
          <Loader2 size={34} className="animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

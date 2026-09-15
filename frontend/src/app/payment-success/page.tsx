"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { formatIndiaDateTime } from "@/lib/format";
import PlutenMotion, { type PlutenMotionState } from "@/components/system/PlutenMotion";
import styles from "./payment.module.css";

interface VerifiedOrder {
  id?: string;
  productId?: string;
  totalAmount?: number | string;
  createdAt?: string;
  status?: string;
}

type Phase = "VERIFYING" | "PENDING" | "RETRYING" | "SUCCESS" | "ERROR";
type VerifyResult =
  | { kind: "SUCCESS"; order?: VerifiedOrder }
  | { kind: "PENDING"; message: string }
  | { kind: "ERROR"; message: string; reference?: string; terminal?: boolean; productId?: string };

const AUTO_DELAYS = [0, 1600, 2600, 4000, 6000];

function formatAmount(value: number | string | undefined) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function PaymentSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("order_id")?.trim() || "";

  const [phase, setPhase] = useState<Phase>("VERIFYING");
  const [message, setMessage] = useState("Confirming the transaction before unlocking your library.");
  const [attempt, setAttempt] = useState(0);
  const [autoFinished, setAutoFinished] = useState(false);
  const [order, setOrder] = useState<VerifiedOrder | null>(null);
  const [productTitle, setProductTitle] = useState("Your digital product");
  const [reference, setReference] = useState("");
  const [terminalFailure, setTerminalFailure] = useState(false);
  const [failedProductId, setFailedProductId] = useState("");

  const verifyOnce = useCallback(async (): Promise<VerifyResult> => {
    if (!orderId) {
      return { kind: "ERROR", message: "This payment return is missing its order reference." };
    }

    try {
      const response = await apiClient.post("/payments/verify", { orderId });
      return { kind: "SUCCESS", order: response.data?.order };
    } catch (error: any) {
      const statusCode = error?.response?.status;
      const apiStatus = String(error?.response?.data?.status || "").toUpperCase();
      const apiMessage = error?.response?.data?.error;
      const requestId = error?.requestId || error?.response?.headers?.["x-request-id"];

      if (statusCode === 401 || statusCode === 403) {
        router.replace(`/login?expired=1&redirect=${encodeURIComponent(`/payment-success?order_id=${orderId}`)}`);
        return { kind: "PENDING", message: "Reconnecting your secure account session…" };
      }

      if (statusCode === 409 && apiStatus === "PENDING") {
        return {
          kind: "PENDING",
          message: apiMessage || "Your payment is still being confirmed by the payment provider.",
        };
      }

      if (statusCode === 409 && apiStatus === "REVIEW") {
        return {
          kind: "ERROR",
          message: apiMessage || "This payment needs a manual verification before access can be granted.",
          reference: requestId,
        };
      }

      if (statusCode === 409 && apiStatus === "FAILED") {
        return {
          kind: "ERROR",
          message: apiMessage || "The payment was not completed. No product access was granted.",
          reference: requestId,
          terminal: true,
          productId: typeof error?.response?.data?.productId === "string" ? error.response.data.productId : undefined,
        };
      }

      return {
        kind: "ERROR",
        message: apiMessage || "We could not verify this transaction right now.",
        reference: requestId,
      };
    }
  }, [orderId, router]);

  const applyResult = useCallback((result: VerifyResult) => {
    if (result.kind === "SUCCESS") {
      setOrder(result.order || { id: orderId });
      setPhase("SUCCESS");
      setMessage("Your payment is verified and the product is attached to your Pluten account.");
      setReference("");
      setTerminalFailure(false);
      setFailedProductId("");
      return true;
    }

    if (result.kind === "PENDING") {
      setPhase("PENDING");
      setMessage(result.message);
      return false;
    }

    setPhase("ERROR");
    setMessage(result.message);
    setReference(result.reference || "");
    setTerminalFailure(Boolean(result.terminal));
    setFailedProductId(result.productId || "");
    return false;
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (!orderId) {
      setPhase("ERROR");
      setMessage("This payment return is missing its order reference.");
      setAutoFinished(true);
      return;
    }

    const run = async (index: number) => {
      if (cancelled) return;
      setAttempt(index + 1);
      if (index === 0) setPhase("VERIFYING");

      const result = await verifyOnce();
      if (cancelled) return;
      const complete = applyResult(result);
      if (complete || result.kind === "ERROR") {
        setAutoFinished(true);
        return;
      }

      if (index + 1 < AUTO_DELAYS.length) {
        timer = setTimeout(() => run(index + 1), AUTO_DELAYS[index + 1]);
      } else {
        setAutoFinished(true);
      }
    };

    void run(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [applyResult, orderId, verifyOnce]);

  useEffect(() => {
    const productId = order?.productId;
    if (phase !== "SUCCESS" || !productId) return;

    let cancelled = false;
    apiClient.get(`/products/${encodeURIComponent(productId)}`, { skipApiErrorLog: true })
      .then((response) => {
        if (!cancelled && typeof response.data?.title === "string" && response.data.title.trim()) {
          setProductTitle(response.data.title.trim());
        }
      })
      .catch(() => null);

    return () => { cancelled = true; };
  }, [order?.productId, phase]);

  const manualRetry = async () => {
    if (phase === "RETRYING") return;
    setPhase("RETRYING");
    setMessage("Checking the same order again. No new payment is being created.");
    setReference("");
    setTerminalFailure(false);
    const [result] = await Promise.all([
      verifyOnce(),
      new Promise((resolve) => window.setTimeout(resolve, 1800)),
    ]);
    applyResult(result);
    setAutoFinished(true);
  };

  const visualState: PlutenMotionState = useMemo(() => {
    if (phase === "SUCCESS") return "success";
    if (phase === "ERROR") return "error";
    if (phase === "RETRYING") return "retry";
    return "processing";
  }, [phase]);

  const title = phase === "SUCCESS"
    ? "Payment confirmed."
    : phase === "ERROR"
      ? "Verification needs attention."
      : phase === "RETRYING"
        ? "Checking again."
        : phase === "PENDING"
          ? "Still confirming your payment."
          : "Confirming your payment.";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Pluten home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.ico" alt="" />
          <span>PLUTEN</span>
        </Link>
        <span className={styles.headerMeta}>Secure payment verification</span>
      </header>

      <section className={styles.main}>
        <div className={styles.content} aria-live="polite">
          <PlutenMotion state={visualState} size={118} className={styles.motion} label={title} priority="high" />
          <p className={styles.kicker}>PLUTEN / PAYMENT</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.copy}>{message}</p>

          {(phase === "VERIFYING" || phase === "PENDING") && (
            <p className={styles.progress}>
              {autoFinished ? "Automatic checks finished. You can safely check this same order again." : `Secure check ${Math.max(1, attempt)} of ${AUTO_DELAYS.length}`}
            </p>
          )}

          {phase === "SUCCESS" && (
            <div className={styles.summary}>
              <div className={styles.row}><span>Product</span><strong>{productTitle}</strong></div>
              <div className={styles.row}><span>Paid</span><strong>{formatAmount(order?.totalAmount)}</strong></div>
              <div className={styles.row}><span>Order</span><strong>{order?.id || orderId}</strong></div>
              <div className={styles.row}><span>Confirmed</span><strong>{formatIndiaDateTime(order?.createdAt)}</strong></div>
            </div>
          )}

          <div className={styles.actions}>
            {phase === "SUCCESS" ? (
              <>
                <button type="button" className={styles.primary} onClick={() => router.push("/library")}>Open your library</button>
                <button type="button" className={styles.secondary} onClick={() => router.push("/#products")}>Continue browsing</button>
              </>
            ) : phase === "ERROR" && terminalFailure ? (
              <>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => router.push(failedProductId ? `/product/${encodeURIComponent(failedProductId)}` : "/#products")}
                >
                  Try payment again
                </button>
                <button type="button" className={styles.secondary} onClick={() => router.push("/support")}>Get support</button>
              </>
            ) : phase === "ERROR" || (phase === "PENDING" && autoFinished) ? (
              <>
                <button type="button" className={styles.primary} onClick={manualRetry}>Check this order again</button>
                <button type="button" className={styles.secondary} onClick={() => router.push("/#products")}>Return to storefront</button>
              </>
            ) : null}
          </div>

          {phase === "PENDING" && (
            <p className={styles.support}>Do not start another payment while this order is still being confirmed.</p>
          )}
          {phase === "ERROR" && (
            <p className={styles.support}>
              If your bank shows a debit and this still does not confirm, <Link href="/support">contact Pluten support</Link>{reference ? ` with reference ${reference}` : ""}.
            </p>
          )}
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Pluten · Secure checkout</span>
        <span>Access is granted only after server-side verification.</span>
      </footer>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <main className={styles.suspense} role="status" aria-live="polite">
        <PlutenMotion state="processing" size={104} label="Preparing payment verification" priority="high" />
      </main>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

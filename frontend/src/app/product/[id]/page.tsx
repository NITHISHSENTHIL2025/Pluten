"use client";

import PlutenSkeleton from "@/components/skeleton/PlutenSkeleton";
import { useEffect, useMemo, useRef, useState, use } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  ShieldCheck,
  User,
  Check,
  AlertCircle,
  Phone,
  X,
  Sparkles,
} from "lucide-react";
// @ts-ignore
import { load } from "@cashfreepayments/cashfree-js";
import { useOffers } from "@/context/OfferContext";
import apiClient from "@/lib/apiClient";
import styles from "./product.module.css";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string | null;
  category: string;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const checkoutRequestIdRef = useRef<string | null>(null);
  const { activeOffers, loadingOffers } = useOffers();

  useEffect(() => {
    let mounted = true;

    const fetchProduct = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await apiClient.get<Product>(`/products/${id}`);
        if (mounted) setProduct(response.data);
      } catch (error: any) {
        console.error("Failed to load product:", error);
        if (mounted) {
          setProduct(null);
          setLoadError(
            error?.response?.data?.error ||
              "This product could not be loaded right now."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProduct();

    return () => {
      mounted = false;
    };
  }, [id]);

  const eligibleOffer = useMemo(() => {
    if (!product) return null;

    return (
      activeOffers
        .filter((offer) => offer.autoApply && offer.status === "ACTIVE")
        .filter((offer) => {
          const applies =
            offer.applyTo === "ALL" ||
            (offer.applyTo === "SELECTED" &&
              offer.products?.some((linked) => linked.id === product.id));

          if (!applies) return false;

          if (
            offer.minOrderAmount !== null &&
            Number(product.price) < Number(offer.minOrderAmount)
          ) {
            return false;
          }

          return true;
        })
        .reduce<typeof activeOffers[number] | null>((best, current) => {
          if (!best) return current;

          const getFinal = (offer: typeof current) => {
            const base = Number(product.price);
            const discount =
              offer.type === "PERCENTAGE"
                ? base * (Number(offer.value) / 100)
                : Number(offer.value);
            return Math.max(0, base - discount);
          };

          return getFinal(current) < getFinal(best) ? current : best;
        }, null) ?? null
    );
  }, [activeOffers, product]);

  const currentPrice = product ? Number(product.price) : 0;
  const discountAmount = eligibleOffer
    ? eligibleOffer.type === "PERCENTAGE"
      ? currentPrice * (Number(eligibleOffer.value) / 100)
      : Number(eligibleOffer.value)
    : 0;

  const finalPrice = Number(
    Math.max(0, currentPrice - discountAmount).toFixed(2)
  );

  const hasDiscount = finalPrice < currentPrice;

  const handleBuyClick = () => {
    if (isCheckingOut || !product) return;
    setCheckoutError(null);
    setPhoneError("");
    setShowPhonePrompt(true);
  };

  const closePhonePrompt = () => {
    if (isCheckingOut) return;
    setShowPhonePrompt(false);
    setPhoneError("");
  };

  const executeCheckout = async (event: FormEvent) => {
    event.preventDefault();
    if (isCheckingOut || !product) return;

    const cleanedPhone = phoneNumber.replace(/\D/g, "");

    if (cleanedPhone.length !== 10) {
      setPhoneError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!checkoutRequestIdRef.current) {
      checkoutRequestIdRef.current = crypto.randomUUID();
    }

    const clientRequestId = checkoutRequestIdRef.current;

    setPhoneError("");
    setCheckoutError(null);
    setIsCheckingOut(true);
    setShowPhonePrompt(false);

    try {
      const cashfree = await load({
        mode: process.env.NODE_ENV === "production" ? "production" : "sandbox",
      });

      if (!cashfree) {
        throw new Error("Payment gateway could not be initialized.");
      }

      const response = await apiClient.post("/payments/create", {
        productId: product.id,
        customerPhone: cleanedPhone,
        clientRequestId,
      });

      const { payment_session_id, order_id, alreadyPurchased } = response.data;

      if (alreadyPurchased && order_id) {
        router.push(
          `/payment-success?order_id=${encodeURIComponent(order_id)}`
        );
        return;
      }

      if (!payment_session_id) {
        throw new Error("Payment session was not returned by the server.");
      }

      await cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_self",
      });
    } catch (error: any) {
      console.error("Gateway initialization error:", error);
      checkoutRequestIdRef.current = null;

      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        router.push(`/login?redirect=/product/${id}`);
        return;
      }

      setCheckoutError(
        error?.response?.data?.error ||
          error?.message ||
          "Payment could not be initialized. Please try again."
      );
      setShowPhonePrompt(true);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.productLayout}>
        <PlutenSkeleton variant="product" />
        <div>
          <PlutenSkeleton variant="text" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <main className="min-h-[100dvh] bg-[#050505] px-6 text-white flex items-center justify-center">
        <section className="w-full max-w-md text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-red-950 bg-red-950/20">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">
            PLUTEN / PRODUCT
          </div>
          <h1 className="mt-2 text-2xl font-black">Product unavailable.</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {loadError || "This asset is no longer available."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-black"
          >
            <ArrowLeft size={17} />
            Back to marketplace
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <nav className={styles.topNav}>
        <button
          type="button"
          className={styles.brand}
          onClick={() => router.push("/")}
          aria-label="Go to Pluten home"
        >
          pluten
        </button>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex min-h-11 items-center gap-2 text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={18} />
          <span>Back to Market</span>
        </button>
      </nav>

      <main className={styles.productLayout}>
        <div>
          <div className={styles.imageContainer}>
            {product.thumbnail ? (
              <img
                src={product.thumbnail}
                alt={product.title}
                className={styles.productImage}
              />
            ) : (
              <div className={styles.noImage}>No Preview Available</div>
            )}
          </div>

          <div className="mt-8">
            <h1 className={styles.title}>{product.title}</h1>

            <div className={styles.vendorInfo}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800">
                <User size={16} />
              </div>
              <span className="font-medium text-white">Pluten Network</span>
              <Check size={16} color="#00ff00" />
              <span className="mx-2 text-neutral-600">•</span>
              <span>{product.category}</span>
            </div>

            <div className={styles.description}>{product.description}</div>
          </div>
        </div>

        <div>
          <div className={styles.checkoutCard}>
            <div className="mb-6 flex flex-col gap-2">
              {hasDiscount ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-4xl font-bold leading-none text-white sm:text-5xl">
                      ₹{finalPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                      <Sparkles size={12} />
                      {eligibleOffer?.type === "PERCENTAGE"
                        ? `${eligibleOffer.value}% OFF`
                        : `₹${Number(eligibleOffer?.value).toLocaleString("en-IN")} OFF`}
                    </span>
                  </div>
                  <span className="text-lg text-neutral-600 line-through">
                    ₹{currentPrice.toLocaleString("en-IN")}
                  </span>
                </>
              ) : (
                <span className="text-4xl font-bold leading-none text-white sm:text-5xl">
                  ₹{currentPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {loadingOffers && (
              <div className="mb-4 flex items-center gap-2 text-xs text-neutral-600">
                <Loader2 size={14} className="animate-spin" />
                Checking current offers…
              </div>
            )}

            {checkoutError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-950 bg-red-950/20 p-3 text-sm text-red-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleBuyClick}
              disabled={isCheckingOut}
              className={styles.buyBtn}
              aria-busy={isCheckingOut}
            >
              {isCheckingOut ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Processing
                </span>
              ) : (
                "Buy this"
              )}
            </button>

            <div className={styles.guarantee}>
              <ShieldCheck size={16} />
              <span>Secure transaction via Cashfree</span>
            </div>
          </div>
        </div>
      </main>

      {showPhonePrompt && (
        <div
          data-modal="true"
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/80 p-3 backdrop-blur-md sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="billing-details-title"
        >
          <div className="max-h-[calc(100dvh-24px)] w-full max-w-md overflow-y-auto rounded-2xl border border-neutral-800 bg-[#0b0b0b] p-5 shadow-2xl sm:max-h-[90dvh] sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">
                  PLUTEN / CHECKOUT
                </div>
                <h2 id="billing-details-title" className="mt-1 text-xl font-black text-white">
                  Billing details
                </h2>
              </div>
              <button
                type="button"
                onClick={closePhonePrompt}
                disabled={isCheckingOut}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800 text-neutral-500 hover:text-white disabled:opacity-40"
                aria-label="Close billing details"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mb-6 rounded-xl border border-neutral-900 bg-black p-4">
              <div className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 text-neutral-500" />
                <p className="text-sm leading-6 text-neutral-500">
                  Enter the 10-digit phone number Cashfree should use for this payment.
                </p>
              </div>
            </div>

            {phoneError && (
              <div className="mb-4 rounded-xl border border-red-950 bg-red-950/20 p-3 text-center text-xs text-red-300">
                {phoneError}
              </div>
            )}

            <form onSubmit={executeCheckout}>
              <label className="block">
                <span className="sr-only">10 digit phone number</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-600">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    pattern="[0-9]*"
                    maxLength={10}
                    placeholder="00000 00000"
                    value={phoneNumber}
                    onChange={(event) => {
                      setPhoneNumber(event.target.value.replace(/\D/g, ""));
                      setPhoneError("");
                    }}
                    disabled={isCheckingOut}
                    autoFocus
                    className="h-14 w-full rounded-xl border border-neutral-800 bg-black pl-14 pr-4 text-lg font-semibold tracking-[0.14em] text-white outline-none focus:border-neutral-600"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={isCheckingOut || phoneNumber.length !== 10}
                className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-600"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing
                  </>
                ) : (
                  "Proceed to payment"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

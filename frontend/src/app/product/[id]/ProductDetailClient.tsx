"use client";

import apiClient from "@/lib/apiClient";
import PlutenNav from "@/components/PlutenNav";
import PlutenSkeleton from "@/components/skeleton/PlutenSkeleton";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader2,
  ShieldCheck,
  X,
  Tag,
  Download,
  LibraryBig,
} from "lucide-react";
// @ts-ignore
import { load } from "@cashfreepayments/cashfree-js";
import styles from "./product.module.css";

interface PricingOffer {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  couponCode: string | null;
}

interface Pricing {
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  discountPercent: number;
  discountLabel: string | null;
  offer: PricingOffer | null;
}

interface Product extends Partial<Pricing> {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string | null;
  category: string;
}

const normalizePricing = (product: Product): Pricing => {
  const originalPrice = Number(product.originalPrice ?? product.price);

  const safeOriginalPrice = Number.isFinite(originalPrice)
    ? Math.max(0, originalPrice)
    : 0;

  const rawFinalPrice = Number(
    product.finalPrice ?? product.price ?? safeOriginalPrice
  );

  const safeFinalPrice = Number.isFinite(rawFinalPrice)
    ? Math.min(Math.max(0, rawFinalPrice), safeOriginalPrice)
    : safeOriginalPrice;

  const rawDiscountAmount = Number(
    product.discountAmount ??
      Math.max(0, safeOriginalPrice - safeFinalPrice)
  );

  const discountAmount = Number.isFinite(rawDiscountAmount)
    ? Math.min(Math.max(0, rawDiscountAmount), safeOriginalPrice)
    : 0;

  const discountPercent =
    safeOriginalPrice > 0
      ? Number(
          ((discountAmount / safeOriginalPrice) * 100).toFixed(2)
        )
      : 0;

  return {
    originalPrice: safeOriginalPrice,
    finalPrice: safeFinalPrice,
    discountAmount,
    discountPercent,
    discountLabel: product.discountLabel ?? null,
    offer: product.offer ?? null,
  };
};

export default function ProductDetailClient({
  id,
  initialProduct,
}: {
  id: string;
  initialProduct: Product;
}) {
  const router = useRouter();

  const [product] = useState<Product>(initialProduct);
  const [loading] = useState(false);
  const [loadError] = useState("");

  const [checkoutError, setCheckoutError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [couponError, setCouponError] = useState("");

  const [couponApplied, setCouponApplied] = useState(false);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const [pricing, setPricing] = useState<Pricing>(
    normalizePricing(initialProduct)
  );

  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [owned, setOwned] = useState(false);
  const [ownershipChecked, setOwnershipChecked] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);

  const checkoutRequestIdRef = useRef<string | null>(null);
  const buyButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    apiClient.get(`/user/ownership/${encodeURIComponent(id)}`, { skipSessionExpiry: true } as any)
      .then((response) => { if (active) setOwned(Boolean(response.data?.owned)); })
      .catch((error) => { if (error?.response?.status !== 401 && error?.response?.status !== 403) console.warn('[OWNERSHIP CHECK]', error?.message); })
      .finally(() => { if (active) setOwnershipChecked(true); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    try {
      const key = `pluten:checkout:${id}`;
      const raw = window.sessionStorage.getItem(key);
      if (!raw) return;
      const intent = JSON.parse(raw);
      window.sessionStorage.removeItem(key);
      if (typeof intent?.phone === 'string') setPhoneNumber(intent.phone);
      if (typeof intent?.coupon === 'string') setCouponCode(intent.coupon);
      setShowPhonePrompt(true);
    } catch { /* Ignore malformed local checkout intent. */ }
  }, [id]);

  useEffect(() => {
    if (!showPhonePrompt) return;

    const focusInput = () => {
      const input = phoneInputRef.current;

      if (!input) return;

      input.focus({ preventScroll: true });

      window.setTimeout(() => {
        input.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }, 50);
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(focusInput, 120);

    const updateViewport = () => {
      const viewport = window.visualViewport;

      if (!viewport) return;

      const inset = Math.max(
        0,
        window.innerHeight -
          viewport.height -
          viewport.offsetTop
      );

      setKeyboardInset(inset);

      if (
        document.activeElement === phoneInputRef.current
      ) {
        window.setTimeout(() => {
          phoneInputRef.current?.scrollIntoView({
            block: "center",
            behavior: "smooth",
          });
        }, 30);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !isCheckingOut
      ) {
        setShowPhonePrompt(false);
        return;
      }

      if (
        event.key !== "Tab" ||
        !modalRef.current
      ) {
        return;
      }

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button,input,[href],[tabindex]:not([tabindex="-1"])'
        )
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true"
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    window.visualViewport?.addEventListener(
      "resize",
      updateViewport
    );

    window.visualViewport?.addEventListener(
      "scroll",
      updateViewport
    );

    updateViewport();

    return () => {
      window.clearTimeout(focusTimer);

      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        onKeyDown
      );

      window.visualViewport?.removeEventListener(
        "resize",
        updateViewport
      );

      window.visualViewport?.removeEventListener(
        "scroll",
        updateViewport
      );

      setKeyboardInset(0);

      window.setTimeout(() => {
        buyButtonRef.current?.focus();
      }, 0);
    };
  }, [showPhonePrompt, isCheckingOut]);

  const buy = () => {
    if (!product || isCheckingOut) return;
    if (owned) { router.push('/library'); return; }

    setCheckoutError("");
    setPhoneError("");
    setCouponError("");

    setShowPhonePrompt(true);
  };

  const resetPricing = () => {
    setPricing(normalizePricing(product));
  };

  const applyCoupon = async () => {
    const normalized = couponCode
      .trim()
      .toUpperCase();

    setCouponError("");
    setCouponApplied(false);

    if (!normalized) {
      resetPricing();
      return;
    }

    if (normalized.length > 40) {
      setCouponError(
        "Coupon code is too long."
      );
      return;
    }

    setIsApplyingCoupon(true);

    try {
      const response = await apiClient.post(
        "/payments/quote",
        {
          productId: product.id,
          couponCode: normalized,
        }
      );

      const nextPricing = normalizePricing({
        ...product,
        ...response.data,
      });

      setPricing(nextPricing);
      setCouponApplied(Boolean(nextPricing.offer));
    } catch (error: any) {
      resetPricing();

      setCouponError(
        error?.response?.data?.error ||
          "That coupon could not be applied."
      );
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const checkout = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!product || isCheckingOut) return;

    const phone = phoneNumber.replace(/\D/g, "");

    if (Number(pricing.finalPrice ?? product.price) > 0 && phone.length !== 10) {
      setPhoneError(
        "Please enter a valid 10-digit phone number."
      );

      phoneInputRef.current?.focus();

      window.setTimeout(() => {
        phoneInputRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }, 50);

      return;
    }

    const normalizedCoupon = couponCode
      .trim()
      .toUpperCase();

    if (normalizedCoupon.length > 40) {
      setCouponError(
        "Coupon code is too long."
      );
      return;
    }

    if (!checkoutRequestIdRef.current) {
      checkoutRequestIdRef.current =
        crypto.randomUUID();
    }

    const clientRequestId =
      checkoutRequestIdRef.current;

    setPhoneError("");
    setCheckoutError("");
    setCouponError("");
    setIsCheckingOut(true);

    try {
      const response = await apiClient.post(
        "/payments/create",
        {
          productId: product.id,
          customerPhone: phone || undefined,
          clientRequestId,
          couponCode:
            normalizedCoupon || undefined,
        }
      );

      if (response.data?.alreadyPurchased) {
        setOwned(true);
        router.push("/library");
        return;
      }

      if (response.data?.freeOrder && response.data?.order_id) {
        router.push(`/payment-success?order_id=${encodeURIComponent(response.data.order_id)}`);
        return;
      }

      const paymentSessionId =
        response.data?.payment_session_id;

      const cashfreeMode =
        response.data?.cashfree_mode;

      if (!paymentSessionId) {
        throw new Error(
          "Payment session was not returned by the server."
        );
      }

      if (
        cashfreeMode !== "production" &&
        cashfreeMode !== "sandbox"
      ) {
        throw new Error(
          "Payment environment was not returned by the server."
        );
      }

      /**
       * Cashfree environment is determined
       * by the backend-created payment session.
       */
      const cashfree = await load({
        mode: cashfreeMode,
      });

      if (!cashfree) {
        throw new Error(
          "Payment gateway could not be initialized."
        );
      }

      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (error: any) {
      checkoutRequestIdRef.current = null;

      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        try { window.sessionStorage.setItem(`pluten:checkout:${id}`, JSON.stringify({ phone: phoneNumber, coupon: couponCode })); } catch {}
        router.replace(
          `/login?redirect=${encodeURIComponent(
            `/product/${id}`
          )}`
        );

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
      <>
        <PlutenNav />
        <main className={styles.pageContainer}>
          <div className={styles.loading}>
            <PlutenSkeleton variant="product" />
            <PlutenSkeleton variant="text" />
          </div>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <PlutenNav />
        <main className={styles.unavailable}>
          <button
            className={styles.backButton}
            onClick={() => window.location.assign("/#products")}
          >
            <ArrowLeft size={16} />
            Back to marketplace
          </button>

          <div className={styles.unavailableInner}>
            <div className={styles.unavailableIcon}>
              <AlertCircle size={24} />
            </div>

            <p className={styles.eyebrow}>PLUTEN / PRODUCT</p>
            <h1>Product unavailable.</h1>
            <p>{loadError || "This product is no longer available."}</p>
          </div>
        </main>
      </>
    );
  }

  const originalPrice = Number(pricing.originalPrice ?? product.price);
  const finalPrice = Number(pricing.finalPrice ?? originalPrice);
  const discountAmount = Number(pricing.discountAmount ?? 0);
  const hasDiscount = discountAmount > 0;

  return (
    <>
      <PlutenNav />

      <main className={styles.pageContainer}>
        <div className={styles.breadcrumbBar}>
          <button className={styles.backButton} onClick={() => window.location.assign("/#products")}>
            <ArrowLeft size={15} />
            Back to products
          </button>

          <div className={styles.breadcrumbTrail} aria-label="Product category">
            <span>Pluten</span>
            <span aria-hidden="true">/</span>
            <span>{product.category || "Digital product"}</span>
          </div>
        </div>

        <section className={styles.productLayout}>
          <div className={styles.galleryColumn}>
            <div className={styles.imageContainer}>
              {product.thumbnail ? (
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className={styles.productImage}
                  loading="eager"
                />
              ) : (
                <div className={styles.noImage}>
                  <span>PLUTEN</span>
                  <strong>Preview unavailable</strong>
                </div>
              )}
            </div>

            <div className={styles.imageCaption}>
              <span>Digital product</span>
              <span aria-hidden="true">•</span>
              <span>Instant library delivery</span>
            </div>
          </div>

          <article className={styles.productInfo}>
            <p className={styles.productEyebrow}>
              {product.category || "PLUTEN DIGITAL PRODUCT"}
            </p>

            <h1 className={styles.title}>{product.title}</h1>

            <div className={styles.vendorInfo}>
              <span className={styles.verifiedMark}>
                <Check size={13} />
              </span>
              <span>Published by Pluten</span>
              <span className={styles.metaSeparator} aria-hidden="true">•</span>
              <span>Digital access</span>
            </div>

            <div className={styles.infoDivider} />

            <section className={styles.descriptionSection}>
              <h2>About this product</h2>
              <p className={styles.description}>{product.description}</p>
            </section>

            <section className={styles.benefits} aria-label="Product benefits">
              <div className={styles.benefitRow}>
                <span className={styles.benefitIcon}><Download size={17} /></span>
                <div>
                  <strong>Instant access</strong>
                  <p>Access your product immediately after a successful purchase.</p>
                </div>
              </div>

              <div className={styles.benefitRow}>
                <span className={styles.benefitIcon}><LibraryBig size={17} /></span>
                <div>
                  <strong>Saved in your Library</strong>
                  <p>Your purchase stays connected to your Pluten account.</p>
                </div>
              </div>

              <div className={styles.benefitRow}>
                <span className={styles.benefitIcon}><ShieldCheck size={17} /></span>
                <div>
                  <strong>Secure checkout</strong>
                  <p>Payments are processed securely through Cashfree.</p>
                </div>
              </div>
            </section>
          </article>

          <aside className={styles.checkoutCard}>
            <div className={styles.checkoutHeading}>
              <span className={styles.priceLabel}>Price</span>
              {ownershipChecked && owned && (
                <span className={styles.ownedBadge}>Owned</span>
              )}
            </div>

            {hasDiscount ? (
              <div className={styles.priceBlock}>
                <div className={styles.priceRow}>
                  <strong>₹{finalPrice.toLocaleString("en-IN")}</strong>
                  {pricing.discountLabel && (
                    <span className={styles.discountPill}>{pricing.discountLabel}</span>
                  )}
                </div>
                <div className={styles.savingsRow}>
                  <span className={styles.originalPrice}>
                    ₹{originalPrice.toLocaleString("en-IN")}
                  </span>
                  <span>
                    Save ₹{discountAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ) : (
              <strong className={styles.priceOnly}>
                {finalPrice <= 0 ? "Free" : `₹${originalPrice.toLocaleString("en-IN")}`}
              </strong>
            )}

            <div className={styles.checkoutDivider} />

            <div className={styles.purchaseFacts}>
              <div>
                <span>Delivery</span>
                <strong>Instant digital access</strong>
              </div>
              <div>
                <span>Access</span>
                <strong>Pluten Library</strong>
              </div>
              <div>
                <span>Support</span>
                <strong>Included</strong>
              </div>
            </div>

            {checkoutError && (
              <div className={styles.checkoutError}>
                <AlertCircle size={15} />
                {checkoutError}
              </div>
            )}

            <button
              ref={buyButtonRef}
              className={styles.buyBtn}
              onClick={buy}
              disabled={isCheckingOut}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 size={17} className="pluten-login-spinner" />
                  Processing
                </>
              ) : owned ? (
                "Open in Library"
              ) : finalPrice <= 0 ? (
                "Get free access"
              ) : (
                `Get instant access — ₹${finalPrice.toLocaleString("en-IN")}`
              )}
            </button>

            <div className={styles.guarantee}>
              <ShieldCheck size={15} />
              <span>Secure transaction via Cashfree</span>
            </div>
          </aside>
        </section>

        <section className={styles.lowerInfo}>
          <div className={styles.lowerInfoLabel}>PLUTEN / PURCHASE EXPERIENCE</div>
          <div className={styles.lowerInfoContent}>
            <h2>Buy once. Keep it in your account.</h2>
            <p>
              After checkout, eligible products appear in your Pluten Library so you can
              return to them from the same account without searching through old payment links.
            </p>
          </div>
        </section>

        {showPhonePrompt && (
          <div
            className={styles.modalOverlay}
            style={{ paddingBottom: `max(10px, ${keyboardInset}px)` }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isCheckingOut) {
                setShowPhonePrompt(false);
              }
            }}
          >
            <div
              ref={modalRef}
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="phone-title"
              aria-describedby="phone-description"
            >
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalEyebrow}>PLUTEN / CHECKOUT</p>
                  <h2 id="phone-title">Billing details</h2>
                </div>

                <button
                  className={styles.modalClose}
                  onClick={() => !isCheckingOut && setShowPhonePrompt(false)}
                  aria-label="Close checkout"
                  disabled={isCheckingOut}
                >
                  <X size={18} />
                </button>
              </div>

              <p id="phone-description" className={styles.modalText}>
                {finalPrice <= 0
                  ? "No payment details are required. Confirm below to add this product to your Library."
                  : "Use a valid 10-digit phone number for secure Cashfree processing."}
              </p>

              {phoneError && <div className={styles.phoneError}>{phoneError}</div>}
              {couponError && <div className={styles.phoneError}>{couponError}</div>}

              {couponApplied && pricing.offer && (
                <div className={styles.couponSuccess}>
                  <Tag size={14} />
                  {pricing.offer.name} applied — you save ₹
                  {pricing.discountAmount.toLocaleString("en-IN")}
                </div>
              )}

              <form onSubmit={checkout}>
                {finalPrice > 0 && (
                  <label className={styles.formField}>
                    <span>Phone number</span>
                    <div className={styles.phoneWrap}>
                      <span>+91</span>
                      <input
                        ref={phoneInputRef}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        enterKeyHint="next"
                        maxLength={10}
                        value={phoneNumber}
                        onChange={(event) => {
                          setPhoneNumber(
                            event.target.value.replace(/\D/g, "").slice(0, 10)
                          );
                          setPhoneError("");
                        }}
                        placeholder="00000 00000"
                        disabled={isCheckingOut}
                      />
                    </div>
                  </label>
                )}

                <label className={styles.formField}>
                  <span>
                    Coupon code <em>optional</em>
                  </span>

                  <div className={styles.couponRow}>
                    <input
                      className={styles.couponInput}
                      value={couponCode}
                      onChange={(event) => {
                        setCouponCode(
                          event.target.value
                            .toUpperCase()
                            .replace(/\s/g, "")
                            .slice(0, 40)
                        );
                        setCouponError("");
                        setCouponApplied(false);
                      }}
                      placeholder="SAVE20"
                      disabled={isCheckingOut || isApplyingCoupon}
                      maxLength={40}
                    />

                    <button
                      type="button"
                      className={styles.applyCouponButton}
                      onClick={applyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                    >
                      {isApplyingCoupon ? (
                        <Loader2 size={15} className="pluten-login-spinner" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                </label>

                <div className={styles.modalTotal}>
                  <span>Total</span>
                  <strong>₹{finalPrice.toLocaleString("en-IN")}</strong>
                </div>

                <button
                  className={styles.payButton}
                  type="submit"
                  disabled={
                    isCheckingOut || (finalPrice > 0 && phoneNumber.length !== 10)
                  }
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 size={17} className="pluten-login-spinner" />
                      Processing
                    </>
                  ) : finalPrice <= 0 ? (
                    "Add to Library"
                  ) : (
                    "Proceed to secure payment"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

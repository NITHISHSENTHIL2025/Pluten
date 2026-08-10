"use client";

import { useMemo } from "react";
import { Star, User, Check, ArrowUpRight, Sparkles } from "lucide-react";
import { useOffers } from "@/context/OfferContext";
import styles from "../app/page.module.css";

interface Product {
  id: string;
  title: string;
  price: number | string;
  thumbnail: string | null;
  category?: string;
}

export default function ProductCard({
  product,
}: {
  product: Product;
}) {
  const { activeOffers, loadingOffers } = useOffers();

  const { finalPrice, activeOffer } = useMemo(() => {
    const originalPrice = Number(product.price);

    const offer = activeOffers.find(
      (o: any) => o.autoApply
    );

    if (!offer) {
      return {
        finalPrice: originalPrice,
        activeOffer: null,
      };
    }

    let discountAmount = 0;

    if (offer.type === "PERCENTAGE") {
      discountAmount =
        originalPrice * (Number(offer.value) / 100);
    }

    if (offer.type === "FIXED") {
      discountAmount = Number(offer.value);
    }

    const discountedPrice = Math.max(
      0,
      originalPrice - discountAmount
    );

    return {
      finalPrice: Math.round(discountedPrice),
      activeOffer: offer,
    };
  }, [product.price, activeOffers]);

  const originalPrice = Number(product.price);

  const hasDiscount =
    !!activeOffer &&
    finalPrice < originalPrice;

  const discountPercent = hasDiscount
    ? Math.round(
        ((originalPrice - finalPrice) /
          originalPrice) *
          100
      )
    : 0;

  return (
    <article className={styles.productCard}>

      {/* IMAGE */}
      <div className={styles.productVisual}>

        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className={styles.cardImage}
          />
        ) : (
          <div className={styles.noImage}>
            NO PREVIEW
          </div>
        )}

        {/* OFFER */}
        {hasDiscount && activeOffer && (
          <div className={styles.offerBadge}>
            <Sparkles size={12} strokeWidth={2.5} />

            <span>
              {activeOffer.type === "PERCENTAGE"
                ? `${discountPercent}% OFF`
                : `₹${Number(
                    activeOffer.value
                  ).toLocaleString("en-IN")} OFF`}
            </span>
          </div>
        )}

        {/* VIEW BUTTON */}
        <div className={styles.productArrow}>
          <ArrowUpRight
            size={18}
            strokeWidth={1.8}
          />
        </div>

      </div>

      {/* CONTENT */}
      <div className={styles.cardContent}>

        <div className={styles.productMeta}>
          <span>
            {product.category || "DIGITAL PRODUCT"}
          </span>

          {hasDiscount && (
            <span className={styles.saveText}>
              SAVE {discountPercent}%
            </span>
          )}
        </div>

        <div className={styles.titleRow}>

          <h3 className={styles.cardTitle}>
            {product.title}
          </h3>

          <ArrowUpRight
            className={styles.titleArrow}
            size={18}
            strokeWidth={1.5}
          />

        </div>

        {/* VENDOR */}
        <div className={styles.cardVendor}>

          <div className={styles.vendorAvatar}>
            <User
              size={11}
              strokeWidth={1.8}
            />
          </div>

          <span>PLUTEN</span>

          <span className={styles.verified}>
            <Check
              size={9}
              strokeWidth={3}
            />
          </span>

        </div>

        {/* RATING */}
        <div className={styles.cardRating}>

          <Star
            size={12}
            fill="currentColor"
            strokeWidth={0}
          />

          <span>5.0</span>

          <span className={styles.ratingDivider}>
            /
          </span>

          <span>PLUTEN VERIFIED</span>

        </div>

        {/* BOTTOM */}
        <div className={styles.cardBottom}>

          {loadingOffers ? (
            <div className={styles.priceSkeleton} />
          ) : (
            <div className={styles.priceContainer}>

              <span className={styles.currentPrice}>
                ₹{finalPrice.toLocaleString("en-IN")}
              </span>

              {hasDiscount && (
                <span className={styles.oldPrice}>
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
              )}

            </div>
          )}

          <span className={styles.viewLabel}>
            VIEW
          </span>

        </div>

      </div>

    </article>
  );
}
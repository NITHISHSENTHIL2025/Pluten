"use client";

import { useMemo } from "react";
import {
  Star,
  Check,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

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
    !!activeOffer && finalPrice < originalPrice;

  const discountPercentage =
    hasDiscount && activeOffer?.type === "PERCENTAGE"
      ? Number(activeOffer.value)
      : Math.round(
          ((originalPrice - finalPrice) / originalPrice) *
            100
        );

  return (
    <article className={styles.productCard}>
      {/* IMAGE AREA */}
      <div className={styles.productVisual}>

        {/* OFFER */}
        {hasDiscount && (
          <div className={styles.offerPill}>
            <Sparkles size={11} strokeWidth={2} />
            <span>
              {activeOffer?.type === "PERCENTAGE"
                ? `${activeOffer.value}% OFF`
                : `SAVE ₹${activeOffer?.value}`}
            </span>
          </div>
        )}

        {/* IMAGE */}
        <div className={styles.imageFrame}>
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className={styles.cardImage}
            />
          ) : (
            <div className={styles.noImage}>
              <span>NO PREVIEW</span>
            </div>
          )}
        </div>

        {/* HOVER ARROW */}
        <div className={styles.productArrow}>
          <ArrowUpRight
            size={18}
            strokeWidth={1.6}
          />
        </div>
      </div>

      {/* PRODUCT INFO */}
      <div className={styles.cardContent}>

        <div className={styles.productMeta}>
          <span>
            {product.category || "E-BOOKS"}
          </span>

          {hasDiscount && (
            <span className={styles.saveText}>
              SAVE {discountPercentage}%
            </span>
          )}
        </div>

        <h3 className={styles.cardTitle}>
          {product.title}
        </h3>

        {/* BRAND */}
        <div className={styles.cardVendor}>
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
            size={11}
            fill="currentColor"
            strokeWidth={1.5}
          />
          <span>5.0</span>
        </div>

        {/* PRICE */}
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
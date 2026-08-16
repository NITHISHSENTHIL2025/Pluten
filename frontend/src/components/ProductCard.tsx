"use client";

import { useMemo } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useOffers } from "@/context/OfferContext";
import styles from "../app/page.module.css";

interface Product {
  id: string;
  title: string;
  price: number | string;
  thumbnail: string | null;
  category?: string;
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { activeOffers, loadingOffers } = useOffers();

  const originalPrice = Number(product.price);

  const { finalPrice, activeOffer } = useMemo(() => {
    const eligibleOffers = activeOffers
      .filter((offer) => offer.autoApply && offer.status === "ACTIVE")
      .filter((offer) => {
        const appliesToProduct =
          offer.applyTo === "ALL" ||
          (offer.applyTo === "SELECTED" &&
            offer.products?.some((item) => item.id === product.id));

        if (!appliesToProduct) return false;

        if (
          offer.minOrderAmount !== null &&
          Number(product.price) < Number(offer.minOrderAmount)
        ) {
          return false;
        }

        return true;
      });

    const best = eligibleOffers.reduce<{
      offer: (typeof activeOffers)[number] | null;
      final: number;
    }>(
      (bestSoFar, offer) => {
        const base = Number(product.price);
        let discount = 0;

        if (offer.type === "PERCENTAGE") {
          discount = base * (Number(offer.value) / 100);
        } else {
          discount = Number(offer.value);
        }

        const candidate = Number(
          Math.max(0, base - discount).toFixed(2)
        );

        if (candidate < bestSoFar.final) {
          return { offer, final: candidate };
        }

        return bestSoFar;
      },
      { offer: null, final: Number(originalPrice.toFixed(2)) }
    );

    return {
      finalPrice: best.final,
      activeOffer: best.offer,
    };
  }, [activeOffers, originalPrice, product.id, product.price]);

  const hasDiscount =
    Number.isFinite(originalPrice) &&
    !!activeOffer &&
    finalPrice < originalPrice;

  const discountPercent =
    hasDiscount && originalPrice > 0
      ? Math.round(
          ((originalPrice - finalPrice) / originalPrice) * 100
        )
      : 0;

  return (
    <article className={styles.productCard}>
      <div className={styles.productVisual}>
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className={styles.cardImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.noImage}>NO PREVIEW</div>
        )}

        {hasDiscount && activeOffer && (
          <div className={styles.offerBadge}>
            <Sparkles size={12} strokeWidth={2.5} />
            <span>
              {activeOffer.type === "PERCENTAGE"
                ? `${discountPercent}% OFF`
                : `₹${Number(activeOffer.value).toLocaleString("en-IN")} OFF`}
            </span>
          </div>
        )}
      </div>

      <div className={styles.cardContent}>
        <div className={styles.productMeta}>
          <span>{product.category || "DIGITAL PRODUCT"}</span>

          {hasDiscount && (
            <span className={styles.saveText}>
              SAVE {discountPercent}%
            </span>
          )}
        </div>

        <h3 className={styles.cardTitle}>{product.title}</h3>

        <div className={styles.cardBottom}>
          {loadingOffers ? (
            <div
              className={styles.priceSkeleton}
              aria-label="Loading price"
            />
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
            <ArrowUpRight size={12} strokeWidth={2} />
          </span>
        </div>
      </div>
    </article>
  );
}

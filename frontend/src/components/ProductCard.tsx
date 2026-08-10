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

export default function ProductCard({
  product,
}: ProductCardProps) {

  const {
    activeOffers,
    loadingOffers,
  } = useOffers();

  /* =========================================================
     REAL OFFER CALCULATION
  ========================================================= */

  const {
    finalPrice,
    activeOffer,
  } = useMemo(() => {

    const originalPrice =
      Number(product.price);

    const offer =
      activeOffers.find(
        (item: any) =>
          item.autoApply
      );

    if (!offer) {
      return {
        finalPrice: originalPrice,
        activeOffer: null,
      };
    }

    let discountAmount = 0;

    if (
      offer.type ===
      "PERCENTAGE"
    ) {
      discountAmount =
        originalPrice *
        (
          Number(offer.value) /
          100
        );
    }

    if (
      offer.type ===
      "FIXED"
    ) {
      discountAmount =
        Number(offer.value);
    }

    const discountedPrice =
      Math.max(
        0,
        originalPrice -
          discountAmount
      );

    return {
      finalPrice:
        Math.round(
          discountedPrice
        ),
      activeOffer: offer,
    };

  }, [
    product.price,
    activeOffers,
  ]);

  const originalPrice =
    Number(product.price);

  const hasDiscount =
    !!activeOffer &&
    finalPrice <
      originalPrice;

  const discountPercent =
    hasDiscount
      ? Math.round(
          (
            (
              originalPrice -
              finalPrice
            ) /
            originalPrice
          ) *
          100
        )
      : 0;

  /* =========================================================
     CARD
  ========================================================= */

  return (
    <article
      className={
        styles.productCard
      }
    >

      {/* =====================================================
          IMAGE
      ===================================================== */}

      <div
        className={
          styles.productVisual
        }
      >

        {product.thumbnail ? (

          <img
            src={
              product.thumbnail
            }
            alt={
              product.title
            }
            className={
              styles.cardImage
            }
          />

        ) : (

          <div
            className={
              styles.noImage
            }
          >
            NO PREVIEW
          </div>

        )}

        {/* REAL OFFER ONLY */}

        {hasDiscount &&
          activeOffer && (

            <div
              className={
                styles.offerBadge
              }
            >

              <Sparkles
                size={12}
                strokeWidth={2.5}
              />

              <span>
                {activeOffer.type ===
                "PERCENTAGE"
                  ? `${discountPercent}% OFF`
                  : `₹${Number(
                      activeOffer.value
                    ).toLocaleString(
                      "en-IN"
                    )} OFF`}
              </span>

            </div>

          )}

      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div
        className={
          styles.cardContent
        }
      >

        {/* CATEGORY */}

        <div
          className={
            styles.productMeta
          }
        >

          <span>
            {product.category ||
              "DIGITAL PRODUCT"}
          </span>

          {hasDiscount && (
            <span
              className={
                styles.saveText
              }
            >
              SAVE {discountPercent}%
            </span>
          )}

        </div>

        {/* TITLE */}

        <h3
          className={
            styles.cardTitle
          }
        >
          {product.title}
        </h3>

        {/* PRICE */}

        <div
          className={
            styles.cardBottom
          }
        >

          {loadingOffers ? (

            <div
              className={
                styles.priceSkeleton
              }
            />

          ) : (

            <div
              className={
                styles.priceContainer
              }
            >

              <span
                className={
                  styles.currentPrice
                }
              >
                ₹
                {finalPrice.toLocaleString(
                  "en-IN"
                )}
              </span>

              {hasDiscount && (

                <span
                  className={
                    styles.oldPrice
                  }
                >
                  ₹
                  {originalPrice.toLocaleString(
                    "en-IN"
                  )}
                </span>

              )}

            </div>

          )}

          <span
            className={
              styles.viewLabel
            }
          >
            VIEW

            <ArrowUpRight
              size={12}
              strokeWidth={2}
            />
          </span>

        </div>

      </div>

    </article>
  );
}
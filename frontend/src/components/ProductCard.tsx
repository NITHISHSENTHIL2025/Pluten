"use client";

import { useMemo } from "react";
import { ArrowUpRight, Check } from "lucide-react";
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
  const {
    activeOffers,
    loadingOffers,
  } = useOffers();

  const {
    finalPrice,
    activeOffer,
  } = useMemo(() => {
    let price = Number(product.price);

    const offer = activeOffers.find(
      (o: any) => o.autoApply
    );

    if (!offer) {
      return {
        finalPrice: price,
        activeOffer: null,
      };
    }

    let discountAmount = 0;

    if (offer.type === "PERCENTAGE") {
      discountAmount =
        price *
        (Number(offer.value) / 100);
    }

    if (offer.type === "FIXED") {
      discountAmount =
        Number(offer.value);
    }

    price = Math.max(
      0,
      price - discountAmount
    );

    return {
      finalPrice: Math.round(price),
      activeOffer: offer,
    };
  }, [
    product.price,
    activeOffers,
  ]);

  const originalPrice =
    Number(product.price);

  const hasDiscount =
    Boolean(
      activeOffer &&
      finalPrice < originalPrice
    );

  return (
    <article className={styles.productCard}>
      {/* PRODUCT VISUAL */}

      <div className={styles.cardVisual}>
        <div className={styles.cardIndex}>
          PLUTEN
        </div>

        {hasDiscount &&
          activeOffer && (
            <div
              className={
                styles.discountBadge
              }
            >
              {activeOffer.type ===
              "PERCENTAGE"
                ? `${activeOffer.value}% OFF`
                : `₹${activeOffer.value} OFF`}
            </div>
          )}

        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
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

        <div
          className={
            styles.cardImageShade
          }
        />

        <div
          className={
            styles.cardHoverAction
          }
        >
          <ArrowUpRight
            size={19}
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* PRODUCT INFORMATION */}

      <div
        className={
          styles.cardContent
        }
      >
        <div
          className={
            styles.cardCategory
          }
        >
          {product.category ||
            "DIGITAL PRODUCT"}
        </div>

        <div
          className={
            styles.cardTitleRow
          }
        >
          <h3
            className={
              styles.cardTitle
            }
          >
            {product.title}
          </h3>

          <ArrowUpRight
            className={
              styles.cardTitleArrow
            }
            size={17}
            strokeWidth={1.5}
          />
        </div>

        <div
          className={
            styles.cardVendor
          }
        >
          <span>
            PLUTEN
          </span>

          <Check
            size={11}
            strokeWidth={2}
          />
        </div>

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
          ) : hasDiscount ? (
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
            </div>
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
                {originalPrice.toLocaleString(
                  "en-IN"
                )}
              </span>
            </div>
          )}

          <span
            className={
              styles.cardExplore
            }
          >
            VIEW
          </span>
        </div>
      </div>
    </article>
  );
}
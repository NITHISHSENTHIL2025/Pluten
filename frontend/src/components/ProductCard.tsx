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
  const { activeOffers, loadingOffers } = useOffers();

  const { finalPrice, activeOffer } = useMemo(() => {
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

    if (offer.type === "PERCENTAGE") {
      price =
        price -
        price * (Number(offer.value) / 100);
    }

    if (offer.type === "FIXED") {
      price =
        price - Number(offer.value);
    }

    return {
      finalPrice: Math.max(
        0,
        Math.round(price)
      ),
      activeOffer: offer,
    };
  }, [product.price, activeOffers]);

  const originalPrice =
    Number(product.price);

  const hasDiscount =
    activeOffer &&
    finalPrice < originalPrice;

  return (
    <article className={styles.productCard}>

      {/* =========================================
          IMAGE
      ========================================= */}

      <div className={styles.productImageFrame}>

        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className={styles.productImage}
          />
        ) : (
          <div className={styles.productNoImage}>
            <span>PLUTEN</span>
          </div>
        )}

        {/* Hover circle */}

        <div
          className={
            styles.productHoverArrow
          }
        >
          <ArrowUpRight
            size={19}
            strokeWidth={1.5}
          />
        </div>

      </div>


      {/* =========================================
          PRODUCT INFORMATION
      ========================================= */}

      <div className={styles.productInfo}>

        <div
          className={
            styles.productInfoTop
          }
        >

          <div>

            <div
              className={
                styles.productEyebrow
              }
            >
              {product.category ||
                "DIGITAL PRODUCT"}
            </div>

            <h3
              className={
                styles.productTitle
              }
            >
              {product.title}
            </h3>

          </div>

          <ArrowUpRight
            className={
              styles.productTitleArrow
            }
            size={18}
            strokeWidth={1.4}
          />

        </div>


        {/* =====================================
            META
        ===================================== */}

        <div
          className={
            styles.productMeta
          }
        >

          <div
            className={
              styles.productBrand
            }
          >
            <span>PLUTEN</span>

            <Check
              size={11}
              strokeWidth={2}
            />
          </div>


          {/* PRICE */}

          <div
            className={
              styles.productPrice
            }
          >

            {loadingOffers ? (
              <span
                className={
                  styles.priceLoading
                }
              />
            ) : (
              <>
                <span>
                  ₹
                  {finalPrice.toLocaleString(
                    "en-IN"
                  )}
                </span>

                {hasDiscount && (
                  <del>
                    ₹
                    {originalPrice.toLocaleString(
                      "en-IN"
                    )}
                  </del>
                )}
              </>
            )}

          </div>

        </div>

      </div>

    </article>
  );
}
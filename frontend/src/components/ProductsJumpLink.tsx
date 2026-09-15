"use client";

import type { ComponentProps, MouseEvent } from "react";

type Props = Omit<ComponentProps<"a">, "href">;

export default function ProductsJumpLink({ onClick, ...props }: Props) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || typeof window === "undefined") return;

    // When we are already on the storefront, always perform the scroll ourselves.
    // This also fixes the case where #products is already present in the URL.
    if (window.location.pathname === "/") {
      const products = document.getElementById("products");
      if (products) {
        event.preventDefault();
        window.history.replaceState(null, "", "#products");
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        products.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    }
  };

  return <a href="/#products" onClick={handleClick} {...props} />;
}

"use client";

import {
  PropsWithChildren,
  useEffect,
  useRef,
} from "react";

interface RevealProps
  extends PropsWithChildren {
  className?: string;
  delay?: number;
}

export default function Reveal({
  children,
  className = "",
  delay = 0,
}: RevealProps) {
  const ref =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
    ) {
      element.dataset.revealed = "true";
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (
              entry.isIntersecting
            ) {
              element.dataset.revealed =
                "true";

              observer.unobserve(
                element,
              );
            }
          });
        },
        {
          threshold: 0.08,
          rootMargin:
            "0px 0px -8% 0px",
        },
      );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{
        "--reveal-delay": `${delay}ms`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
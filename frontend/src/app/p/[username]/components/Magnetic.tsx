"use client";

import {
  PropsWithChildren,
  useRef,
} from "react";

interface MagneticProps
  extends PropsWithChildren {
  className?: string;
}

export default function Magnetic({
  children,
  className = "",
}: MagneticProps) {
  const ref =
    useRef<HTMLDivElement | null>(null);

  const handleMove = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const element =
      ref.current;

    if (!element) {
      return;
    }

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
    ) {
      return;
    }

    const rect =
      element.getBoundingClientRect();

    const x =
      event.clientX -
      (rect.left +
        rect.width / 2);

    const y =
      event.clientY -
      (rect.top +
        rect.height / 2);

    element.style.setProperty(
      "--mag-x",
      `${x * 0.12}px`,
    );

    element.style.setProperty(
      "--mag-y",
      `${y * 0.12}px`,
    );
  };

  const handleLeave = () => {
    ref.current?.style.setProperty(
      "--mag-x",
      "0px",
    );

    ref.current?.style.setProperty(
      "--mag-y",
      "0px",
    );
  };

  return (
    <div
      ref={ref}
      className={`magnetic ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  );
}
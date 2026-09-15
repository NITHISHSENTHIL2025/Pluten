/* eslint-disable @next/next/no-img-element */

export type PlutenMotionState =
  | "loading"
  | "offline"
  | "error"
  | "retry"
  | "processing"
  | "success";

const MOTION_SRC: Record<PlutenMotionState, string> = {
  loading: "/brand/motion/loading.svg",
  offline: "/brand/motion/offline.svg",
  error: "/brand/motion/error.svg",
  retry: "/brand/motion/retry.svg",
  processing: "/brand/motion/processing.svg",
  success: "/brand/motion/success.svg",
};

interface PlutenMotionProps {
  state: PlutenMotionState;
  size?: number;
  className?: string;
  label?: string;
  priority?: "high" | "auto";
}

export default function PlutenMotion({
  state,
  size = 108,
  className,
  label,
  priority = "auto",
}: PlutenMotionProps) {
  const decorative = !label;

  return (
    <img
      src={MOTION_SRC[state]}
      width={size}
      height={size}
      className={className}
      alt={decorative ? "" : label}
      aria-hidden={decorative ? true : undefined}
      loading={priority === "high" ? "eager" : undefined}
      decoding="async"
      draggable={false}
    />
  );
}

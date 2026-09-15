"use client";

import ErrorBoundaryView from "@/components/system/ErrorBoundaryView";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string; requestId?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryView error={error} reset={reset} />;
}

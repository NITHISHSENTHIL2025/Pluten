"use client";

import ErrorBoundaryView from "@/components/system/ErrorBoundaryView";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; requestId?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundaryView error={error} reset={reset} global />
      </body>
    </html>
  );
}

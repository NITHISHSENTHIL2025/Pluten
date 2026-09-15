import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service unavailable",
  robots: { index: false, follow: false },
};

export default function ServiceUnavailableLayout({ children }: { children: React.ReactNode }) {
  return children;
}

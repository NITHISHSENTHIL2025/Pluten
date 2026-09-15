import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./pluten-hardening.css";
import "./pluten-frost-system.css";
import AuthHeartbeat from "@/components/AuthHeartbeat";
import SessionExpiryNotice from "@/components/SessionExpiryNotice";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import NetworkStatusGate from "@/components/system/NetworkStatusGate";
import ServiceWorkerRegistration from "@/components/system/ServiceWorkerRegistration";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pluten.site"),
  title: { default: "Pluten — Build Your Presence", template: "%s | Pluten" },
  description: "Useful digital products and a free portfolio maker for students, creators and builders.",
  keywords: ["Pluten", "portfolio maker", "student portfolio", "digital products", "ebooks", "templates"],
  authors: [{ name: "Pluten", url: "https://pluten.site" }],
  creator: "Pluten",
  publisher: "Pluten",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Pluten — Build Your Presence",
    description: "Useful digital products and a free portfolio maker for students, creators and builders.",
    url: "https://pluten.site",
    siteName: "Pluten",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Pluten — Build Your Presence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pluten — Build Your Presence",
    description: "Useful digital products and a free portfolio maker for students, creators and builders.",
    images: ["/og.png"],
  },
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
  themeColor: "#F4F6F5",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <AuthHeartbeat />
        <SessionExpiryNotice />
        <AnalyticsTracker />
        <ServiceWorkerRegistration />
        <NetworkStatusGate />
        {children}
      </body>
    </html>
  );
}

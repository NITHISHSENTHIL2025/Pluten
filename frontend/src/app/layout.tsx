import type { Metadata, Viewport } from 'next';
import './globals.css';
import './pluten-hardening.css';
import AuthHeartbeat from '@/components/AuthHeartbeat';
import SessionExpiryNotice from '@/components/SessionExpiryNotice';
import AnalyticsTracker from '@/components/AnalyticsTracker';

export const metadata: Metadata = {
  metadataBase: new URL('https://pluten.site'),
  title: { default: 'Pluten — Build Your Presence', template: '%s | Pluten' },
  description: 'Useful digital products and a free portfolio maker for students, creators and builders.',
  keywords: ['Pluten', 'portfolio maker', 'student portfolio', 'digital products', 'ebooks', 'templates'],
  authors: [{ name: 'Pluten', url: 'https://pluten.site' }],
  creator: 'Pluten',
  publisher: 'Pluten',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Pluten — Build Your Presence',
    description: 'Useful digital products and a free portfolio maker for students, creators and builders.',
    url: 'https://pluten.site',
    siteName: 'Pluten',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Pluten — Build Your Presence' }],
  },
  twitter: { card: 'summary_large_image', title: 'Pluten — Build Your Presence', description: 'Useful digital products and a free portfolio maker for students, creators and builders.', images: ['/og.png'] },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', colorScheme: 'light' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AuthHeartbeat /><SessionExpiryNotice /><AnalyticsTracker />{children}</body></html>;
}

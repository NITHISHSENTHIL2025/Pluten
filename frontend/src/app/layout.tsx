import type { Metadata, Viewport } from 'next';
import './globals.css';
import './pluten-hardening.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://pluten.site'),
  title: { default: 'Pluten — Beyond Ordinary', template: '%s | Pluten' },
  description: 'Premium digital products built for people who refuse ordinary.',
  keywords: ['Pluten', 'digital products', 'ebooks', 'courses', 'templates', 'software'],
  authors: [{ name: 'Pluten', url: 'https://pluten.site' }],
  creator: 'Pluten',
  publisher: 'Pluten',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Pluten — Beyond Ordinary',
    description: 'Premium digital products built for people who refuse ordinary.',
    url: 'https://pluten.site',
    siteName: 'Pluten',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Pluten — Beyond Ordinary' }],
  },
  twitter: { card: 'summary_large_image', title: 'Pluten — Beyond Ordinary', description: 'Premium digital products built for people who refuse ordinary.', images: ['/og.png'] },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', colorScheme: 'light' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

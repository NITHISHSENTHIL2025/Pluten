import type { Metadata, Viewport } from 'next';
import './globals.css';
import { OfferProvider } from '@/context/OfferContext';

export const metadata: Metadata = {
  metadataBase: new URL('https://pluten.site'),
  title: { default: 'Pluten', template: '%s | Pluten' },
  description: 'Premium digital products built for people who refuse ordinary.',
  keywords: ['Pluten','Digital Products','AI','Software','Templates','Courses','Marketplace'],
  authors: [{ name: 'Pluten', url: 'https://pluten.site' }],
  creator: 'Pluten',
  publisher: 'Pluten',
  robots: { index: true, follow: true },
  openGraph: { title: 'Pluten', description: 'Premium digital products built for people who refuse ordinary.', url: 'https://pluten.site', siteName: 'Pluten', locale: 'en_US', type: 'website', images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Pluten' }] },
  twitter: { card: 'summary_large_image', title: 'Pluten', description: 'Premium digital products built for people who refuse ordinary.', images: ['/og.png'] },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><OfferProvider>{children}</OfferProvider></body></html>;
}

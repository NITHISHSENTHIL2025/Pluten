import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/library', '/profile', '/payment-success', '/login', '/offline', '/offline.html', '/maintenance', '/service-unavailable'] }],
    sitemap: 'https://pluten.site/sitemap.xml',
  };
}

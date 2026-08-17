import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/library', '/profile', '/payment-success', '/login'] }],
    sitemap: 'https://pluten.site/sitemap.xml',
  };
}

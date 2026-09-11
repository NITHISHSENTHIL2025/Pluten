import type { MetadataRoute } from 'next';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseSite = 'https://pluten.site';
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [
    { url: baseSite, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseSite}/portfolio`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseSite}/support`, lastModified: now, changeFrequency: 'monthly', priority: 0.45 },
    { url: `${baseSite}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseSite}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseSite}/refund-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseSite}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (!apiBase) return urls;
  try {
    const response = await fetch(`${apiBase}/products?limit=48&page=1`, { next: { revalidate: 3600 } });
    if (response.ok) {
      const payload = await response.json();
      const totalPages = Math.min(Number(payload?.pagination?.totalPages || 1), 50);
      const products = Array.isArray(payload?.data) ? [...payload.data] : [];
      for (let page = 2; page <= totalPages; page += 1) {
        const next = await fetch(`${apiBase}/products?limit=48&page=${page}`, { next: { revalidate: 3600 } });
        if (!next.ok) break;
        const data = await next.json(); if (Array.isArray(data?.data)) products.push(...data.data);
      }
      for (const product of products) if (product?.id) urls.push({ url: `${baseSite}/product/${encodeURIComponent(product.id)}`, lastModified: new Date(product.updatedAt || product.createdAt || Date.now()), changeFrequency: 'weekly', priority: 0.8 });
    }
  } catch (error) { console.error('[SEO] Sitemap product sync failed:', error); }
  try {
    const response = await fetch(`${apiBase}/portfolio/public-index?limit=2000`, { next: { revalidate: 3600 } });
    if (response.ok) {
      const payload = await response.json();
      for (const portfolio of Array.isArray(payload?.portfolios) ? payload.portfolios : []) {
        if (!portfolio?.username) continue;
        urls.push({ url: `${baseSite}/p/${encodeURIComponent(portfolio.username)}`, lastModified: new Date(portfolio.updatedAt || portfolio.lastPublishedAt || portfolio.publishedAt || Date.now()), changeFrequency: 'weekly', priority: 0.7 });
      }
    }
  } catch (error) { console.error('[SEO] Sitemap portfolio sync failed:', error); }
  return urls;
}

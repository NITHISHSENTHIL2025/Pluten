import type { MetadataRoute } from 'next';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseSite = 'https://pluten.site';
  const urls: MetadataRoute.Sitemap = [
    { url: baseSite, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseSite}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseSite}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseSite}/refund-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseSite}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (!apiBase) return urls;

  try {
    const response = await fetch(`${apiBase}/products?limit=48&page=1`, { next: { revalidate: 3600 } });
    if (!response.ok) return urls;
    const payload = await response.json();
    const totalPages = Math.min(Number(payload?.pagination?.totalPages || 1), 50);
    const products = Array.isArray(payload?.data) ? [...payload.data] : [];
    for (let page = 2; page <= totalPages; page += 1) {
      const next = await fetch(`${apiBase}/products?limit=48&page=${page}`, { next: { revalidate: 3600 } });
      if (!next.ok) break;
      const data = await next.json();
      if (Array.isArray(data?.data)) products.push(...data.data);
    }
    for (const product of products) {
      if (!product?.id) continue;
      urls.push({ url: `${baseSite}/product/${encodeURIComponent(product.id)}`, lastModified: new Date(product.updatedAt || product.createdAt || Date.now()), changeFrequency: 'weekly', priority: 0.8 });
    }
  } catch (error) {
    console.error('[SEO] Sitemap product sync failed:', error);
  }
  return urls;
}

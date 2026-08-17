import Link from 'next/link';
import { ArrowDown, RefreshCw } from 'lucide-react';
import PlutenNav from '@/components/PlutenNav';
import ProductCard from '@/components/ProductCard';
import styles from './page.module.css';

interface Product {
  id: string; title: string; category: string; description: string; price: number; thumbnail: string | null; createdAt: string;
  originalPrice?: number; finalPrice?: number; discountAmount?: number; discountPercent?: number; discountLabel?: string | null;
}

interface CatalogResponse { data: Product[]; pagination?: { total: number; totalPages: number } }

async function getProducts(): Promise<CatalogResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (!baseUrl) return { data: [], pagination: { total: 0, totalPages: 1 } };
  try {
    const response = await fetch(`${baseUrl}/products?limit=24`, { next: { revalidate: 60, tags: ['products'] } });
    if (!response.ok) return { data: [], pagination: { total: 0, totalPages: 1 } };
    const payload = await response.json();
    return { data: Array.isArray(payload?.data) ? payload.data : [], pagination: payload?.pagination || { total: 0, totalPages: 1 } };
  } catch { return { data: [], pagination: { total: 0, totalPages: 1 } }; }
}

export default async function StorefrontPage() {
  const catalog = await getProducts();
  const products = catalog.data;
  const total = Number(catalog.pagination?.total || products.length);

  return (
    <main className={styles.page}>
      <PlutenNav />
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>PLUTEN / 001</p>
          <h1 className={styles.heroTitle}>Beyond<br />Ordinary.</h1>
          <p className={styles.heroDescription}>Premium digital products built for people who refuse ordinary.</p>
          <div className={styles.heroActions}>
            <Link href="#products" className={styles.primaryCta}>Explore products <ArrowDown size={17} /></Link>
            <Link href="/library" className={styles.secondaryCta}>Digital library</Link>
          </div>
        </div>
        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.orbit}><span className={styles.orbitDot} /><img src="/favicon.ico" alt="" className={styles.heroLogo} /></div>
          <div className={styles.heroCaption}>PLUTEN · BEYOND ORDINARY</div>
          <div className={styles.scrollHint}>Scroll to explore <ArrowDown size={12} /></div>
        </div>
      </section>

      <section id="products" className={styles.productsSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div><p className={styles.sectionEyebrow}>PLUTEN / DIGITAL PRODUCTS</p><h2 className={styles.sectionTitle}>Built to be useful.</h2></div>
            <span className={styles.sectionMeta}>{total} digital assets</span>
          </div>
          {products.length === 0 ? (
            <div className={styles.state}>
              <div className={styles.stateInner}><RefreshCw size={22} /><h3 className={styles.stateTitle}>The catalog is taking a breath.</h3><p className={styles.stateText}>Products are temporarily unavailable. Refresh and try again.</p><Link href="/" className={styles.stateAction}>Refresh catalog</Link></div>
            </div>
          ) : <div className={styles.productGrid}>{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
        </div>
      </section>

      <section className={styles.principle}><div className={styles.principleInner}><div><p className={styles.principleEyebrow}>02 / THE PLUTEN WAY</p><h2 className={styles.principleTitle}>Useful.</h2></div><p className={styles.principleCopy}>We believe useful products should move you forward. No noise. No filler. Just things worth building, buying and learning.</p></div></section>

      <footer className={styles.footer}><div className={styles.footerInner}>
        <Link href="/" className={styles.footerBrand}><img src="/favicon.ico" alt="Pluten" />PLUTEN</Link>
        <div className={styles.footerLinks}>
          <Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refund-policy">Refunds</Link><Link href="/contact">Contact</Link>
          <a href="https://www.instagram.com/pluten/" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
        <span className={styles.footerCopyright}>© {new Date().getFullYear()} PLUTEN</span>
      </div></footer>
    </main>
  );
}

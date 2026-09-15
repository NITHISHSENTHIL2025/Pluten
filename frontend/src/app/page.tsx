import Link from 'next/link';
import { ArrowRight, BadgeCheck, Download, LockKeyhole } from 'lucide-react';
import { InstagramIcon } from '@/components/InstagramIcon';
import PlutenNav from '@/components/PlutenNav';
import ProductCard from '@/components/ProductCard';
import ProductsJumpLink from '@/components/ProductsJumpLink';
import PortfolioShowcase from '@/components/PortfolioShowcase';
import MotionReveal from '@/components/MotionReveal';
import PlutenMotion from '@/components/system/PlutenMotion';
import styles from './page.module.css';

interface Product {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  thumbnail: string | null;
  createdAt: string;
  originalPrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  discountPercent?: number;
  discountLabel?: string | null;
}

interface CatalogResponse {
  data: Product[];
  pagination?: { total: number; totalPages: number };
}

async function getProducts(): Promise<CatalogResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (!baseUrl) return { data: [], pagination: { total: 0, totalPages: 1 } };

  try {
    const response = await fetch(`${baseUrl}/products?limit=24`, {
      next: { revalidate: 60, tags: ['products'] },
    });

    if (!response.ok) return { data: [], pagination: { total: 0, totalPages: 1 } };

    const payload = await response.json();
    return {
      data: Array.isArray(payload?.data) ? payload.data : [],
      pagination: payload?.pagination || { total: 0, totalPages: 1 },
    };
  } catch {
    return { data: [], pagination: { total: 0, totalPages: 1 } };
  }
}

const heroDetails = [
  {
    number: '01',
    title: 'Free portfolio maker',
    copy: 'Build and publish one clean professional presence for your work.',
  },
  {
    number: '02',
    title: 'Useful digital products',
    copy: 'Focused resources for learning, interviews and practical progress.',
  },
  {
    number: '03',
    title: 'One personal library',
    copy: 'Keep every purchase attached to your account and ready to access.',
  },
];

export default async function StorefrontPage() {
  const catalog = await getProducts();
  const products = catalog.data;
  const total = Number(catalog.pagination?.total || products.length);

  return (
    <main className={styles.page}>
      <PlutenNav />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <MotionReveal className={styles.heroCopy}>
            <div className={styles.heroKicker}>
              <span aria-hidden="true" />
              PLUTEN V1 · PROFESSIONAL PRESENCE
            </div>

            <h1 className={styles.heroTitle}>
              Build your presence.
              <span>Keep moving forward.</span>
            </h1>

            <p className={styles.heroDescription}>
              A focused home for a free portfolio maker and practical digital products,
              built for students and creators who want their work presented properly.
            </p>

            <div className={styles.heroActions}>
              <Link href="/portfolio" className={styles.primaryCta}>
                Create free portfolio <ArrowRight size={16} />
              </Link>
              <ProductsJumpLink className={styles.secondaryLink}>
                Explore products <ArrowRight size={15} />
              </ProductsJumpLink>
            </div>

            <div className={styles.heroTrust}>
              <span><BadgeCheck size={14} /> Free to start</span>
              <span><LockKeyhole size={14} /> Secure checkout</span>
              <span><Download size={14} /> Library access</span>
            </div>
          </MotionReveal>

          <MotionReveal className={styles.heroAside} delay={0.08} y={14}>
            <p className={styles.asideLabel}>WHAT YOU CAN DO WITH PLUTEN</p>
            <div className={styles.asideList}>
              {heroDetails.map((item) => (
                <div className={styles.asideItem} key={item.number}>
                  <span className={styles.asideNumber}>{item.number}</span>
                  <div>
                    <h2>{item.title}</h2>
                    <p>{item.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </MotionReveal>
        </div>
      </section>

      <section className={styles.principles} aria-label="Pluten principles">
        <div className={styles.principlesInner}>
          <span><b>01</b> Useful over noisy</span>
          <span><b>02</b> Simple over complicated</span>
          <span><b>03</b> Your work, presented properly</span>
        </div>
      </section>

      <section id="products" className={styles.productsSection}>
        <div className={styles.sectionInner}>
          <MotionReveal className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>PLUTEN / DIGITAL PRODUCTS</p>
              <h2 className={styles.sectionTitle}>Useful things, kept simple.</h2>
              <p className={styles.sectionIntro}>
                Practical digital products with immediate access through your Pluten library.
              </p>
            </div>
            <span className={styles.sectionMeta}>{total} available</span>
          </MotionReveal>

          {products.length === 0 ? (
            <div className={styles.state}>
              <PlutenMotion state="error" size={64} label="Catalog unavailable" />
              <h3>Catalog temporarily unavailable.</h3>
              <p>The storefront could not load products right now. Your account and library are unaffected.</p>
              <Link href="/" className={styles.stateAction}>Refresh</Link>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {products.map((product, index) => (
                <MotionReveal key={product.id} delay={Math.min(index * 0.035, 0.18)}>
                  <ProductCard product={product} />
                </MotionReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <PortfolioShowcase />

      <section className={styles.businessSection}>
        <div className={styles.businessInner}>
          <MotionReveal className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>ONE ACCOUNT · ONE PLACE</p>
              <h2 className={styles.businessTitle}>Create. Buy. Keep moving.</h2>
            </div>
          </MotionReveal>

          <div className={styles.businessGrid}>
            <MotionReveal className={styles.businessItem}>
              <span className={styles.cardNumber}>01</span>
              <h3>Build your portfolio</h3>
              <p>Create a public professional page for your projects, experience and skills. Free to start.</p>
              <Link href="/portfolio">Start building <ArrowRight size={15} /></Link>
            </MotionReveal>

            <MotionReveal className={styles.businessItem} delay={0.05}>
              <span className={styles.cardNumber}>02</span>
              <h3>Own useful products</h3>
              <p>Checkout is verified server-side and each purchase stays attached to your Pluten account.</p>
              <ProductsJumpLink>Browse products <ArrowRight size={15} /></ProductsJumpLink>
            </MotionReveal>

            <MotionReveal className={styles.businessItem} delay={0.1}>
              <span className={styles.cardNumber}>03</span>
              <h3>Get real support</h3>
              <p>Order, product and portfolio problems can be tracked with a clear support reference.</p>
              <Link href="/support">Get support <ArrowRight size={15} /></Link>
            </MotionReveal>
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <MotionReveal className={styles.finalInner}>
          <span className={styles.finalEyebrow}>PLUTEN / START HERE</span>
          <h2>Build something worth showing.</h2>
          <p>Start with a free portfolio and make it the link you are confident to send.</p>
          <div className={styles.finalActions}>
            <Link href="/portfolio" className={styles.lightCta}>
              Create your portfolio <ArrowRight size={16} />
            </Link>
            <a
              href="https://www.instagram.com/pluten.official/"
              target="_blank"
              rel="noreferrer"
              className={styles.finalLink}
            >
              <InstagramIcon size={15} /> @pluten.official
            </a>
          </div>
        </MotionReveal>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <Link href="/" className={styles.footerBrand}>
              <img src="/favicon.ico" alt="" /> PLUTEN
            </Link>
            <p>Useful products. Better professional presence.</p>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/portfolio">Portfolio</Link>
            <Link href="/library">Library</Link>
            <Link href="/support">Support</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/refund-policy">Refunds</Link>
            <a href="https://www.instagram.com/pluten.official/" target="_blank" rel="noreferrer">Instagram</a>
          </div>
          <span className={styles.footerCopyright}>© {new Date().getFullYear()} PLUTEN</span>
        </div>
      </footer>
    </main>
  );
}

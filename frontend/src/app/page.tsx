import Link from 'next/link';
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Download, LockKeyhole, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { InstagramIcon } from "@/components/InstagramIcon";
import PlutenNav from '@/components/PlutenNav';
import ProductCard from '@/components/ProductCard';
import PortfolioShowcase from '@/components/PortfolioShowcase';
import MotionReveal from '@/components/MotionReveal';
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

  return <main className={styles.page}>
    <PlutenNav />

    <section className={styles.hero}>
      <div className={styles.heroGlow} aria-hidden="true"/>
      <div className={styles.heroInner}>
        <MotionReveal className={styles.heroCopy}>
          <div className={styles.heroBadge}><Sparkles size={14}/> PLUTEN V1 · CREATE YOUR EDGE</div>
          <h1 className={styles.heroTitle}>Build your presence.<br/><span>Own your progress.</span></h1>
          <p className={styles.heroDescription}>A focused home for useful digital products and a free portfolio maker built to help students and creators present their work properly.</p>
          <div className={styles.heroActions}>
            <Link href="/portfolio" className={styles.primaryCta}>Create free portfolio <ArrowRight size={17}/></Link>
            <Link href="#products" className={styles.secondaryCta}>Explore products</Link>
          </div>
          <div className={styles.heroTrust}><span><BadgeCheck size={15}/> Free portfolio maker</span><span><LockKeyhole size={15}/> Secure checkout</span><span><Download size={15}/> Instant library access</span></div>
        </MotionReveal>

        <MotionReveal className={styles.heroStage} delay={0.08} y={18}>
          <div className={styles.stageGlass}>
            <div className={styles.stageTop}><span>PLUTEN / PROFESSIONAL PRESENCE</span><span className={styles.liveDot}>LIVE</span></div>
            <div className={styles.previewWindow}>
              <div className={styles.previewNav}><span className={styles.previewMark}>P</span><span>YOUR NAME</span><span className={styles.previewMini}>Portfolio</span></div>
              <div className={styles.previewBody}>
                <span className={styles.previewEyebrow}>DESIGN · BUILD · SHARE</span>
                <strong>Your work deserves<br/>a proper first impression.</strong>
                <p>Publish one polished link for projects, skills, experience and your story.</p>
                <span className={styles.previewButton}>View portfolio →</span>
              </div>
            </div>
            <div className={styles.floatingCardA}><BriefcaseBusiness size={17}/><div><small>PORTFOLIO</small><strong>Publish in minutes</strong></div></div>
            <div className={styles.floatingCardB}><Zap size={17}/><div><small>DIGITAL LIBRARY</small><strong>Access after purchase</strong></div></div>
          </div>
        </MotionReveal>
      </div>
    </section>

    <section className={styles.valueStrip} aria-label="Pluten principles">
      <div className={styles.valueInner}><span>01 · USEFUL OVER NOISY</span><span>02 · SIMPLE OVER COMPLICATED</span><span>03 · YOUR WORK, PRESENTED PROPERLY</span></div>
    </section>

    <section id="products" className={styles.productsSection}>
      <div className={styles.sectionInner}>
        <MotionReveal className={styles.sectionHeader}>
          <div><p className={styles.sectionEyebrow}>PLUTEN / DIGITAL PRODUCTS</p><h2 className={styles.sectionTitle}>Things worth keeping.</h2><p className={styles.sectionIntro}>Practical digital products with immediate access through your Pluten library.</p></div>
          <span className={styles.sectionMeta}>{total} available</span>
        </MotionReveal>
        {products.length === 0 ? <div className={styles.state}><RefreshCw size={21}/><h3>Catalog temporarily unavailable.</h3><p>The storefront could not load products right now. Your account and library are unaffected.</p><Link href="/" className={styles.stateAction}>Refresh</Link></div> : <div className={styles.productGrid}>{products.map((product, index) => <MotionReveal key={product.id} delay={Math.min(index * .035, .18)}><ProductCard product={product}/></MotionReveal>)}</div>}
      </div>
    </section>

    <PortfolioShowcase />

    <section className={styles.businessSection}>
      <div className={styles.businessInner}>
        <MotionReveal><p className={styles.sectionEyebrow}>ONE ACCOUNT · ONE PLACE</p><h2 className={styles.businessTitle}>Create. Buy. Keep moving.</h2></MotionReveal>
        <div className={styles.businessGrid}>
          <MotionReveal className={styles.businessCard}><span className={styles.cardNumber}>01</span><h3>Build your portfolio</h3><p>Create a public professional page for your projects, experience and skills. Free to start.</p><Link href="/portfolio">Start building <ArrowRight size={15}/></Link></MotionReveal>
          <MotionReveal className={styles.businessCard} delay={.05}><span className={styles.cardNumber}>02</span><h3>Own useful products</h3><p>Checkout is verified server-side and your purchase is attached to your Pluten account.</p><Link href="#products">Browse products <ArrowRight size={15}/></Link></MotionReveal>
          <MotionReveal className={styles.businessCard} delay={.1}><span className={styles.cardNumber}>03</span><h3>Get real support</h3><p>Order, product and portfolio problems can be tracked with a support reference.</p><Link href="/support">Get support <ArrowRight size={15}/></Link></MotionReveal>
        </div>
      </div>
    </section>

    <section className={styles.finalCta}>
      <MotionReveal className={styles.finalGlass}>
        <span className={styles.finalEyebrow}>PLUTEN / START HERE</span>
        <h2>Your next first impression<br/>can be better than the last.</h2>
        <p>Build your portfolio free, then make it the link you are proud to send.</p>
        <div className={styles.heroActions}><Link href="/portfolio" className={styles.primaryCta}>Create your portfolio <ArrowRight size={17}/></Link><a href="https://www.instagram.com/pluten.official/" target="_blank" rel="noreferrer" className={styles.secondaryCta}><InstagramIcon size={16}/> @pluten.official</a></div>
      </MotionReveal>
    </section>

    <footer className={styles.footer}><div className={styles.footerInner}>
      <div><Link href="/" className={styles.footerBrand}><img src="/favicon.ico" alt=""/>PLUTEN</Link><p>Useful products. Better professional presence.</p></div>
      <div className={styles.footerLinks}><Link href="/portfolio">Portfolio</Link><Link href="/library">Library</Link><Link href="/support">Support</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refund-policy">Refunds</Link><a href="https://www.instagram.com/pluten.official/" target="_blank" rel="noreferrer">Instagram</a></div>
      <span className={styles.footerCopyright}>© {new Date().getFullYear()} PLUTEN</span>
    </div></footer>
  </main>;
}

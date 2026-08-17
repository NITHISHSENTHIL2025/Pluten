import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import styles from '../app/page.module.css';

interface Product {
  id: string; title: string; price: number | string; thumbnail: string | null; category?: string;
  originalPrice?: number; finalPrice?: number; discountAmount?: number; discountLabel?: string | null;
}

export default function ProductCard({ product }: { product: Product }) {
  const originalPrice = Number(product.originalPrice ?? product.price) || 0;
  const finalPrice = Number(product.finalPrice ?? originalPrice) || 0;
  const discountAmount = Number(product.discountAmount ?? Math.max(0, originalPrice - finalPrice));
  const hasDiscount = discountAmount > 0;

  return (
    <article className={styles.productCard}>
      <Link href={`/product/${product.id}`} className={styles.productCardLink} aria-label={`View ${product.title}`}>
        <div className={styles.productVisual}>
          {product.thumbnail ? <img src={product.thumbnail} alt={product.title} className={styles.cardImage} loading="lazy" /> : <div className={styles.cardImageFallback} aria-hidden="true">PLUTEN</div>}
          {hasDiscount && <span className={styles.offerBadge}>{product.discountLabel || 'OFFER'}</span>}
        </div>
        <div className={styles.productMeta}>
          <span className={styles.productCategory}>{product.category || 'Digital product'}</span>
          <h3 className={styles.cardTitle}>{product.title}</h3>
          <div className={styles.cardBottom}>
            <div className={styles.priceBlock}><span className={styles.currentPrice}>₹{finalPrice.toLocaleString('en-IN')}</span>{hasDiscount && <span className={styles.originalPrice}>₹{originalPrice.toLocaleString('en-IN')}</span>}</div>
            <span className={styles.viewLabel}>VIEW <ArrowUpRight size={14} /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}

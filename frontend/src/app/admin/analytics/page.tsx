'use client';
import { useEffect, useState } from 'react';
import { Activity, Briefcase, Eye, Loader2, RefreshCw, TrendingUp, Users } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { CAPABILITIES, can, isAdminRole, type AdminRole } from '@/lib/adminPermissions';
import styles from '../admin.module.css';

const money = (v: number) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function AnalyticsPage() {
  const [role, setRole] = useState<AdminRole | null>(null);
  const [range, setRange] = useState('30d');
  const [products, setProducts] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/auth/me').then((response) => {
      const next = response.data?.user?.role;
      if (isAdminRole(next)) setRole(next);
    }).catch(() => setRole(null));
  }, []);

  useEffect(() => {
    if (!role) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const requests: Promise<any>[] = [apiClient.get('/admin/analytics/portfolios', { params: { range } })];
        const includeProducts = can(role, CAPABILITIES.productAnalytics);
        if (includeProducts) requests.unshift(apiClient.get('/admin/analytics/products', { params: { range } }));
        const responses = await Promise.all(requests);
        if (!active) return;
        if (includeProducts) {
          setProducts(responses[0].data?.data || []);
          setPortfolio(responses[1].data);
        } else {
          setProducts([]);
          setPortfolio(responses[0].data);
        }
        setError('');
      } catch (e: any) {
        if (active) setError(e?.response?.data?.error || 'Unable to load analytics.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [range, role]);

  return <main className={styles.dashboardContainer}>
    <div className={styles.header}><div><p className={styles.pageEyebrow}>PLUTEN / ANALYTICS</p><h1 className={styles.pageTitle}>Analytics.</h1></div><div className={styles.rangeBar}>{['today','7d','30d','90d'].map((r) => <button key={r} className={`${styles.rangeBtn} ${range === r ? styles.rangeBtnActive : ''}`} onClick={() => setRange(r)}>{r === 'today' ? 'Today' : r.toUpperCase()}</button>)}</div></div>
    {loading ? <div className={styles.authLoading}><Loader2 className={styles.spin}/><span>Loading analytics</span></div> : error ? <div className={styles.errorState}><p>{error}</p><button className={styles.primaryButton} onClick={() => setRange((v) => v)}><RefreshCw size={14}/> Retry</button></div> : <>
      <div className={styles.metricGrid}>
        <div className={styles.metricCard}><span className={styles.metricLabel}>Portfolio views</span><strong className={styles.metricValue}>{portfolio?.totals?.views || 0}</strong><span className={styles.metricTrendUp}><Eye size={13}/> {portfolio?.totals?.uniqueViewers || 0} unique</span></div>
        <div className={styles.metricCard}><span className={styles.metricLabel}>Portfolios</span><strong className={styles.metricValue}>{portfolio?.totals?.total || 0}</strong><span className={styles.metricTrendUp}><Briefcase size={13}/> {portfolio?.totals?.published || 0} published</span></div>
        <div className={styles.metricCard}><span className={styles.metricLabel}>Activation</span><strong className={styles.metricValue}>{Number(portfolio?.totals?.activationRate || 0).toFixed(1)}%</strong><span className={styles.metricTrendUp}><Users size={13}/> users with portfolio</span></div>
        <div className={styles.metricCard}><span className={styles.metricLabel}>Created</span><strong className={styles.metricValue}>{portfolio?.totals?.created || 0}</strong><span className={styles.metricTrendUp}><TrendingUp size={13}/> selected period</span></div>
        <div className={styles.metricCard}><span className={styles.metricLabel}>Drafts</span><strong className={styles.metricValue}>{portfolio?.totals?.drafts || 0}</strong><span className={styles.metricTrendUp}><Activity size={13}/> current backlog</span></div>
      </div>
      {can(role, CAPABILITIES.productAnalytics) && <section className={styles.tableCard} style={{ marginTop: 14 }}><div className={styles.panelHead}><div><div className={styles.panelTitle}>Product performance</div><div className={styles.panelSub}>Views, buyers and conversion</div></div></div><div className={styles.tableWrap}><table className={styles.liveTable}><thead><tr><th>Product</th><th>Views</th><th>Unique</th><th>Orders</th><th>Conversion</th><th>Revenue</th></tr></thead><tbody>{products.map((p) => <tr key={p.id}><td><strong>{p.title}</strong></td><td>{p.views}</td><td>{p.uniqueViewers}</td><td>{p.orders}</td><td>{p.conversion}%</td><td>{money(p.revenue)}</td></tr>)}</tbody></table></div></section>}
      <div className={styles.grid2}><section className={styles.panel}><div className={styles.panelHead}><div><div className={styles.panelTitle}>Portfolio templates</div><div className={styles.panelSub}>Current usage</div></div></div><div className={styles.panelBody}>{(portfolio?.templates || []).map((t: any) => <div className={styles.split} key={t.template}><span>{t.template}</span><strong>{t.value}</strong></div>)}</div></section><section className={styles.panel}><div className={styles.panelHead}><div><div className={styles.panelTitle}>Account activation</div><div className={styles.panelSub}>Portfolio adoption</div></div></div><div className={styles.panelBody}><div className={styles.split}><span>With portfolio</span><strong>{portfolio?.totals?.usersWithPortfolio || 0}</strong></div><div className={styles.split}><span>Without portfolio</span><strong>{portfolio?.totals?.usersWithoutPortfolio || 0}</strong></div><div className={styles.split}><span>Activation rate</span><strong>{Number(portfolio?.totals?.activationRate || 0).toFixed(1)}%</strong></div></div></section></div>
    </>}
  </main>;
}

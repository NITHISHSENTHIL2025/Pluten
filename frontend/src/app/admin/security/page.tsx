'use client';
import { useEffect, useState } from 'react';
import { Download, FileClock, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { CAPABILITIES, can, isAdminRole, type AdminRole } from '@/lib/adminPermissions';
import styles from '../admin.module.css';

function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, padding: 12 }}><button className={styles.iconBtn} disabled={page <= 1} onClick={() => onChange(page - 1)}>←</button><span style={{ fontSize: 10, padding: '8px 4px' }}>Page {page} / {totalPages}</span><button className={styles.iconBtn} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>→</button></div>;
}

export default function SecurityPage() {
  const [role, setRole] = useState<AdminRole | null>(null);
  const [tab, setTab] = useState<'audit'|'downloads'>('downloads');
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { apiClient.get('/auth/me').then((r) => { const next = r.data?.user?.role; if (isAdminRole(next)) { setRole(next); if (can(next, CAPABILITIES.audit)) setTab('audit'); } }).catch(() => null); }, []);

  const load = async (p = page) => {
    if (!role) return;
    const target = tab === 'audit' && can(role, CAPABILITIES.audit) ? '/admin/security/audit' : '/admin/security/downloads';
    setLoading(true);
    try { const r = await apiClient.get(target, { params: { page: p, limit: 30 } }); setRows(r.data?.data || []); setPagination(r.data?.pagination || { totalPages: 1 }); setPage(p); setError(''); }
    catch (e: any) { setError(e?.response?.data?.error || 'Unable to load security records.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (role) load(1); }, [tab, role]);

  const auditAllowed = can(role, CAPABILITIES.audit);
  return <main className={styles.dashboardContainer}><div className={styles.header}><div><p className={styles.pageEyebrow}>PLUTEN / SECURITY</p><h1 className={styles.pageTitle}>Security.</h1></div><ShieldCheck size={18}/></div><div className={styles.pageToolbar}><div className={styles.rangeBar}>{auditAllowed && <button className={`${styles.rangeBtn} ${tab === 'audit' ? styles.rangeBtnActive : ''}`} onClick={() => setTab('audit')}><FileClock size={13}/> Audit logs</button>}<button className={`${styles.rangeBtn} ${tab === 'downloads' ? styles.rangeBtnActive : ''}`} onClick={() => setTab('downloads')}><Download size={13}/> Downloads</button></div></div>
  {loading ? <div className={styles.authLoading}><Loader2 className={styles.spin}/><span>Loading security records</span></div> : error ? <div className={styles.errorState}><p>{error}</p><button className={styles.primaryButton} onClick={() => load(1)}><RefreshCw size={14}/> Retry</button></div> : <section className={styles.tableCard}><div className={styles.tableWrap}><table className={styles.liveTable}>{tab === 'audit' && auditAllowed ? <><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Entity ID</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{new Date(r.createdAt).toLocaleString('en-IN')}</td><td>{r.user?.email || '—'}</td><td><span className={styles.statusPill}>{r.action}</span></td><td>{r.entity}</td><td className={styles.mono}>{r.entityId}</td></tr>)}</tbody></> : <><thead><tr><th>Time</th><th>Customer</th><th>Product</th><th>IP</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{new Date(r.createdAt).toLocaleString('en-IN')}</td><td>{r.user?.email || '—'}</td><td>{r.product?.title || '—'}</td><td className={styles.mono}>{r.ipAddress || '—'}</td></tr>)}</tbody></>}</table></div><Pager page={pagination.page || page} totalPages={pagination.totalPages || 1} onChange={load}/></section>}
  </main>;
}

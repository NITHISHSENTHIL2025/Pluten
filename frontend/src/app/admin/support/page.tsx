'use client';
import { useEffect, useState } from 'react';
import { Headphones, Loader2, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import styles from '../admin.module.css';

export default function SupportAdminPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try { const r = await apiClient.get('/support/admin', { params: { limit: 60 } }); setRows(r.data?.data || []); setError(''); }
    catch (e: any) { setError(e?.response?.data?.error || 'Unable to load support requests.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const change = async (id: string, status: string) => { await apiClient.patch(`/support/admin/${id}`, { status }); await load(); };

  return <main className={styles.dashboardContainer}><div className={styles.header}><div><p className={styles.pageEyebrow}>PLUTEN / SUPPORT</p><h1 className={styles.pageTitle}>Support inbox.</h1></div><Headphones size={18}/></div>
    {loading ? <div className={styles.authLoading}><Loader2 className={styles.spin}/><span>Loading requests</span></div> : error ? <div className={styles.errorState}><p>{error}</p><button className={styles.primaryButton} onClick={load}><RefreshCw size={14}/> Retry</button></div> : <section className={styles.tableCard}><div className={styles.tableWrap}><table className={styles.liveTable}><thead><tr><th>Ticket</th><th>Customer</th><th>Category</th><th>Subject</th><th>Status</th><th>Created</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td className={styles.mono}>{r.ticketNumber}</td><td><strong>{r.name}</strong><br/><span>{r.email}</span></td><td>{r.category}</td><td><strong>{r.subject}</strong><br/><span>{r.message.slice(0, 100)}{r.message.length > 100 ? '…' : ''}</span>{r.orderReference && <><br/><span className={styles.mono}>Order: {r.orderReference}</span></>}</td><td><select value={r.status} onChange={(e) => change(r.id, e.target.value)}><option>OPEN</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>CLOSED</option></select></td><td>{new Date(r.createdAt).toLocaleString('en-IN')}</td></tr>)}</tbody></table></div></section>}
  </main>;
}

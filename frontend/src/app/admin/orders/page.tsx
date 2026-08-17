"use client";
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Loader2, Search, XCircle } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import styles from '../admin.module.css';

type Order = { id:string; totalAmount:number; status:string; transactionId:string; createdAt:string; user:{email:string;firstName:string|null;lastName:string|null}; product:{title:string} };
type PageState = { page:number; limit:number; total:number; totalPages:number };

export default function AdminOrdersPage(){
  const [rows,setRows]=useState<Order[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [query,setQuery]=useState('');
  const [pagination,setPagination]=useState<PageState>({page:1,limit:25,total:0,totalPages:1});

  const load=async(page=1)=>{setLoading(true);setError('');try{const res=await apiClient.get('/admin/orders',{params:{page,limit:25,search:query.trim()}});setRows(Array.isArray(res.data?.data)?res.data.data:[]);setPagination(res.data?.pagination||{page,limit:25,total:0,totalPages:1});}catch(err:any){setError(err?.response?.data?.error||'Unable to load the financial ledger.');}finally{setLoading(false);}};
  useEffect(()=>{const timer=setTimeout(()=>load(1),250);return()=>clearTimeout(timer);},[query]);

  const icon=(status:string)=>status==='SUCCESS'?<CheckCircle2 size={15}/>:status==='PENDING'?<Clock size={15}/>:<XCircle size={15}/>;
  return <main className={styles.dashboardContainer}>
    <div className={styles.header}><div><p className={styles.pageEyebrow}>PLUTEN / PAYMENTS</p><h1 className={styles.pageTitle}>Orders</h1></div><span className={styles.topbarRole}>{pagination.total} records</span></div>
    <div className={styles.pageToolbar}><div style={{display:'flex',alignItems:'center',gap:8,width:'min(440px,100%)'}}><Search size={15}/><input className={styles.toolbarSearch} placeholder="Search transaction, email or product..." value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
    {loading?<div className={styles.authLoading}><Loader2 size={28} className="pluten-login-spinner"/><span>Loading ledger</span></div>:error?<div className={styles.errorState}><AlertCircle size={22}/><h2>Financial ledger unavailable.</h2><p>{error}</p><button className={styles.primaryButton} onClick={()=>load(pagination.page)}>Retry</button></div>:rows.length===0?<div className={styles.emptyState}><h2>No orders found.</h2><p>Try a different search.</p></div>:<>
      <div className={styles.tableCard}><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th className={styles.th}>Order</th><th className={styles.th}>Customer</th><th className={styles.th}>Product</th><th className={styles.th}>Amount</th><th className={styles.th}>Status</th><th className={styles.th}>Date</th></tr></thead><tbody>{rows.map(o=><tr key={o.id}><td className={styles.td}><span style={{fontFamily:'ui-monospace,monospace',fontSize:10,color:'#85857e'}}>{o.transactionId||o.id.slice(0,12)}</span></td><td className={styles.td}>{o.user?.email||'—'}</td><td className={styles.td}><strong>{o.product?.title||'Unknown product'}</strong></td><td className={styles.td}>₹{Number(o.totalAmount).toLocaleString('en-IN')}</td><td className={styles.td}><span style={{display:'inline-flex',alignItems:'center',gap:6}}>{icon(o.status)}{o.status}</span></td><td className={styles.td}>{new Date(o.createdAt).toLocaleString('en-IN')}</td></tr>)}</tbody></table></div></div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginTop:16,color:'#777',fontSize:11}}><span>Page {pagination.page} of {pagination.totalPages}</span><div style={{display:'flex',gap:6}}><button className={styles.iconBtn} disabled={pagination.page<=1} onClick={()=>load(pagination.page-1)}><ChevronLeft size={16}/></button><button className={styles.iconBtn} disabled={pagination.page>=pagination.totalPages} onClick={()=>load(pagination.page+1)}><ChevronRight size={16}/></button></div></div>
    </>}
  </main>;
}

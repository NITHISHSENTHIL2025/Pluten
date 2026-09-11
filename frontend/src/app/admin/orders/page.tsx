'use client';
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Loader2, RefreshCw, Search, XCircle } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { formatIndiaDate } from '@/lib/format';
import styles from '../admin.module.css';

type Refund = { amount:number; status:string };
type Order = { id:string; totalAmount:number; originalAmount?:number|null; discountAmount?:number|null; status:string; gateway?:string|null; transactionId?:string|null; gatewayOrderId?:string|null; gatewayPaymentId?:string|null; paymentFailureReason?:string|null; createdAt:string; paidAt?:string|null; refunds?:Refund[]; user:{email:string;firstName:string|null;lastName:string|null}; product:{title:string} };
type PageState = { page:number; limit:number; total:number; totalPages:number };

function statusIcon(status:string){
  if(['SUCCESS','PARTIALLY_REFUNDED','REFUNDED'].includes(status)) return <CheckCircle2 size={14}/>;
  if(status==='PENDING') return <Clock size={14}/>;
  return <XCircle size={14}/>;
}

export default function AdminOrdersPage(){
  const [rows,setRows]=useState<Order[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [query,setQuery]=useState('');
  const [pagination,setPagination]=useState<PageState>({page:1,limit:25,total:0,totalPages:1}); const [refunding,setRefunding]=useState<string|null>(null);
  const load=async(page=1)=>{setLoading(true);setError('');try{const res=await apiClient.get('/admin/orders',{params:{page,limit:25,search:query.trim()}});setRows(res.data?.data||[]);setPagination(res.data?.pagination||{page,limit:25,total:0,totalPages:1});}catch(err:any){setError(err?.response?.data?.error||'Unable to load the financial ledger.');}finally{setLoading(false)}};
  useEffect(()=>{const timer=setTimeout(()=>load(1),250);return()=>clearTimeout(timer)},[query]);
  const refund=async(order:Order)=>{
    if(!['SUCCESS','PARTIALLY_REFUNDED'].includes(order.status)||refunding)return;
    const committed=(order.refunds||[]).filter((r)=>['SUCCESS','PENDING'].includes(r.status)).reduce((sum,r)=>sum+Number(r.amount||0),0);
    const remaining=Math.max(0,Number(order.totalAmount||0)-committed);
    if(remaining<=0){window.alert('No refundable amount remains on this order.');return;}
    const amount=window.prompt(`Refund amount (remaining ₹${remaining.toFixed(2)})`,remaining.toFixed(2)); if(amount===null)return;
    const value=Number(amount); if(!Number.isFinite(value)||value<=0||value>remaining){window.alert('Enter a valid amount within the remaining refundable balance.');return;}
    const note=window.prompt('Refund note','Customer refund')||'Customer refund'; setRefunding(order.id);
    try{const response=await apiClient.post(`/payments/refund/${order.id}`,{amount:value,note});if(response.status===202)window.alert('Refund request is pending gateway confirmation. Pluten will reconcile it automatically.');await load(pagination.page)}catch(err:any){window.alert(err?.response?.data?.error||'Refund failed.')}finally{setRefunding(null)}
  };
  return <main className={styles.dashboardContainer}>
    <div className={styles.header}><div><p className={styles.pageEyebrow}>PLUTEN / PAYMENTS</p><h1 className={styles.pageTitle}>Orders.</h1></div><span className={styles.topbarRole}>{pagination.total} records</span></div>
    <div className={styles.pageToolbar}><div style={{display:'flex',alignItems:'center',gap:8,width:'min(440px,100%)'}}><Search size={15}/><input className={styles.toolbarSearch} placeholder="Search order, payment, email or product..." value={query} onChange={(e)=>setQuery(e.target.value)}/></div></div>
    {loading?<div className={styles.authLoading}><Loader2 className={styles.spin} size={28}/><span>Loading financial ledger</span></div>:error?<div className={styles.errorState}><AlertCircle size={22}/><h2>Financial ledger unavailable.</h2><p>{error}</p><button className={styles.primaryButton} onClick={()=>load(pagination.page)}><RefreshCw size={14}/> Retry</button></div>:rows.length===0?<div className={styles.emptyState}><h2>No orders found.</h2><p>Try a different search.</p></div>:<>
      <div className={styles.tableCard}><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th className={styles.th}>Order</th><th className={styles.th}>Customer</th><th className={styles.th}>Product</th><th className={styles.th}>Amount</th><th className={styles.th}>Gateway</th><th className={styles.th}>Status</th><th className={styles.th}>Date</th><th className={styles.th}>Action</th></tr></thead><tbody>{rows.map((o)=><tr key={o.id}><td className={styles.td}><span className={styles.mono}>{o.id.slice(0,12)}</span><div className={styles.sub}>{o.gatewayPaymentId||o.transactionId||'Awaiting payment'}</div></td><td className={styles.td}>{o.user?.email||'—'}</td><td className={styles.td}><strong>{o.product?.title||'Unknown product'}</strong></td><td className={styles.td}><strong>₹{Number(o.totalAmount).toLocaleString('en-IN',{maximumFractionDigits:2})}</strong>{Number(o.discountAmount||0)>0&&<div className={styles.sub}>-₹{Number(o.discountAmount).toLocaleString('en-IN')} discount</div>}{(o.refunds||[]).some((r)=>r.status==='SUCCESS')&&<div className={styles.sub}>Refunded ₹{(o.refunds||[]).filter((r)=>r.status==='SUCCESS').reduce((n,r)=>n+Number(r.amount||0),0).toLocaleString('en-IN')}</div>}</td><td className={styles.td}>{o.gateway||'—'}</td><td className={styles.td}><span style={{display:'inline-flex',alignItems:'center',gap:6}}>{statusIcon(o.status)}{o.status}</span>{o.paymentFailureReason&&<div className={styles.sub}>{o.paymentFailureReason}</div>}</td><td className={styles.td}>{formatIndiaDate(o.paidAt||o.createdAt)}</td><td className={styles.td}>{['SUCCESS','PARTIALLY_REFUNDED'].includes(o.status)?<button className={styles.iconBtn} disabled={refunding===o.id} onClick={()=>refund(o)} title="Refund order">{refunding===o.id?<Loader2 className={styles.spin} size={14}/>:<RefreshCw size={14}/>}</button>:null}</td></tr>)}</tbody></table></div></div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginTop:16,color:'#777',fontSize:11}}><span>Page {pagination.page} of {pagination.totalPages}</span><div style={{display:'flex',gap:6}}><button className={styles.iconBtn} disabled={pagination.page<=1} onClick={()=>load(pagination.page-1)}><ChevronLeft size={16}/></button><button className={styles.iconBtn} disabled={pagination.page>=pagination.totalPages} onClick={()=>load(pagination.page+1)}><ChevronRight size={16}/></button></div></div>
    </>}
  </main>;
}

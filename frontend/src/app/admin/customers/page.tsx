"use client";
import { useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Search, Users } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { formatIndiaDate } from '@/lib/format';
import styles from '../admin.module.css';

type Customer={id:string;email:string;firstName:string|null;lastName:string|null;isPremium:boolean;createdAt:string;_count?:{orders:number}};
type Pagination={page:number;limit:number;total:number;totalPages:number};

export default function AdminCustomersPage(){
  const [rows,setRows]=useState<Customer[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[query,setQuery]=useState('');
  const [pagination,setPagination]=useState<Pagination>({page:1,limit:25,total:0,totalPages:1});
  const load=async(page=1)=>{setLoading(true);setError('');try{const res=await apiClient.get('/admin/customers',{params:{page,limit:25,search:query.trim()}});setRows(Array.isArray(res.data?.data)?res.data.data:[]);setPagination(res.data?.pagination||{page,limit:25,total:0,totalPages:1});}catch(err:any){setError(err?.response?.data?.error||'Unable to load customers.');}finally{setLoading(false);}};
  useEffect(()=>{const timer=setTimeout(()=>load(1),250);return()=>clearTimeout(timer);},[query]);
  return <main className={styles.dashboardContainer}>
    <div className={styles.header}><div><p className={styles.pageEyebrow}>PLUTEN / CUSTOMERS</p><h1 className={styles.pageTitle}>Customers</h1></div><div className={styles.topbarRole}><Users size={13}/> {pagination.total}</div></div>
    <div className={styles.pageToolbar}><div style={{display:'flex',alignItems:'center',gap:8,width:'min(440px,100%)'}}><Search size={15}/><input className={styles.toolbarSearch} placeholder="Search name or email..." value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
    {loading?<div className={styles.authLoading}><Loader2 size={28} className="pluten-login-spinner"/><span>Loading customers</span></div>:error?<div className={styles.errorState}><AlertCircle size={22}/><h2>Customer directory unavailable.</h2><p>{error}</p><button className={styles.primaryButton} onClick={()=>load(pagination.page)}>Retry</button></div>:rows.length===0?<div className={styles.emptyState}><Users size={24}/><h2>No customers found.</h2><p>Try a different search.</p></div>:<>
      <div className={styles.tableCard}><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th className={styles.th}>Customer</th><th className={styles.th}>Email</th><th className={styles.th}>Purchases</th><th className={styles.th}>Status</th><th className={styles.th}>Joined</th></tr></thead><tbody>{rows.map(c=><tr key={c.id}><td className={styles.td}><strong>{`${c.firstName||''} ${c.lastName||''}`.trim()||'Unnamed customer'}</strong></td><td className={styles.td}>{c.email}</td><td className={styles.td}>{c._count?.orders||0}</td><td className={styles.td}>{c.isPremium?'Premium':'Standard'}</td><td className={styles.td}>{formatIndiaDate(c.createdAt)}</td></tr>)}</tbody></table></div></div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginTop:16,color:'#777',fontSize:11}}><span>Page {pagination.page} of {pagination.totalPages}</span><div style={{display:'flex',gap:6}}><button className={styles.iconBtn} disabled={pagination.page<=1} onClick={()=>load(pagination.page-1)}><ChevronLeft size={16}/></button><button className={styles.iconBtn} disabled={pagination.page>=pagination.totalPages} onClick={()=>load(pagination.page+1)}><ChevronRight size={16}/></button></div></div>
    </>}
  </main>;
}

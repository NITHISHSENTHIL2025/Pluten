"use client";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, TrendingUp, Users, ShoppingCart, Crown } from "lucide-react";
import apiClient from "@/lib/apiClient";
import styles from "./admin.module.css";

interface Telemetry{revenue:number;premiumUsers:number;totalUsers:number;pendingOrders:number;}
export default function AdminDashboard(){
 const [data,setData]=useState<Telemetry|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null);const [retrying,setRetrying]=useState(false);
 const load=useCallback(async(retry=false)=>{if(retry)setRetrying(true);try{const res=await apiClient.get('/admin/telemetry');setData(res.data);setError(null);}catch(e){console.error(e);setError('Unable to synchronize mission-control telemetry.');}finally{setLoading(false);if(retry)setRetrying(false);}},[]);
 useEffect(()=>{load();const t=setInterval(()=>load(),30000);return()=>clearInterval(t);},[load]);
 if(loading&&!data)return <div className={styles.authLoading}><Loader2 className="pluten-login-spinner" size={30}/><span>Loading mission control</span></div>;
 return <main className={styles.dashboardContainer}><div className={styles.header}><div><p className={styles.pageEyebrow}>PLUTEN / OPERATIONS</p><h1 className={styles.pageTitle}>Overview</h1></div><span className={styles.topbarRole}>LIVE TELEMETRY</span></div>
 {error?<div className={styles.errorState}><AlertTriangle size={22}/><h2>Telemetry disconnected.</h2><p>{error}</p><button className={styles.primaryButton} onClick={()=>load(true)} disabled={retrying}>{retrying?<Loader2 className="pluten-login-spinner" size={16}/>:<RefreshCw size={16}/>} Retry</button></div>:<>
 <div className={styles.metricGrid}><div className={styles.metricCard}><span className={styles.metricLabel}>Revenue</span><strong className={styles.metricValue}>₹{Number(data?.revenue||0).toLocaleString('en-IN')}</strong><span className={styles.metricTrendUp}><TrendingUp size={14}/> Successful orders</span></div><div className={styles.metricCard}><span className={styles.metricLabel}>Customers</span><strong className={styles.metricValue}>{data?.totalUsers||0}</strong><span className={styles.metricTrendUp}><Users size={14}/> Customer accounts</span></div><div className={styles.metricCard}><span className={styles.metricLabel}>Premium</span><strong className={styles.metricValue}>{data?.premiumUsers||0}</strong><span className={styles.metricTrendUp}><Crown size={14}/> Premium members</span></div><div className={styles.metricCard}><span className={styles.metricLabel}>Pending orders</span><strong className={styles.metricValue}>{data?.pendingOrders||0}</strong><span className={styles.metricTrendDown}><ShoppingCart size={14}/> Needs attention</span></div></div>
 <section className={styles.tableCard}><div style={{padding:'22px'}}><div className={styles.pageEyebrow}>SYSTEM STATUS</div><h2 style={{margin:'8px 0 0',fontSize:'24px',letterSpacing:'-.03em'}}>Everything is monitored from one place.</h2><p style={{margin:'8px 0 0',color:'#777',fontSize:'13px',lineHeight:1.6}}>Telemetry refreshes automatically every 30 seconds. Use the navigation to manage orders, customers, products and offers.</p></div></section>
 </>}</main>;
}

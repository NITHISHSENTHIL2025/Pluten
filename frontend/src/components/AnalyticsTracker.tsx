'use client';
import {useEffect,useRef} from 'react';
import {usePathname} from 'next/navigation';
import {getAnalyticsIdentity,trackAnalytics} from '@/lib/analytics';

export default function AnalyticsTracker(){
  const pathname=usePathname();const lastPath=useRef('');
  useEffect(()=>{
    const path=`${pathname||'/'}${window.location.search||''}`;
    if(path===lastPath.current)return;
    lastPath.current=path;
    const normalized=pathname||'/';
    if(normalized.startsWith('/admin')) return;
    trackAnalytics('PAGE_VIEW',path);
    if(/^\/product\/[^/]+/i.test(normalized))trackAnalytics('PRODUCT_VIEWED',path);
    if(/^\/p\/[^/]+/i.test(normalized))trackAnalytics('PORTFOLIO_VIEWED',path);
  },[pathname]);
  useEffect(()=>{
    getAnalyticsIdentity();
    const send=()=>{if(window.location.pathname.startsWith('/admin')) return; trackAnalytics('SESSION_HEARTBEAT',window.location.pathname+window.location.search);};
    const timer=window.setInterval(send,20000);
    return()=>window.clearInterval(timer);
  },[]);
  return null;
}

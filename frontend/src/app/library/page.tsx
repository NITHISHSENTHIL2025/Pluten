"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Library, Loader2, ShieldCheck, UserRound, AlertCircle, RefreshCw } from "lucide-react";
import apiClient from "@/lib/apiClient";
import styles from "./library.module.css";

interface PurchasedAsset { id:string; title:string; thumbnail:string|null; category?:string; }

export default function MyLibraryPage(){
  const router=useRouter();
  const [assets,setAssets]=useState<PurchasedAsset[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [downloadingId,setDownloadingId]=useState<string|null>(null);
  const [downloadError,setDownloadError]=useState<string|null>(null);

  const loadLibrary=async()=>{
    setLoading(true); setError(null);
    try{const response=await apiClient.get<PurchasedAsset[]>("/user/library");setAssets(Array.isArray(response.data)?response.data:[]);}
    catch(err:any){
      if(err?.response?.status===401||err?.response?.status===403){router.replace(`/login?redirect=${encodeURIComponent("/library")}`);return;}
      setError(err?.response?.data?.error||"We couldn't load your library right now.");
    }finally{setLoading(false);}
  };

  useEffect(()=>{loadLibrary();},[]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload=async(productId:string)=>{
    if(downloadingId)return;
    setDownloadError(null);setDownloadingId(productId);
    try{
      const response=await apiClient.get(`/user/download/${productId}`);
      const url=response?.data?.downloadUrl;
      if(typeof url!=="string"||!url)throw new Error("No secure download URL returned.");
      window.location.assign(url);
    }catch(err:any){
      if(err?.response?.status===401||err?.response?.status===403){router.replace(`/login?redirect=${encodeURIComponent("/library")}`);return;}
      setDownloadError(err?.response?.data?.error||"Download failed. Please try again.");
    }finally{setDownloadingId(null);}
  };

  if(loading)return <main className={styles.pageContainer}><div className={styles.loader}><div className={styles.loadingContent}><img src="/favicon.ico" className={styles.loadingLogo} alt=""/><span className={styles.loadingText}>Opening your library</span></div></div></main>;

  return <main className={styles.pageContainer}>
    <header className={styles.topNav}><div className={styles.topNavInner}><Link href="/" className={styles.brand} aria-label="Pluten home"><img src="/favicon.ico" className={styles.brandLogo} alt=""/> PLUTEN</Link><nav className={styles.navActions}><Link href="/profile" className={styles.navLink}><UserRound size={16}/> <span>Profile</span></Link></nav></div></header>
    <div className={styles.contentWrapper}>
      <header className={styles.header}>
        <div><button className={styles.backBtn} onClick={()=>router.push("/")}><ArrowLeft size={15}/> Back to Pluten</button><span className={styles.pageEyebrow}>PLUTEN / DIGITAL LIBRARY</span><h1 className={styles.pageTitle}>Your Library.</h1><p className={styles.subtitle}>Everything you've acquired from Pluten, securely stored and ready when you need it.</p></div>
        <div className={styles.vaultBadge}><ShieldCheck size={15}/> Secure Library</div>
      </header>

      {error?<section className={styles.errorPanel}><AlertCircle size={22}/><h2 className={styles.errorTitle}>Library unavailable.</h2><p className={styles.errorText}>{error}</p><button className={styles.retryBtn} onClick={loadLibrary}><RefreshCw size={15}/> Try again</button></section>:<>
        <div className={styles.libraryMeta}><span className={styles.assetCount}><strong>{assets.length}</strong> {assets.length===1?'DIGITAL ASSET':'DIGITAL ASSETS'}</span></div>
        {downloadError&&<div className={styles.downloadError}><AlertCircle size={14}/>{downloadError}</div>}
        {assets.length===0?<section className={styles.empty}><div className={styles.emptyInner}><div className={styles.emptyIcon}><Library size={24}/></div><h2 className={styles.emptyTitle}>Your library is empty.</h2><p className={styles.emptyText}>Products you purchase from Pluten will appear here automatically.</p><Link className={styles.emptyAction} href="/#products">Explore products</Link></div></section>:<section className={styles.assetGrid}>{assets.map(asset=><article key={asset.id} className={styles.assetCard}><div className={styles.cardImageWrap}>{asset.thumbnail?<img src={asset.thumbnail} alt="" className={styles.cardImage}/>:<div className={styles.noImage}>NO PREVIEW</div>}<div className={styles.cardImageShade}/></div><div className={styles.cardContent}><span className={styles.cardEyebrow}>{asset.category||'DIGITAL PRODUCT'}</span><h2 className={styles.cardTitle}>{asset.title}</h2><div className={styles.cardFooter}><span className={styles.cardStatus}><span className={styles.cardStatusDot}/>Purchased</span><button className={styles.downloadBtn} disabled={downloadingId===asset.id} onClick={()=>handleDownload(asset.id)}>{downloadingId===asset.id?<Loader2 size={14} className="pluten-login-spinner"/>:<Download size={14}/>} {downloadingId===asset.id?'Preparing':'Download'}</button></div></div></article>)}</section>}
      </>}
    </div>
    <footer className={styles.footer}><div className={styles.footerInner}><Link href="/" className={styles.footerBrand}><img src="/favicon.ico" alt=""/>PLUTEN</Link><span className={styles.footerCopyright}>© 2026 PLUTEN</span></div></footer>
  </main>;
}

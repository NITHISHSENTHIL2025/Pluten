"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortfolio, type CreatePortfolioPayload } from "@/lib/portfolioApi";
import styles from "./new.module.css";

function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40)}

export default function NewPortfolioPage(){
  const router=useRouter();
  const [name,setName]=useState("");
  const [username,setUsername]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const suggestion=useMemo(()=>slugify(username || name),[username,name]);
  async function submit(event:FormEvent){
    event.preventDefault();
    const cleanName=name.trim(); const cleanUsername=slugify(username || name);
    if(cleanName.length<2){setError("Enter the name you want on your portfolio.");return;}
    if(cleanUsername.length<3){setError("Choose a public username with at least 3 characters.");return;}
    setLoading(true);setError("");
    const payload:CreatePortfolioPayload={username:cleanUsername,fullName:cleanName,professionalTitle:"",tagline:"",bio:"",email:"",phone:"",location:"",website:"",availability:"",yearsOfExperience:null,template:"premium-editorial",templateVersion:1,projects:[],experiences:[],education:[],skills:[],certifications:[],achievements:[],socialLinks:[],seo:{keywords:[],noIndex:true},settings:{showEmail:true,showPhone:false,showLocation:true,showProjects:true,showExperience:true,showEducation:true,showSkills:true,showCertifications:true,showAchievements:true,showSocialLinks:true,showBranding:true,contactEnabled:true}};
    try{const result=await createPortfolio(payload);router.replace(`/portfolio/edit/${result.portfolio.id}`)}
    catch(err:any){if(err?.response?.status===401){router.replace(`/login?redirect=${encodeURIComponent('/portfolio/new')}`);return}setError(err?.response?.data?.error || "Unable to start your portfolio. Try a different username.");setLoading(false)}
  }
  return <main className={styles.page}><div className={styles.glow}/><div className={styles.shell}><nav className={styles.nav}><Link href="/portfolio"><ArrowLeft size={15}/> Portfolio Maker</Link><span>PLUTEN</span></nav><section className={styles.card}><div className={styles.icon}><Sparkles size={20}/></div><p className={styles.eyebrow}>CREATE / STEP 01</p><h1>Start with your name.</h1><p className={styles.lead}>Nothing is created until you continue. You can save an incomplete draft in the editor and publish only when you are ready.</p><form onSubmit={submit}><label>Your name<input autoFocus value={name} onChange={(e)=>{setName(e.target.value);if(!username)setUsername(slugify(e.target.value))}} placeholder="Nithish" maxLength={100}/></label><label>Public username<div className={styles.username}><span>pluten.site/p/</span><input value={username} onChange={(e)=>setUsername(slugify(e.target.value))} placeholder="your-name" maxLength={40}/></div></label><div className={styles.preview}>Your future link <strong>pluten.site/p/{suggestion || 'your-name'}</strong></div>{error?<div className={styles.error}>{error}</div>:null}<button disabled={loading}>{loading?<><Loader2 className={styles.spin} size={17}/> Creating…</>:<>Continue to editor <ArrowRight size={17}/></>}</button></form></section></div></main>
}

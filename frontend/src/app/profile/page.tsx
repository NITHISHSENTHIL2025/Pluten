"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Library, Crown, Loader2, LogOut, Mail, ShieldCheck, User, AlertCircle, RefreshCw } from "lucide-react";
import apiClient from "@/lib/apiClient";
import styles from "./profile.module.css";

interface UserProfile { firstName:string|null; lastName:string|null; email:string; role:string; isPremium:boolean; createdAt:string; }

export default function ProfilePage(){
  const router=useRouter();
  const [profile,setProfile]=useState<UserProfile|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [loggingOut,setLoggingOut]=useState(false);

  const loadProfile=async()=>{
    setLoading(true); setError(null);
    try{
      const response=await apiClient.get<UserProfile>("/user/profile");
      setProfile(response.data);
    }catch(err:any){
      if(err?.response?.status===401||err?.response?.status===403){
        router.replace(`/login?redirect=${encodeURIComponent("/profile")}`);
        return;
      }
      setError(err?.response?.data?.error||"We couldn't load your profile right now.");
    }finally{setLoading(false);}
  };

  useEffect(()=>{loadProfile();},[]); // eslint-disable-line react-hooks/exhaustive-deps

  const logout=async()=>{
    if(loggingOut)return;
    setLoggingOut(true);
    try{await apiClient.post("/auth/logout");}catch(error){console.error("Logout failed",error);}finally{window.location.replace("/");}
  };

  if(loading)return <main className={styles.page}><div className={styles.loading}><Loader2 size={30} className="pluten-login-spinner"/><span>Loading your account</span></div></main>;

  if(error||!profile)return <main className={styles.page}><div className={styles.content}><button className={styles.back} onClick={()=>router.push("/")}><ArrowLeft size={16}/> Back to store</button><div className={styles.error}><AlertCircle size={22}/><h1 className={styles.errorTitle}>Account unavailable</h1><p className={styles.errorText}>{error||"Your secure session could not be loaded."}</p><button className={styles.retry} onClick={loadProfile}><RefreshCw size={15}/> Try again</button></div></div></main>;

  const name=[profile.firstName,profile.lastName].filter(Boolean).join(" ").trim()||"Pluten member";
  const initials=name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
  const label=profile.role==="SUPER_ADMIN"?"Super Admin":profile.isPremium?"Premium member":"Standard account";

  return <main className={styles.page}>
    <div className={styles.content}>
      <button className={styles.back} onClick={()=>router.push("/")}><ArrowLeft size={16}/> Back to store</button>
      <div className={styles.eyebrow}>PLUTEN / ACCOUNT</div>
      <h1 className={styles.title}>Profile.</h1>
      <p className={styles.subtitle}>Your account, purchases and secure access — in one place.</p>

      <section className={styles.profileCard}>
        <div className={styles.identity}>
          <div className={styles.avatar}>{initials}</div>
          <div>
            <h2 className={styles.identityName}>{name}</h2>
            <p className={styles.email}><Mail size={14}/>{profile.email}</p>
          </div>
          <div className={styles.badge}>{profile.role==="SUPER_ADMIN"?<ShieldCheck size={14}/>:profile.isPremium?<Crown size={14}/>:<User size={14}/>} {label}</div>
        </div>
        <div className={styles.actionGrid}>
          <button className={styles.actionCard} onClick={()=>router.push("/library")}>
            <span className={styles.actionMain}><span className={styles.actionIcon}><Library size={20}/></span><span><strong className={styles.actionTitle}>Digital Library</strong><span className={styles.actionText}>Access every product you've purchased.</span></span></span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className={styles.logout}>
          <p className={styles.logoutText}>Your purchases remain available after you sign out.</p>
          <button className={styles.logoutBtn} onClick={logout} disabled={loggingOut}>{loggingOut?<><Loader2 size={16} className="pluten-login-spinner"/> Signing out</>:<><LogOut size={16}/> Sign out</>}</button>
        </div>
      </section>
    </div>
  </main>;
}

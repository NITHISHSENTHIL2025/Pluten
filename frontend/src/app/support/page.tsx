'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { InstagramIcon } from "@/components/InstagramIcon";
import { ArrowLeft, CheckCircle2, LifeBuoy, Loader2, Mail, ShieldCheck } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import styles from './support.module.css';

const INSTAGRAM = 'https://www.instagram.com/pluten.official/';
type FormState = { name:string; email:string; category:string; subject:string; message:string; orderReference:string };
const initialForm:FormState = { name:'', email:'', category:'GENERAL', subject:'', message:'', orderReference:'' };

export default function SupportPage(){
  const [form,setForm]=useState<FormState>(initialForm);
  const [sending,setSending]=useState(false);
  const [error,setError]=useState('');
  const [ticket,setTicket]=useState('');
  const update=(key:keyof FormState,value:string)=>setForm((prev)=>({...prev,[key]:value}));
  async function submit(event:FormEvent){
    event.preventDefault(); setError(''); setTicket('');
    if(!form.name.trim() || !form.email.trim() || !form.subject.trim() || form.message.trim().length<10){setError('Please complete your name, email, subject and a short description of the problem.');return;}
    setSending(true);
    try{
      const response=await apiClient.post('/support',{...form,name:form.name.trim(),email:form.email.trim(),subject:form.subject.trim(),message:form.message.trim(),orderReference:form.orderReference.trim()||undefined});
      setTicket(response.data?.ticketNumber || response.data?.ticket?.ticketNumber || 'Created');
      setForm(initialForm);
    }catch(err:any){setError(err?.response?.data?.error || 'We could not create the support request right now. You can also email pluten.official@gmail.com.');}
    finally{setSending(false);}
  }
  return <main className={styles.page}>
    <div className={styles.glow} aria-hidden="true"/>
    <nav className={styles.nav}><Link href="/" className={styles.brand}>PLUTEN</Link><Link href="/" className={styles.back}><ArrowLeft size={15}/> Back home</Link></nav>
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>PLUTEN / SUPPORT</p><h1>Tell us what<br/>went wrong.</h1><p className={styles.lead}>Order, product, account or portfolio issue — create one tracked request and keep the reference.</p></div>
      <div className={styles.promise}><ShieldCheck size={20}/><div><strong>Never send secrets.</strong><span>Pluten support will never need your password, OTP, card number, API key or authentication token.</span></div></div>
    </section>
    <section className={styles.grid}>
      <form className={styles.formCard} onSubmit={submit}>
        <div className={styles.formTop}><LifeBuoy size={19}/><div><strong>Create support request</strong><span>Fields marked required help us resolve it faster.</span></div></div>
        {ticket ? <div className={styles.success}><CheckCircle2 size={22}/><div><strong>Request created.</strong><span>Reference: {ticket}</span></div></div> : null}
        {error ? <div className={styles.error}>{error}</div> : null}
        <div className={styles.twoCol}><label>Name<input value={form.name} onChange={(e)=>update('name',e.target.value)} autoComplete="name" maxLength={100} required/></label><label>Email<input type="email" value={form.email} onChange={(e)=>update('email',e.target.value)} autoComplete="email" maxLength={180} required/></label></div>
        <div className={styles.twoCol}><label>Category<select value={form.category} onChange={(e)=>update('category',e.target.value)}><option value="GENERAL">General</option><option value="ORDER">Order / payment</option><option value="PRODUCT">Digital product</option><option value="PORTFOLIO">Portfolio maker</option><option value="ACCOUNT">Account</option><option value="REFUND">Refund</option></select></label><label>Order reference <span>(optional)</span><input value={form.orderReference} onChange={(e)=>update('orderReference',e.target.value)} placeholder="Order ID" maxLength={120}/></label></div>
        <label>Subject<input value={form.subject} onChange={(e)=>update('subject',e.target.value)} maxLength={160} required/></label>
        <label>What happened?<textarea value={form.message} onChange={(e)=>update('message',e.target.value)} rows={7} minLength={10} maxLength={5000} placeholder="What were you trying to do, what happened, and what did you expect?" required/></label>
        <button className={styles.submit} disabled={sending}>{sending?<><Loader2 size={17} className={styles.spin}/> Creating request…</>:<>Create support request</>}</button>
      </form>
      <aside className={styles.side}>
        <div className={styles.sideCard}><Mail size={18}/><p>Prefer email?</p><a href="mailto:pluten.official@gmail.com">pluten.official@gmail.com</a><span>Include your order reference for payment or product-access problems.</span></div>
        <div className={styles.sideCard}><InstagramIcon size={18}/><p>Official Instagram</p><a href={INSTAGRAM} target="_blank" rel="noreferrer">@pluten.official</a><span>For public product updates and Pluten content. Support requests are better submitted here or by email.</span></div>
        <div className={styles.sideCard}><p>Before sending</p><span>For payment issues, check your Library once. A delayed gateway confirmation can complete after the browser returns.</span><Link href="/library">Open Library →</Link></div>
      </aside>
    </section>
    <footer className={styles.footer}>© {new Date().getFullYear()} Pluten · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · <Link href="/refund-policy">Refunds</Link></footer>
  </main>;
}

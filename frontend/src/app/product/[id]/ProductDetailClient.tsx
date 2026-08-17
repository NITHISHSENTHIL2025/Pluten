"use client";

import apiClient from "@/lib/apiClient";
import PlutenSkeleton from "@/components/skeleton/PlutenSkeleton";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Check, Loader2, ShieldCheck, User, X } from "lucide-react";
// @ts-ignore
import { load } from "@cashfreepayments/cashfree-js";
import styles from "./product.module.css";

interface Product { id:string; title:string; description:string; price:number; thumbnail:string|null; category:string; originalPrice?:number; finalPrice?:number; discountAmount?:number; discountLabel?:string|null; }

export default function ProductDetailClient({ id, initialProduct }:{ id:string; initialProduct: Product }){
  const router=useRouter();
  const [product]=useState<Product|null>(initialProduct);
  const [loading]=useState(false);
  const [loadError]=useState('');
  const [checkoutError,setCheckoutError]=useState('');
  const [phoneError,setPhoneError]=useState('');
  const [showPhonePrompt,setShowPhonePrompt]=useState(false);
  const [phoneNumber,setPhoneNumber]=useState('');
  const [couponCode,setCouponCode]=useState('');
  const [isCheckingOut,setIsCheckingOut]=useState(false);
  const checkoutRequestIdRef=useRef<string|null>(null);
  const buyButtonRef=useRef<HTMLButtonElement|null>(null);
  const modalRef=useRef<HTMLDivElement|null>(null);
  const phoneInputRef=useRef<HTMLInputElement|null>(null);

  const originalPrice=product?Number(product.originalPrice ?? product.price):0;
  const finalPrice=product?Number(product.finalPrice ?? product.price):0;
  const discountAmount=product?Number(product.discountAmount ?? 0):0;
  const hasDiscount=discountAmount>0;

  useEffect(()=>{
    if(!showPhonePrompt)return;
    phoneInputRef.current?.focus();
    const previous=document.body.style.overflow; document.body.style.overflow='hidden';
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==='Escape'&&!isCheckingOut){setShowPhonePrompt(false);return;}
      if(event.key!=='Tab'||!modalRef.current)return;
      const focusable=Array.from(modalRef.current.querySelectorAll<HTMLElement>('button,input,[href],[tabindex]:not([tabindex="-1"])')).filter((el)=>!el.hasAttribute('disabled'));
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    window.addEventListener('keydown',onKeyDown);
    return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',onKeyDown);setTimeout(()=>buyButtonRef.current?.focus(),0);};
  },[showPhonePrompt,isCheckingOut]);

  const buy=()=>{if(!product||isCheckingOut)return;setCheckoutError('');setPhoneError('');setShowPhonePrompt(true);};
  const checkout=async(e:React.FormEvent)=>{
    e.preventDefault();if(!product||isCheckingOut)return;
    const phone=phoneNumber.replace(/\D/g,'');
    if(phone.length!==10){setPhoneError('Please enter a valid 10-digit phone number.');return;}
    if(couponCode.trim().length>40){setCheckoutError('Coupon code is too long.');return;}
    if(!checkoutRequestIdRef.current)checkoutRequestIdRef.current=crypto.randomUUID();
    const clientRequestId=checkoutRequestIdRef.current;
    setPhoneError('');setCheckoutError('');setIsCheckingOut(true);setShowPhonePrompt(false);
    try{
      const mode=(process.env.NEXT_PUBLIC_CASHFREE_MODE||'sandbox')==='production'?'production':'sandbox';
      const cashfree=await load({mode});
      if(!cashfree)throw new Error('Payment gateway could not be initialized.');
      const response=await apiClient.post('/payments/create',{productId:product.id,customerPhone:phone,clientRequestId,couponCode:couponCode.trim()||undefined});
      if(response.data?.alreadyPurchased&&response.data?.order_id){router.push(`/payment-success?order_id=${encodeURIComponent(response.data.order_id)}`);return;}
      if(!response.data?.payment_session_id)throw new Error('Payment session was not returned by the server.');
      await cashfree.checkout({paymentSessionId:response.data.payment_session_id,redirectTarget:'_self'});
    }catch(err:any){
      checkoutRequestIdRef.current=null;
      if(err?.response?.status===401||err?.response?.status===403){router.replace(`/login?redirect=${encodeURIComponent(`/product/${id}`)}`);return;}
      setCheckoutError(err?.response?.data?.error||err?.message||'Payment could not be initialized. Please try again.');
      setShowPhonePrompt(true);
    }finally{setIsCheckingOut(false);}
  };

  if(loading)return <main className={styles.pageContainer}><div className={styles.loading}><PlutenSkeleton variant="product"/><PlutenSkeleton variant="text"/></div></main>;
  if(!product)return <main className={styles.unavailable}><button className={styles.backButton} onClick={()=>router.push('/')}><ArrowLeft size={16}/> Back to marketplace</button><div className={styles.unavailableInner}><div className={styles.unavailableIcon}><AlertCircle size={24}/></div><p className={styles.eyebrow}>PLUTEN / PRODUCT</p><h1>Product unavailable.</h1><p>{loadError||'This asset is no longer available.'}</p></div></main>;

  return <main className={styles.pageContainer}>
    <nav className={styles.topNav}><button className={styles.brand} onClick={()=>router.push('/')} aria-label="Pluten home">PLUTEN</button><button className={styles.backButton} onClick={()=>router.push('/')}><ArrowLeft size={16}/> Back to market</button></nav>
    <section className={styles.productLayout}>
      <div><div className={styles.imageContainer}>{product.thumbnail?<img src={product.thumbnail} alt={product.title} className={styles.productImage}/>:<div className={styles.noImage}>NO PREVIEW</div>}</div><div className={styles.productInfo}><h1 className={styles.title}>{product.title}</h1><div className={styles.vendorInfo}><span className={styles.vendorIcon}><User size={15}/></span><span>Pluten Network</span><Check size={14} className={styles.verified}/><span className={styles.dot}>·</span><span>{product.category}</span></div><p className={styles.description}>{product.description}</p></div></div>
      <aside className={styles.checkoutCard}><div className={styles.priceTop}><span className={styles.priceLabel}>Today</span>{hasDiscount?<><div className={styles.priceRow}><strong>₹{finalPrice.toLocaleString('en-IN')}</strong><span className={styles.discountPill}>{product.discountLabel}</span></div><span className={styles.originalPrice}>₹{originalPrice.toLocaleString('en-IN')}</span></>:<strong className={styles.priceOnly}>₹{originalPrice.toLocaleString('en-IN')}</strong>}</div>{checkoutError&&<div className={styles.checkoutError}><AlertCircle size={15}/>{checkoutError}</div>}<button ref={buyButtonRef} className={styles.buyBtn} onClick={buy} disabled={isCheckingOut}>{isCheckingOut?<><Loader2 size={17} className="pluten-login-spinner"/> Processing</>:'Buy this'}</button><div className={styles.guarantee}><ShieldCheck size={15}/> Secure transaction via Cashfree</div></aside>
    </section>

    {showPhonePrompt&&<div className={styles.modalOverlay} onMouseDown={(event)=>{if(event.target===event.currentTarget&&!isCheckingOut)setShowPhonePrompt(false);}}><div ref={modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="phone-title" aria-describedby="phone-description"><div className={styles.modalHeader}><div><p className={styles.modalEyebrow}>PLUTEN / CHECKOUT</p><h2 id="phone-title">Billing details</h2></div><button className={styles.modalClose} onClick={()=>!isCheckingOut&&setShowPhonePrompt(false)} aria-label="Close checkout" disabled={isCheckingOut}><X size={18}/></button></div><p id="phone-description" className={styles.modalText}>Use a valid 10-digit phone number for secure Cashfree processing.</p>{phoneError&&<div className={styles.phoneError}>{phoneError}</div>}
      <form onSubmit={checkout}>
        <label className={styles.formField}><span>Phone number</span><div className={styles.phoneWrap}><span>+91</span><input ref={phoneInputRef} type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} value={phoneNumber} onChange={e=>{setPhoneNumber(e.target.value.replace(/\D/g,''));setPhoneError('');}} placeholder="00000 00000" disabled={isCheckingOut}/></div></label>
        <label className={styles.formField}><span>Coupon code <em>optional</em></span><input className={styles.couponInput} value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase().replace(/\s/g,''))} maxLength={40} placeholder="SAVE20" disabled={isCheckingOut}/></label>
        <button className={styles.payButton} type="submit" disabled={isCheckingOut||phoneNumber.length!==10}>{isCheckingOut?<><Loader2 size={17} className="pluten-login-spinner"/> Processing</>:'Proceed to payment'}</button>
      </form></div></div>}
  </main>;
}

// frontend/src/app/product/[id]/page.tsx
"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, ShieldCheck, User, Check, AlertCircle, Phone, X } from 'lucide-react';
// @ts-ignore
import { load } from '@cashfreepayments/cashfree-js';
import { useActiveOffer } from "@/hooks/useActiveOffer";
import { calculateDiscount } from "@/utils/price";
import apiClient from '@/lib/apiClient';
import styles from './product.module.css';

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnail: string | null;
    category: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    // THE FIX: State for the Phone Number Prompt Modal
    const [showPhonePrompt, setShowPhonePrompt] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');

    const { offer } = useActiveOffer();
    
    const currentPrice = product ? product.price : 0;
    const { finalPrice, discountAmount } = calculateDiscount(currentPrice, offer);
    const hasDiscount = discountAmount > 0;

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await apiClient.get(`/products/${id}`);
                setProduct(response.data);
            } catch (error) {
                console.error("Failed to load product", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleBuyClick = () => {
        setCheckoutError(null);
        setShowPhonePrompt(true);
    };

    const executeCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate Phone Number
        const cleanedPhone = phoneNumber.replace(/\D/g, '');
        if (cleanedPhone.length !== 10) {
            setPhoneError("Please enter a valid 10-digit phone number.");
            return;
        }

        setPhoneError('');
        setShowPhonePrompt(false);
        setIsCheckingOut(true);
        setCheckoutError(null);
        
        try {
            const cashfreeMode = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
            const cashfree = await load({
                mode: cashfreeMode, 
            });

            const response = await apiClient.post(
                "/payments/create", 
                {
                    productId: product!.id,
                    amount: finalPrice, 
                    customerPhone: cleanedPhone // THE FIX: Dynamically injects the user's input
                }
            );

            const { payment_session_id, order_id } = response.data;

            const checkoutOptions = {
                paymentSessionId: payment_session_id,
                redirectTarget: "_modal", 
            };

            const result = await cashfree.checkout(checkoutOptions);

            if (result.error) {
                console.error("Transaction Error:", result.error);
                setCheckoutError("Transaction interrupted. If funds were deducted, our secure webhook will automatically deliver the asset to your Digital Library within 5 minutes.");
            }
            
            if (result.paymentDetails) {
                console.log("Cashfree Success! Securing asset...");
                try {
                    await apiClient.post(
                        "/payments/verify",
                        { orderId: order_id }
                    );
                    
                    router.push(`/payment-success?order_id=${order_id}`); 
                } catch (verifyError) {
                    console.error("Fulfillment Error:", verifyError);
                    setCheckoutError("Payment succeeded, but asset fulfillment delayed. Check your Digital Library shortly or contact support.");
                }
            }

        } catch (error: any) {
            console.error("Gateway Initialization Error:", error);
            
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                router.push(`/login?redirect=/product/${id}`);
            } else {
                setCheckoutError(error.response?.data?.error || "Failed to connect to the payment gateway.");
            }
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#111] flex items-center justify-center">
                <Loader2 className="animate-spin text-neutral-500 w-10 h-10" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center text-white">
                <h1 className="text-2xl font-bold mb-4">Asset not found.</h1>
                <button onClick={() => router.push('/')} className="text-pink-400 hover:underline">Return to Marketplace</button>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            
            <nav className={styles.topNav}>
                <div className={styles.brand} onClick={() => router.push('/')}>iSevens</div>
                <button onClick={() => router.push('/')} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
                    <ArrowLeft size={18} /> Back to Market
                </button>
            </nav>

            <main className={styles.productLayout}>
                <div>
                    <div className={styles.imageContainer}>
                        {product.thumbnail ? (
                            <img
                                src={product.thumbnail || "/placeholder.png"}
                                alt={product.title}
                                className={styles.productImage}
                            />
                        ) : (
                            <div className={styles.noImage}>No Preview Available</div>
                        )}
                    </div>
                    
                    <div className="mt-8">
                        <h1 className={styles.title}>{product.title}</h1>
                        
                        <div className={styles.vendorInfo}>
                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                                <User size={16} />
                            </div>
                            <span className="font-medium text-white">iSevens Network</span>
                            <Check size={16} color="#00ff00" />
                            <span className="mx-2 text-neutral-600">•</span>
                            <span>{product.category}</span>
                        </div>

                        <div className={styles.description}>
                            {product.description}
                        </div>
                    </div>
                </div>

                <div>
                    <div className={styles.checkoutCard}>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                            {hasDiscount ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', lineHeight: '1' }}>
                                            ₹{finalPrice.toLocaleString('en-IN')}
                                        </span>
                                        <span style={{ backgroundColor: '#dc2626', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 'bold' }}>
                                            {offer.type === 'PERCENTAGE' ? `${offer.value}% OFF` : `₹${offer.value} OFF`}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '1.25rem', color: '#666', textDecoration: 'line-through' }}>
                                        ₹{currentPrice.toLocaleString('en-IN')}
                                    </span>
                                </>
                            ) : (
                                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', lineHeight: '1' }}>
                                    ₹{currentPrice.toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>

                        {checkoutError && (
                            <div className="mb-4 p-3 bg-red-950/30 border border-red-900 text-red-400 rounded-md text-sm flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span style={{ lineHeight: '1.4' }}>{checkoutError}</span>
                            </div>
                        )}
                        
                        <button 
                            onClick={handleBuyClick} 
                            disabled={isCheckingOut}
                            className={styles.buyBtn}
                        >
                            {isCheckingOut ? <Loader2 className="animate-spin mx-auto" /> : 'Buy this' }
                        </button>

                        <div className={styles.guarantee}>
                            <ShieldCheck size={16} /> Secure transaction via Cashfree
                        </div>
                    </div>
                </div>
            </main>

            {/* THE FIX: Pre-Checkout Security Modal for Phone Verification */}
            {showPhonePrompt && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: 'linear-gradient(180deg, #161616 0%, #0a0a0a 100%)', width: '100%', maxWidth: '400px', borderRadius: '16px', border: '1px solid #2a2a2a', boxShadow: '0 30px 60px -12px rgba(0,0,0,1), inset 0 1px 2px rgba(255,255,255,0.08)', padding: '2.5rem', position: 'relative' }}>
                        
                        <button onClick={() => setShowPhonePrompt(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#050505', border: '1px solid #222', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', cursor: 'pointer', boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.8)' }}>
                            <X size={16} />
                        </button>
                        
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                            <Phone size={28} color="#3b82f6" />
                        </div>

                        <h2 className="text-xl font-black text-white mb-2 text-center tracking-widest uppercase">Billing Details</h2>
                        <p className="text-gray-400 mb-6 text-sm text-center">To comply with RBI guidelines and ensure secure processing, Cashfree requires a valid billing phone number.</p>

                        {phoneError && (
                            <div style={{ padding: '10px', marginBottom: '16px', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#ef4444', fontSize: '12px', textAlign: 'center' }}>
                                {phoneError}
                            </div>
                        )}

                        <form onSubmit={executeCheckout}>
                            <div style={{ position: 'relative', marginBottom: '24px' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontWeight: 'bold', fontSize: '16px' }}>+91</span>
                                <input 
                                    type="text" 
                                    maxLength={10}
                                    placeholder="Enter 10-digit number" 
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                    style={{ width: '100%', padding: '16px 16px 16px 56px', background: '#000', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '16px', fontWeight: 'bold', outline: 'none', letterSpacing: '2px', fontFamily: 'monospace' }}
                                />
                            </div>

                            <button 
                                type="submit" 
                                style={{ width: '100%', padding: '16px', background: '#dc2626', borderRadius: '10px', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
                            >
                                Proceed to Payment
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
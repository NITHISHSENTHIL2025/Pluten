// frontend/src/app/library/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; 
import { Download, ArrowLeft, Loader2, Package, ShieldCheck } from 'lucide-react';
import apiClient from '@/lib/apiClient'; 
import styles from './library.module.css'; 

interface PurchasedAsset {
    id: string;
    title: string;
    thumbnail: string | null;
    assetUrl: string | null;
}

export default function MyLibraryPage() {
    const router = useRouter();
    const [assets, setAssets] = useState<PurchasedAsset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLibrary = async () => {
            try {
                const response = await apiClient.get('/user/library');
                setAssets(response.data);
            } catch (error: any) {
                console.error("Failed to load library", error);
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    router.push('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchLibrary();
    }, [router]);

    const handleDownload = async (productId: string) => {
        try {
            const res = await apiClient.get(`/user/download/${productId}`);
            window.open(res.data.downloadUrl, "_blank");
        } catch (err) {
            console.error(err);
            alert("Download failed. Please check your secure session.");
        }
    };

    if (loading) {
        return (
            <div className={styles.loader}>
                <Loader2 className="animate-spin text-neutral-500 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                
                <header className={styles.header}>
                    <div>
                        <button onClick={() => router.push('/')} className={styles.backBtn}>
                            <ArrowLeft size={16} /> Back to Storefront
                        </button>
                        <h1 className={styles.pageTitle}>
                            <Package size={28} color="#8b0000" /> My Digital Library
                        </h1>
                        <p className={styles.subtitle}>Securely access and download your acquired assets.</p>
                    </div>
                    <div className={styles.vaultBadge}>
                        <ShieldCheck size={16} /> Encrypted Vault Active
                    </div>
                </header>

                {assets.length === 0 ? (
                    <div style={{ height: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                        <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>Your library is currently empty.</p>
                    </div>
                ) : (
                    <div className={styles.assetGrid}>
                        {assets.map((asset, index) => (
                            <div 
                                key={asset.id} 
                                className={styles.assetCard}
                                style={{ animationDelay: `${index * 0.05}s` }} 
                            >
                                {asset.thumbnail ? (
                                    <Image
                                        src={asset.thumbnail}
                                        alt={asset.title}
                                        width={400}
                                        height={250}
                                        unoptimized={true}
                                        style={{ objectFit: 'cover', width: '100%', height: '200px' }}
                                        className={styles.cardImage}
                                    />
                                ) : (
                                    <div className={styles.cardImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#222', height: '200px' }}>NO PREVIEW</div>
                                )}
                                <div className={styles.cardContent}>
                                    <h3 className={styles.cardTitle}>{asset.title}</h3>
                                    
                                    <button 
                                        onClick={() => handleDownload(asset.id)}
                                        className={styles.downloadBtn}
                                    >
                                        <Download size={18} /> Download Asset
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
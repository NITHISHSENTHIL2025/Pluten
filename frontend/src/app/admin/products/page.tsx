// frontend/src/app/admin/products/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import apiClient from '@/lib/apiClient';
import { Loader2, Plus, Edit2, Trash2, X, AlertCircle, AlertTriangle } from 'lucide-react';
import styles from '../admin.module.css'; 

interface Product {
    id: string;
    title: string;
    description?: string | null; // <-- ADD THIS LINE
    price: number;
    category: string;
    thumbnail?: string | null;
    isArchived?: boolean;
}

const CATEGORY_OPTIONS = ["E-Books", "Video Courses", "Templates", "Software", "Consulting", "Other"];

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    
    // Create/Edit Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // THE FIX: Custom Delete Confirmation State
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [assetFile, setAssetFile] = useState<File | null>(null);

    const fetchProducts = async () => {
        try {
            const response = await apiClient.get('/products'); 
            setProducts(response.data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setTitle('');
        setCategory(CATEGORY_OPTIONS[0]);
        setDescription('');
        setPrice('');
        setThumbnail(null);
        setAssetFile(null);
        setErrorMsg(null);
    };

    const handleOpenCreate = () => {
        handleCloseModal();
        setIsModalOpen(true);
    };

    // THE FIX: Replaced 'any' with strict 'Product' interface
    const handleOpenEdit = (product: Product) => {
        setEditingId(product.id);
        setTitle(product.title);
        setCategory(product.category || CATEGORY_OPTIONS[0]);
        setDescription(product.description || '');
        setPrice(product.price.toString());
        setIsModalOpen(true);
    };

    // THE FIX: Custom Branded Deletion Protocol instead of window.confirm
    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        setIsDeleting(true);

        try {
            await apiClient.delete(`/admin/products/${deleteConfirmId}`); 
            fetchProducts();
            setDeleteConfirmId(null);
        } catch (error: any) {
            console.error("Delete failed", error);
            // Protects against Foreign Key Locks in Prisma
            if (error.response?.status === 500) {
                alert("DATABASE LOCK: Cannot archive this product. It is likely tied to an active Offer or existing Customer Order. Delete associated offers first.");
            } else {
                alert(error.response?.data?.error || "Failed to purge asset.");
            }
            setDeleteConfirmId(null);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('category', category);
            formData.append('description', description);
            formData.append('price', price);
            formData.append('isDigital', 'true');
            if (thumbnail) formData.append('thumbnail', thumbnail);
            if (assetFile) formData.append('assetFile', assetFile);

            if (editingId) {
                await apiClient.put(`/admin/products/${editingId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await apiClient.post('/admin/products', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            
            handleCloseModal();
            fetchProducts();
            
        } catch (error: any) {
            // BULLETPROOF ERROR PARSER
            const errData = error.response?.data;
            if (errData?.details && Array.isArray(errData.details)) {
                setErrorMsg(errData.details.map((e: any) => e.message || e).join(" | "));
            } else if (errData?.errors && Array.isArray(errData.errors)) {
                setErrorMsg(errData.errors.map((e: any) => e.message || e).join(" | "));
            } else {
                setErrorMsg(errData?.error || 'Operation failed. Check terminal logs.');
            }
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <h1 className={styles.pageTitle} style={{ marginBottom: 0 }}>Digital Assets</h1>
                <button onClick={handleOpenCreate} className={styles.primaryButton}>
                    <span style={{ fontSize: '18px' }}>+</span> Add Product
                </button>
            </header>

            <div className={styles.tableCard}>
                <div className="overflow-x-auto">
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Cover</th>
                                <th className={styles.th}>Title</th>
                                <th className={styles.th}>Category</th>
                                <th className={styles.th}>Price</th>
                                <th className={`${styles.th} text-right`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingData ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <Loader2 className="animate-spin mx-auto w-8 h-8" color="#dc2626" />
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-neutral-500 font-bold uppercase tracking-widest">
                                        Database is currently empty.
                                    </td>
                                </tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product.id}>
                                        <td className={styles.td} style={{ width: '80px' }}>
                                            {product.thumbnail ? (
                                                // THE FIX: Replaced raw <img> with Next.js optimized <Image> component
                                                <Image 
                                                    src={product.thumbnail} 
                                                    alt={product.title} 
                                                    width={48}
                                                    height={48}
                                                    unoptimized={true} // Bypasses the need for next.config.js remote patterns setup temporarily
                                                    style={{ objectFit: 'cover', borderRadius: '8px', border: '1px solid #000', boxShadow: '2px 2px 5px rgba(0,0,0,0.8)' }} 
                                                />
                                            ) : (
                                                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#0d0d0d', border: '1px solid #000', boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#666', fontWeight: 'bold' }}>
                                                    N/A
                                                </div>
                                            )}
                                        </td>
                                        <td className={`${styles.td} font-bold text-white`}>{product.title}</td>
                                        <td className={styles.td}>
                                            <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '4px', background: '#111', border: '1px solid #333', color: '#888', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.05)' }}>
                                                {product.category || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className={`${styles.td} font-bold text-white`}>₹{product.price.toLocaleString('en-IN')}</td>
                                        <td className={`${styles.td} text-right`}>
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => handleOpenEdit(product)} className={`${styles.iconBtn} ${styles.iconBtnEdit}`}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => setDeleteConfirmId(product.id)} className={`${styles.iconBtn} ${styles.iconBtnDelete}`}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* THE FIX: CUSTOM BRANDED DELETE CONFIRMATION MODAL */}
            {deleteConfirmId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: 'linear-gradient(180deg, #161616 0%, #0a0a0a 100%)', width: '100%', maxWidth: '400px', borderRadius: '16px', border: '1px solid #3f0000', boxShadow: '0 30px 60px -12px rgba(0,0,0,1), inset 0 1px 2px rgba(255,255,255,0.08), inset 0 -1px 2px rgba(0,0,0,0.5)', padding: '2.5rem', textAlign: 'center' }}>
                        <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
                        <h2 className="text-xl font-black text-white mb-2 tracking-widest uppercase">Critical Warning</h2>
                        <p className="text-gray-400 mb-8 text-sm leading-relaxed">Are you absolutely sure you want to permanently purge this asset from the database? This action cannot be reversed.</p>
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setDeleteConfirmId(null)} 
                                disabled={isDeleting}
                                style={{ flex: 1, padding: '0.8rem', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                disabled={isDeleting}
                                style={{ flex: 1, padding: '0.8rem', background: 'linear-gradient(145deg, #990000, #550000)', border: '1px solid #cc0000', borderRadius: '8px', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : 'Purge Asset'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MACHINED SKEUOMORPHIC CREATION MODAL */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: 'linear-gradient(180deg, #161616 0%, #0a0a0a 100%)', width: '100%', maxWidth: '600px', borderRadius: '16px', border: '1px solid #2a2a2a', boxShadow: '0 30px 60px -12px rgba(0,0,0,1), inset 0 1px 2px rgba(255,255,255,0.08), inset 0 -1px 2px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', position: 'relative' }}>
                        
                        <button onClick={handleCloseModal} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#050505', border: '1px solid #222', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', cursor: 'pointer', boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.8)' }}>
                            <X size={16} />
                        </button>
                        
                        <h2 className="text-2xl font-black text-white mb-6 tracking-widest uppercase" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                            {editingId ? 'Configure Asset' : 'Deploy New Asset'}
                        </h2>

                        {errorMsg && (
                            <div style={{ padding: '12px 16px', marginBottom: '24px', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'linear-gradient(145deg, #2a0000, #110000)', border: '1px solid #550000', color: '#ff6666', fontSize: '13px', fontWeight: '600', boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.8)' }}>
                                <AlertCircle size={18} className="shrink-0 mt-0.5" /> 
                                <span style={{ lineHeight: '1.4' }}>{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.5rem' }}>Product Title</label>
                                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem', background: '#050505', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#fff', outline: 'none', boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.8), inset -1px -1px 2px rgba(255,255,255,0.02)' }} />
                            </div>

                            <div className="grid grid-cols-2 gap-5" style={{ marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.5rem' }}>Category</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem', background: '#050505', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#fff', outline: 'none', boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.8)', cursor: 'pointer' }}>
                                        {CATEGORY_OPTIONS.map(cat => (
                                            <option key={cat} value={cat} style={{ background: '#111', color: '#fff' }}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.5rem' }}>Price (INR)</label>
                                    <input type="number" required min="0" value={price} onChange={e => setPrice(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem', background: '#050505', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#fff', outline: 'none', boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.8)' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.5rem' }}>Description</label>
                                <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '0.8rem 1rem', background: '#050505', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#fff', outline: 'none', boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.8), inset -1px -1px 2px rgba(255,255,255,0.02)', resize: 'vertical' }} />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.5rem' }}>{editingId ? 'Replace Cover Image (Optional)' : 'Cover Image (PNG/JPG)'}</label>
                                <input type="file" accept="image/*" onChange={e => setThumbnail(e.target.files?.[0] || null)} style={{ width: '100%', padding: '0.6rem', background: '#050505', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#888', outline: 'none', boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.8)' }} />
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.5rem' }}>{editingId ? 'Replace Asset File (Optional)' : 'Asset File (PDF/ZIP)'}</label>
                                <input type="file" accept=".pdf,.zip,.docx" onChange={e => setAssetFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '0.6rem', background: '#050505', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#888', outline: 'none', boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.8)' }} />
                            </div>

                            <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(145deg, #990000, #550000)', border: '1px solid #cc0000', borderRadius: '8px', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 1px 1px 2px rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'Commit Changes' : 'Initialize Asset')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
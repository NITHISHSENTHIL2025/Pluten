// frontend/src/app/admin/offers/page.tsx
"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { Loader2, Tag, Edit2, Trash2, X, AlertCircle } from "lucide-react";
import styles from '../admin.module.css';

export default function OffersPage() {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState('PERCENTAGE');
    const [value, setValue] = useState('');
    const [status, setStatus] = useState('ACTIVE');
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            const res = await apiClient.get('/offers/admin');
            setOffers(res.data);
        } catch (error) {
            console.error("Failed to fetch offers", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
  setIsModalOpen(false);
  setEditingId(null);
  setName("");
  setType("PERCENTAGE");
  setValue("");
  setStatus("DRAFT");
  setStartAt("");
  setEndAt("");
  setErrorMsg(null);
};

    const handleOpenCreate = () => {
        handleCloseModal();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (offer: any) => {
  setEditingId(offer.id);
  setName(offer.name);
  setType(offer.type);
  setValue(String(offer.value));
  setStatus(offer.status);

  if (offer.startAt) {
    const date = new Date(offer.startAt);
    date.setMinutes(
      date.getMinutes() -
        date.getTimezoneOffset()
    );

    setStartAt(
      date.toISOString().slice(0, 16)
    );
  }

  if (offer.endAt) {
    const date = new Date(offer.endAt);
    date.setMinutes(
      date.getMinutes() -
        date.getTimezoneOffset()
    );

    setEndAt(
      date.toISOString().slice(0, 16)
    );
  }

  setIsModalOpen(true);
};

    const deleteOffer = async (id: string) => {
        if (!confirm("CRITICAL WARNING: Are you sure you want to delete this offer?")) return;
        
        try {
            await apiClient.delete(`/offers/admin/${id}`);
            fetchOffers();
        } catch (error: any) {
            console.error("Failed to delete offer", error);
            alert(error.response?.data?.error || "Failed to delete offer. It might be locked by existing orders.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            // Injecting the required backend fields silently
            const payload = {
  name: name.trim(),
  type,
  value: parseFloat(value),
  status,
  applyTo: "ALL",
  autoApply: status === "ACTIVE",
  startAt: new Date(startAt).toISOString(),
  endAt: new Date(endAt).toISOString(),
};

            if (editingId) {
                await apiClient.put(`/offers/admin/${editingId}`, payload);
            } else {
                await apiClient.post('/offers/admin', payload);
            }
            
            handleCloseModal();
            fetchOffers();
            
        } catch (error: any) {
            // Indestructible Error Parser
            let parsedError = 'CRITICAL: Backend rejected the payload. Check Node.js terminal logs.';
            
            if (error.response?.data) {
                const data = error.response.data;
                try {
                    if (Array.isArray(data.details)) {
                        parsedError = data.details.map((err: any) => err.message || JSON.stringify(err)).join(" | ");
                    } else if (Array.isArray(data.errors)) {
                        parsedError = data.errors.map((err: any) => err.message || JSON.stringify(err)).join(" | ");
                    } else if (data.error && typeof data.error === 'string') {
                        parsedError = data.error;
                    } else if (data.message && typeof data.message === 'string') {
                        parsedError = data.message;
                    }
                } catch (parseFallbackError) {
                    parsedError = "Backend threw an unreadable 500 error.";
                }
            }
            
            setErrorMsg(parsedError);
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <Loader2 className="animate-spin text-red-700 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.header}>
                <h1 className={`${styles.pageTitle} flex items-center gap-3`} style={{ marginBottom: 0 }}>
                    <Tag size={28} color="#dc2626" /> Offers & Promotions
                </h1>
                <button onClick={handleOpenCreate} className={styles.primaryButton}>
                    <span style={{ fontSize: '18px' }}>+</span> Create Offer
                </button>
            </div>

            <div className={styles.tableCard}>
                <div className="overflow-x-auto">
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Offer Name</th>
                                <th className={styles.th}>Discount</th>
                                <th className={styles.th}>Status</th>
                                <th className={styles.th}>Valid Until</th>
                                <th className={`${styles.th} text-right`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {offers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-neutral-500 font-bold uppercase tracking-widest">
                                        No active promotions found. Create one to stimulate the ecosystem.
                                    </td>
                                </tr>
                            ) : (
                                offers.map((offer: any) => (
                                    <tr key={offer.id}>
                                        <td className={`${styles.td} font-bold text-white`}>{offer.name}</td>
                                        <td className={styles.td}>
                                            <span style={{ display: 'inline-block', background: 'linear-gradient(145deg, #3a0000, #1a0000)', border: '1px solid #660000', color: '#ff6666', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em', boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.1)' }}>
                                                {offer.type === 'PERCENTAGE' ? `${offer.value}%` : `₹${offer.value}`} OFF
                                            </span>
                                        </td>
                                        <td className={styles.td}>
                                            <span style={{ 
                                                display: 'inline-block', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em',
                                                background: offer.status === 'ACTIVE' ? 'linear-gradient(145deg, #064e3b, #022c22)' : '#111',
                                                border: offer.status === 'ACTIVE' ? '1px solid #047857' : '1px solid #333',
                                                color: offer.status === 'ACTIVE' ? '#34d399' : '#666',
                                                boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.1)'
                                            }}>
                                                {offer.status}
                                            </span>
                                        </td>
                                        <td className={styles.td}>
                                            <span className="text-xs">
                                                {new Date(offer.endAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className={`${styles.td} text-right`}>
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => handleOpenEdit(offer)} className={`${styles.iconBtn} ${styles.iconBtnEdit}`}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => deleteOffer(offer.id)} className={`${styles.iconBtn} ${styles.iconBtnDelete}`}>
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

            {/* MACHINED SKEUOMORPHIC MODAL */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: 'linear-gradient(180deg, #161616 0%, #0a0a0a 100%)', width: '100%', maxWidth: '500px', borderRadius: '16px', border: '1px solid #2a2a2a', boxShadow: '0 30px 60px -12px rgba(0,0,0,1), inset 0 1px 2px rgba(255,255,255,0.08), inset 0 -1px 2px rgba(0,0,0,0.5)', padding: '2.5rem', position: 'relative' }}>
                        
                        <button onClick={handleCloseModal} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#050505', border: '1px solid #222', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', cursor: 'pointer', boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.8)' }}>
                            <X size={16} />
                        </button>
                        
                        <h2 className="text-2xl font-black text-white mb-6 tracking-widest uppercase" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                            {editingId ? 'Edit Protocol' : 'Launch Protocol'}
                        </h2>

                        {errorMsg && (
                            <div style={{ padding: '12px 16px', marginBottom: '24px', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'linear-gradient(145deg, #2a0000, #110000)', border: '1px solid #550000', color: '#ff6666', fontSize: '13px', fontWeight: '600', boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.8)' }}>
                                <AlertCircle size={18} className="shrink-0 mt-0.5" /> 
                                <span style={{ lineHeight: '1.4' }}>{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.5rem' }}>Offer Designation</label>
                                <input type="text" required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem', background: '#050505', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#fff', outline: 'none', boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.8), inset -1px -1px 2px rgba(255,255,255,0.02)' }} />
                            </div>

                            <div className="grid grid-cols-2 gap-5" style={{ marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.5rem' }}>Metric Type</label>
                                    <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem', background: '#050505', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#fff', outline: 'none', boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.8)', cursor: 'pointer' }}>
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        {/* THE FIX (Item #12): Changed from FIXED_AMOUNT to FIXED to match backend Schema */}
                                        <option value="FIXED">Fixed (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.5rem' }}>Output Value</label>
                                    <input type="number" required min="1" value={value} onChange={e => setValue(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem', background: '#050505', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#fff', outline: 'none', boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.8)' }} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5" style={{ marginBottom: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.5rem' }}>System Status</label>
                                    <select
  value={status}
  onChange={(e) =>
    setStatus(e.target.value)
  }
>
  <option value="DRAFT">
    Draft
  </option>

  <option value="ACTIVE">
    Active
  </option>

  <option value="PAUSED">
    Paused
  </option>

  <option value="EXPIRED">
    Expired
  </option>
</select>
<div>
  <label>
    Start Date
  </label>

  <input
    type="datetime-local"
    required
    value={startAt}
    onChange={(e) =>
      setStartAt(e.target.value)
    }
  />
</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.5rem' }}>Termination Date</label>
                                    <input type="datetime-local" required value={endAt} onChange={e => setEndAt(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem', background: '#050505', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#fff', outline: 'none', boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.8)' }} className="styled-date-picker" />
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(145deg, #990000, #550000)', border: '1px solid #cc0000', borderRadius: '8px', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 1px 1px 2px rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'Update Sequence' : 'Initialize Sequence')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
// frontend/src/app/admin/orders/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import apiClient from '@/lib/apiClient';
import { Loader2, ArrowUpRight, CheckCircle2, Clock, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../admin.module.css';

interface Order {
    id: string;
    totalAmount: number;
    status: string;
    transactionId: string;
    createdAt: string;
    user: { email: string; firstName: string | null; lastName: string | null; };
    product: { title: string; };
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    
    // THE FIX: Added Search & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await apiClient.get('/admin/orders');
                setOrders(response.data);
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const getStatusIcon = (status: string) => {
        if (status === 'SUCCESS') return <CheckCircle2 size={16} color="#10b981" />;
        if (status === 'PENDING') return <Clock size={16} color="#eab308" />;
        return <XCircle size={16} color="#ef4444" />;
    };

    // THE FIX: Blazing fast frontend search filtering
    const filteredOrders = useMemo(() => {
        if (!searchTerm) return orders;
        const lowerQuery = searchTerm.toLowerCase();
        return orders.filter(order => 
            order.transactionId?.toLowerCase().includes(lowerQuery) ||
            order.user.email.toLowerCase().includes(lowerQuery) ||
            (order.user.firstName && order.user.firstName.toLowerCase().includes(lowerQuery)) ||
            (order.user.lastName && order.user.lastName.toLowerCase().includes(lowerQuery)) ||
            order.product.title.toLowerCase().includes(lowerQuery)
        );
    }, [orders, searchTerm]);

    // THE FIX: Array slicing for Pagination
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredOrders.slice(start, start + itemsPerPage);
    }, [filteredOrders, currentPage]);

    // Reset to page 1 automatically when the user searches
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <Loader2 className="animate-spin text-red-700 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className={styles.pageTitle} style={{ marginBottom: 0 }}>Financial Ledger</h1>
                
                {/* THE FIX: Custom Branded Search Bar */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
                    <Search size={16} color="#666" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="text" 
                        placeholder="Search TxID, email, or asset..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 36px', background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', color: '#fff', outline: 'none', fontSize: '14px', boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.5)' }}
                    />
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className="overflow-x-auto">
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Transaction ID</th>
                                <th className={styles.th}>Customer</th>
                                <th className={styles.th}>Asset</th>
                                <th className={styles.th}>Amount</th>
                                <th className={styles.th}>Status</th>
                                <th className={styles.th}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.map((order) => (
                                <tr key={order.id}>
                                    <td className={`${styles.td} font-mono text-xs`}>
                                        <div className="flex items-center gap-2 text-neutral-500">
                                            {order.transactionId ? order.transactionId.substring(0, 12) + '...' : 'N/A'}
                                            {order.transactionId && <ArrowUpRight size={14} />}
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <div className="font-bold text-white">{order.user.firstName} {order.user.lastName}</div>
                                        <div className="text-xs text-neutral-500">{order.user.email}</div>
                                    </td>
                                    <td className={styles.td}>{order.product.title}</td>
                                    <td className={`${styles.td} font-bold text-white`}>₹{order.totalAmount.toLocaleString('en-IN')}</td>
                                    <td className={styles.td}>
                                        <div className="flex items-center gap-2 font-bold text-xs tracking-wider">
                                            {getStatusIcon(order.status)}
                                            {order.status}
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                                            year: 'numeric', month: 'short', day: 'numeric' 
                                        })}
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-neutral-500 font-bold uppercase tracking-widest">
                                        No transactions match your parameters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* THE FIX: Pagination Controls Interface */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderTop: '1px solid #1a1a1a', background: '#0d0d0d' }}>
                        <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} entries
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{ padding: '6px 12px', background: currentPage === 1 ? '#050505' : '#111', border: '1px solid #222', borderRadius: '6px', color: currentPage === 1 ? '#333' : '#888', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' }}
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{ padding: '6px 12px', background: currentPage === totalPages ? '#050505' : '#111', border: '1px solid #222', borderRadius: '6px', color: currentPage === totalPages ? '#333' : '#888', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' }}
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
// frontend/src/app/admin/customers/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import apiClient from '@/lib/apiClient';
import { Loader2, User, Crown, Mail, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../admin.module.css';

interface Customer {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    isPremium: boolean;
    createdAt: string;
    _count: { orders: number; };
}

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    // THE FIX: Added Search & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await apiClient.get('/admin/customers');
                setCustomers(response.data);
            } catch (error) {
                console.error("Failed to fetch customers:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    // THE FIX: Fast frontend search filtering
    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        const lowerQuery = searchTerm.toLowerCase();
        return customers.filter(customer => 
            customer.email.toLowerCase().includes(lowerQuery) ||
            (customer.firstName && customer.firstName.toLowerCase().includes(lowerQuery)) ||
            (customer.lastName && customer.lastName.toLowerCase().includes(lowerQuery))
        );
    }, [customers, searchTerm]);

    // THE FIX: Array slicing for Pagination
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const paginatedCustomers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredCustomers.slice(start, start + itemsPerPage);
    }, [filteredCustomers, currentPage]);

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
                <h1 className={styles.pageTitle} style={{ marginBottom: 0 }}>Network Directory</h1>
                
                {/* THE FIX: Custom Branded Search Bar */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
                    <Search size={16} color="#666" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="text" 
                        placeholder="Search name or email..." 
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
                                <th className={styles.th}>Customer</th>
                                <th className={styles.th}>Contact</th>
                                <th className={styles.th}>Status</th>
                                <th className={styles.th}>Acquired Assets</th>
                                <th className={styles.th}>Joined Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCustomers.map((customer) => (
                                <tr key={customer.id}>
                                    <td className={styles.td}>
                                        <div className="flex items-center gap-3">
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#111', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <User size={14} color="#666" />
                                            </div>
                                            <div className="font-bold text-white">
                                                {customer.firstName ? `${customer.firstName} ${customer.lastName || ''}` : 'Anonymous User'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <div className="flex items-center gap-2 text-xs">
                                            <Mail size={14} color="#666" /> {customer.email}
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        {customer.isPremium ? (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '4px', background: 'linear-gradient(145deg, #422006, #2e1402)', border: '1px solid #713f12', color: '#eab308', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.1)' }}>
                                                <Crown size={12} /> Premium
                                            </div>
                                        ) : (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '4px', background: '#111', border: '1px solid #333', color: '#888', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                Standard
                                            </div>
                                        )}
                                    </td>
                                    <td className={styles.td}>
                                        <span className="font-bold text-white">{customer._count.orders}</span> <span className="text-neutral-500 text-xs uppercase tracking-wider ml-1">items</span>
                                    </td>
                                    <td className={styles.td}>
                                        {new Date(customer.createdAt).toLocaleDateString('en-IN', { 
                                            year: 'numeric', month: 'short', day: 'numeric' 
                                        })}
                                    </td>
                                </tr>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-neutral-500 font-bold uppercase tracking-widest">
                                        No customers match your search.
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
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} entries
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
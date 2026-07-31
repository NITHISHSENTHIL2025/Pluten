// frontend/src/app/admin/layout.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios'; // THE FIX: Import raw axios to bypass the aggressive interceptor
import {
    LayoutDashboard, ShoppingCart, Users, Package,
    Settings, ShieldAlert, Search, Loader2
} from 'lucide-react';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const verifyClearance = async () => {
            try {
                // THE FIX: Grab the token manually
                const token = localStorage.getItem('token');
                
                if (!token || token === 'undefined' || token === 'null') {
                    throw new Error("No valid token found.");
                }

                // THE FIX: Use raw axios so a 401 doesn't trigger the global interceptor's logout loop
                const res = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL || 'https://iseven.onrender.com/api/v1'}/auth/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                
                const role = res.data.user.role;
                
                // Unified RBAC Policy
                if (role !== 'SUPER_ADMIN' && role !== 'FINANCE_MANAGER' && role !== 'PRODUCT_MANAGER') {
                    throw new Error("Insufficient Clearance");
                }
                
                setAuthorized(true);
            } catch (err) {
                console.error("Dashboard clearance rejected.", err);
                router.push('/login');
            }
        };
        verifyClearance();
    }, [router]);

    if (!authorized) {
        return (
            <div className="min-h-screen bg-black flex justify-center items-center">
                <Loader2 className="animate-spin text-red-800 w-12 h-12" />
            </div>
        );
    }

    return (
        <div className={styles.adminLayout}>
            {/* The Sidebar Engine */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <ShieldAlert size={20} color="#8b0000" />
                    <span className={styles.brandName}>iSevens</span>
                    <span className={styles.environmentBadge}>PROD</span>
                </div>

                <nav className={styles.navGroup}>
                    <span className={styles.navLabel}>Core Operations</span>

                    <Link href="/admin" className={`${styles.navItem} ${pathname === '/admin' ? styles.navItemActive : ''}`}>
                        <LayoutDashboard size={18} /> Overview
                    </Link>
                    <Link href="/admin/orders" className={`${styles.navItem} ${pathname === '/admin/orders' ? styles.navItemActive : ''}`}>
                        <ShoppingCart size={18} /> Orders
                    </Link>
                    <Link href="/admin/customers" className={`${styles.navItem} ${pathname === '/admin/customers' ? styles.navItemActive : ''}`}>
                        <Users size={18} /> Customers
                    </Link>
                    <Link href="/admin/products" className={`${styles.navItem} ${pathname === '/admin/products' ? styles.navItemActive : ''}`}>
                        <Package size={18} /> Products
                    </Link>
                    <Link href="/admin/offers" className={`${styles.navItem} ${pathname === '/admin/offers' ? styles.navItemActive : ''}`}>
                        <span style={{ fontSize: '16px' }}>🏷️</span> Offers
                    </Link>
                </nav>

                <nav className={styles.navGroup} style={{ marginTop: 'auto' }}>
                    <span className={styles.navLabel}>System</span>
                    <Link href="/admin/settings" className={styles.navItem} prefetch={false}>
                        <Settings size={18} /> Settings
                    </Link>
                </nav>
            </aside>

            {/* The Telemetry Content */}
            <main className={styles.mainContent}>
                <header className={styles.topbar}>
                    <div className={styles.searchBar}>
                        <Search size={16} />
                        <span>Search everything...</span>
                        <span className={styles.searchShortcut}>Ctrl K</span>
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
}
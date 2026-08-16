// frontend/src/app/admin/page.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/apiClient'; 
import { TrendingUp, TrendingDown, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import styles from './admin.module.css';

interface TelemetryData {
    revenue: number;
    premiumUsers: number;
    totalUsers: number;
    pendingOrders: number;
}

export default function AdminDashboard() {
    const [data, setData] = useState<TelemetryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

    // THE FIX: Wrapped in useCallback so we can trigger it manually via the retry button
    const fetchTelemetry = useCallback(async (isRetry = false) => {
        if (isRetry) setIsRetrying(true);
        try {
            const response = await apiClient.get('/admin/telemetry');
            setData(response.data);
            setError(null);
        } catch (err: any) {
            console.error("Telemetry Sync Failed:", err);
            setError("Failed to synchronize with Mission Control.");
        } finally {
            setLoading(false);
            if (isRetry) setIsRetrying(false);
        }
    }, []);

    useEffect(() => {
        fetchTelemetry();
        const telemetryInterval = setInterval(() => fetchTelemetry(false), 30000);
        return () => clearInterval(telemetryInterval);
    }, [fetchTelemetry]);

    if (loading && !data) {
        return (
            <div className={`${styles.dashboardContainer} flex justify-center items-center h-full`}>
                <Loader2 className="animate-spin text-gray-500 w-8 h-8" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${styles.dashboardContainer} flex justify-center items-center h-full`}>
                <div style={{ textAlign: 'center', backgroundColor: '#111', padding: '32px', borderRadius: '12px', border: '1px solid #330000', maxWidth: '400px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                        <AlertTriangle size={24} color="#dc2626" />
                    </div>
                    <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>Telemetry Disconnected</h3>
                    <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '24px' }}>{error}</p>
                    
                    {/* THE FIX: Actionable Retry Button */}
                    <button 
                        onClick={() => fetchTelemetry(true)}
                        disabled={isRetrying}
                        style={{ width: '100%', backgroundColor: '#dc2626', color: '#fff', fontWeight: 'bold', padding: '12px', borderRadius: '8px', border: 'none', cursor: isRetrying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                        <RefreshCw size={16} className={isRetrying ? "animate-spin" : ""} /> 
                        {isRetrying ? 'Syncing...' : 'Retry Connection'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className={styles.pageTitle} style={{ marginBottom: 0 }}>Business Performance</h1>
                <button 
                    onClick={() => fetchTelemetry(true)}
                    disabled={isRetrying}
                    style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                    <RefreshCw size={12} className={isRetrying ? "animate-spin" : ""} /> 
                    {isRetrying ? 'Syncing...' : 'Live Sync'}
                </button>
            </div>
            
            <div className={styles.metricGrid}>
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Lifetime Revenue</span>
                    <span className={styles.metricValue}>
                        â‚¹{data?.revenue.toLocaleString('en-IN') || '0'}
                    </span>
                    <span className={styles.metricTrendUp}>
                        <TrendingUp size={14} /> System Online
                    </span>
                </div>

                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Total Customers</span>
                    <span className={styles.metricValue}>
                        {data?.totalUsers.toLocaleString() || '0'}
                    </span>
                    <span className={styles.metricTrendUp}>
                        <TrendingUp size={14} /> Registered network
                    </span>
                </div>

                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Active Premium Members</span>
                    <span className={styles.metricValue}>
                        {data?.premiumUsers.toLocaleString() || '0'}
                    </span>
                    <span className={styles.metricTrendUp}>
                        <TrendingUp size={14} /> Subscription base
                    </span>
                </div>

                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Pending Orders</span>
                    <span className={styles.metricValue}>
                        {data?.pendingOrders.toLocaleString().padStart(2, '0') || '00'}
                    </span>
                    {data && data.pendingOrders > 0 ? (
                        <span className={styles.metricTrendDown}>
                            <TrendingDown size={14} /> Requires attention
                        </span>
                    ) : (
                        <span className={styles.metricTrendUp}>
                            <TrendingUp size={14} /> Queue clear
                        </span>
                    )}
                </div>
            </div>

            <div className={styles.metricCard} style={{ gridColumn: '1 / -1', minHeight: '180px' }}>
                <span className={styles.metricLabel}>Operations status</span>
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-neutral-600">
                    Live activity streaming is not enabled. Core order and telemetry data above remains authoritative.
                </div>
            </div>
        </div>
    );
}

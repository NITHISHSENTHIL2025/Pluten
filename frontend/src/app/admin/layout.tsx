'use client';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, BarChart3, Headphones, LayoutDashboard, Menu, Package, Settings, ShieldCheck, ShoppingCart, Tag, Users, X } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { CAPABILITIES, can, isAdminRole, type AdminRole } from '@/lib/adminPermissions';
import styles from './admin.module.css';

type NavItem = { href: string; label: string; icon: ReactNode; capability: string };
const NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: <LayoutDashboard size={17}/>, capability: CAPABILITIES.overview },
  { href: '/admin/orders', label: 'Orders', icon: <ShoppingCart size={17}/>, capability: CAPABILITIES.orders },
  { href: '/admin/customers', label: 'Customers', icon: <Users size={17}/>, capability: CAPABILITIES.customers },
  { href: '/admin/products', label: 'Products', icon: <Package size={17}/>, capability: CAPABILITIES.products },
  { href: '/admin/offers', label: 'Offers', icon: <Tag size={17}/>, capability: CAPABILITIES.offers },
  { href: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={17}/>, capability: CAPABILITIES.portfolioAnalytics },
  { href: '/admin/support', label: 'Support', icon: <Headphones size={17}/>, capability: CAPABILITIES.support },
  { href: '/admin/security', label: 'Security', icon: <ShieldCheck size={17}/>, capability: CAPABILITIES.downloads },
  { href: '/admin/settings', label: 'Settings', icon: <Settings size={17}/>, capability: CAPABILITIES.settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<AdminRole | null>(null);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await apiClient.get('/auth/me');
        const next = response.data?.user?.role;
        if (!isAdminRole(next)) throw new Error('No admin access');
        if (active) setRole(next);
      } catch {
        if (active) router.replace(`/login?redirect=${encodeURIComponent(pathname || '/admin')}`);
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => { active = false; };
  }, [pathname, router]);

  useEffect(() => setMobileOpen(false), [pathname]);
  const visible = useMemo(() => NAV.filter((item) => can(role, item.capability)), [role]);

  useEffect(() => {
    if (!role) return;
    const current = NAV.find((item) => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`)));
    if (pathname.startsWith('/admin') && current && !can(role, current.capability)) router.replace(visible[0]?.href || '/');
  }, [pathname, role, router, visible]);

  if (checking || !role) return <div className={styles.authLoading}><Activity className={styles.spin} size={28}/><span>Verifying secure access</span></div>;

  return <div className={styles.adminLayout}>
    <button className={styles.mobileMenuButton} onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle admin navigation">{mobileOpen ? <X size={19}/> : <Menu size={19}/>}</button>
    {mobileOpen && <button className={styles.sidebarBackdrop} onClick={() => setMobileOpen(false)} aria-label="Close navigation"/>}
    <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.sidebarHeader}><div className={styles.adminBrandMark}>P</div><div><span className={styles.brandName}>PLUTEN</span><span className={styles.brandSub}>FOUNDER CONTROL</span></div><span className={styles.environmentBadge}>V1</span></div>
      <nav className={styles.navGroup}><span className={styles.navLabel}>Workspace</span>{visible.map((item) => <Link key={item.href} href={item.href} className={`${styles.navItem} ${(pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`))) ? styles.navItemActive : ''}`}>{item.icon}<span>{item.label}</span></Link>)}</nav>
      <div className={styles.sidebarFooter}><div className={styles.roleBadge}><ShieldCheck size={13}/>{role.replaceAll('_', ' ')}</div></div>
    </aside>
    {children}
  </div>;
}

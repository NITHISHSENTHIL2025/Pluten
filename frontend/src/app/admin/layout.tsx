// frontend/src/app/admin/layout.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Settings,
  ShieldAlert,
  Tag,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import styles from "./admin.module.css";

type AdminRole =
  | "SUPER_ADMIN"
  | "FINANCE_MANAGER"
  | "PRODUCT_MANAGER"
  | "CUSTOMER_SUPPORT";

interface MeResponse {
  user: {
    role: AdminRole;
  };
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: AdminRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: <LayoutDashboard size={18} />,
    roles: ["SUPER_ADMIN", "FINANCE_MANAGER"],
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: <ShoppingCart size={18} />,
    roles: ["SUPER_ADMIN", "FINANCE_MANAGER"],
  },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: <Users size={18} />,
    roles: ["SUPER_ADMIN", "CUSTOMER_SUPPORT"],
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: <Package size={18} />,
    roles: ["SUPER_ADMIN", "PRODUCT_MANAGER"],
  },
  {
    href: "/admin/offers",
    label: "Offers",
    icon: <Tag size={18} />,
    roles: ["SUPER_ADMIN", "PRODUCT_MANAGER"],
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: <Settings size={18} />,
    roles: ["SUPER_ADMIN"],
  },
];

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verifyClearance = async () => {
      try {
        const response = await apiClient.get<MeResponse>("/auth/me");
        const currentRole = response.data?.user?.role;

        if (
          !currentRole ||
          ![
            "SUPER_ADMIN",
            "FINANCE_MANAGER",
            "PRODUCT_MANAGER",
            "CUSTOMER_SUPPORT",
          ].includes(currentRole)
        ) {
          throw new Error("Insufficient clearance.");
        }

        if (mounted) {
          setRole(currentRole);
          setAuthorized(true);
        }
      } catch (error) {
        console.error("Dashboard clearance rejected:", error);
        if (mounted) router.replace("/login?redirect=/admin");
      } finally {
        if (mounted) setChecking(false);
      }
    };

    verifyClearance();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const visibleItems = useMemo(() => {
    if (!role) return [];
    return NAV_ITEMS.filter((item) => item.roles.includes(role));
  }, [role]);

  if (checking || !authorized) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="animate-spin text-red-700" size={34} />
          <span className="text-xs tracking-[0.25em] uppercase text-neutral-500">
            Verifying secure access
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.adminLayout} min-h-[100dvh]`}>
      <button
        type="button"
        className="fixed left-4 top-4 z-[100] hidden max-[900px]:flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-800 bg-black/80 text-white backdrop-blur-xl"
        onClick={() => setMobileOpen((value) => !value)}
        aria-label={mobileOpen ? "Close admin menu" : "Open admin menu"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close admin menu overlay"
          className="fixed inset-0 z-[80] hidden max-[900px]:block bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`${styles.sidebar} ${mobileOpen ? "!translate-x-0" : ""} max-[900px]:fixed max-[900px]:left-0 max-[900px]:top-0 max-[900px]:z-[90] max-[900px]:h-[100dvh] max-[900px]:transition-transform max-[900px]:duration-300 max-[900px]:-translate-x-full`}
      >
        <div className={styles.sidebarHeader}>
          <ShieldAlert size={20} />
          <span className={styles.brandName}>PLUTEN</span>
          <span className={styles.environmentBadge}>PROD</span>
        </div>

        <nav className={styles.navGroup} aria-label="Admin navigation">
          <span className={styles.navLabel}>Core Operations</span>

          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ""}`}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className={styles.mainContent}>
        <header className={`${styles.topbar} flex items-center justify-between gap-4`}>
          <div className="pl-[52px] max-[900px]:pl-16">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Mission Control
            </span>
            <span className="ml-3 hidden sm:inline text-[11px] text-neutral-700">
              / secure operations
            </span>
          </div>

          <span className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
            {role?.replaceAll("_", " ")}
          </span>
        </header>

        {children}
      </main>
    </div>
  );
}

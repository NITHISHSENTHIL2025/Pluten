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
  ShieldCheck,
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
  icon: ReactNode;
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

  const [role, setRole] =
    useState<AdminRole | null>(null);
  const [checking, setChecking] =
    useState(true);
  const [mobileOpen, setMobileOpen] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      try {
        const response =
          await apiClient.get<MeResponse>(
            "/auth/me"
          );

        const nextRole =
          response.data?.user?.role;

        const allowed: AdminRole[] = [
          "SUPER_ADMIN",
          "FINANCE_MANAGER",
          "PRODUCT_MANAGER",
          "CUSTOMER_SUPPORT",
        ];

        if (
          !nextRole ||
          !allowed.includes(nextRole)
        ) {
          throw new Error(
            "Insufficient clearance."
          );
        }

        if (mounted) {
          setRole(nextRole);
        }
      } catch (error) {
        console.error(
          "Admin authorization failed:",
          error
        );

        if (mounted) {
          router.replace(
            `/login?redirect=${encodeURIComponent(
              pathname || "/admin"
            )}`
          );
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const visibleItems = useMemo(
    () =>
      role
        ? NAV_ITEMS.filter((item) =>
            item.roles.includes(role)
          )
        : [],
    [role]
  );

  useEffect(() => {
    if (!role) return;
    const current = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    if (pathname.startsWith("/admin") && (!current || !current.roles.includes(role))) {
      const firstAllowed = visibleItems[0]?.href || "/";
      if (pathname !== firstAllowed) router.replace(firstAllowed);
    }
  }, [pathname, role, router, visibleItems]);

  if (checking || !role) {
    return (
      <div className={styles.authLoading}>
        <Loader2
          className="animate-spin"
          size={30}
        />
        <span>
          Verifying secure access
        </span>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      <button
        type="button"
        className={styles.mobileMenuButton}
        onClick={() =>
          setMobileOpen((open) => !open)
        }
        aria-label={
          mobileOpen
            ? "Close admin navigation"
            : "Open admin navigation"
        }
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? (
          <X size={20} />
        ) : (
          <Menu size={20} />
        )}
      </button>

      {mobileOpen && (
        <button
          type="button"
          className={styles.sidebarBackdrop}
          aria-label="Close admin navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`${styles.sidebar} ${
          mobileOpen
            ? styles.sidebarOpen
            : ""
        }`}
      >
        <div
          className={styles.sidebarHeader}
        >
          <div
            className={styles.adminBrandMark}
            aria-hidden="true"
          >
            P
          </div>
          <div>
            <span
              className={styles.brandName}
            >
              PLUTEN
            </span>
            <span
              className={styles.brandSub}
            >
              MISSION CONTROL
            </span>
          </div>
          <span
            className={styles.environmentBadge}
          >
            PROD
          </span>
        </div>

        <nav
          className={styles.navGroup}
          aria-label="Admin navigation"
        >
          <span
            className={styles.navLabel}
          >
            Workspace
          </span>

          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${
                pathname === item.href
                  ? styles.navItemActive
                  : ""
              }`}
              aria-current={
                pathname === item.href
                  ? "page"
                  : undefined
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div
          className={styles.sidebarFooter}
        >
          <div
            className={styles.roleBadge}
          >
            <ShieldCheck size={14} />
            <span>
              {role.replaceAll(
                "_",
                " "
              )}
            </span>
          </div>
          <Link
            href="/"
            className={
              styles.backToStore
            }
          >
            ← Back to Pluten
          </Link>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div>
            <span
              className={
                styles.topbarEyebrow
              }
            >
              Mission Control
            </span>
            <span
              className={
                styles.topbarSlash
              }
            >
              / secure operations
            </span>
          </div>

          <div
            className={styles.topbarRole}
          >
            {role.replaceAll(
              "_",
              " "
            )}
          </div>
        </header>

        <div
          className={styles.pageShell}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

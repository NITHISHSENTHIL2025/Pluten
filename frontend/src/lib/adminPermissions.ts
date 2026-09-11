export type AdminRole = 'SUPER_ADMIN' | 'FINANCE_MANAGER' | 'PRODUCT_MANAGER' | 'CUSTOMER_SUPPORT';

export const CAPABILITIES = {
  overview: 'overview.view',
  live: 'live.view',
  orders: 'orders.view',
  customers: 'customers.view',
  products: 'products.manage',
  offers: 'offers.manage',
  productAnalytics: 'analytics.products.view',
  portfolioAnalytics: 'analytics.portfolios.view',
  audit: 'security.audit.view',
  downloads: 'security.downloads.view',
  support: 'support.view',
  settings: 'health.view',
} as const;

const ROLE_CAPABILITIES: Record<AdminRole, string[]> = {
  SUPER_ADMIN: Object.values(CAPABILITIES),
  FINANCE_MANAGER: [CAPABILITIES.overview, CAPABILITIES.live, CAPABILITIES.orders, CAPABILITIES.productAnalytics, CAPABILITIES.portfolioAnalytics],
  PRODUCT_MANAGER: [CAPABILITIES.live, CAPABILITIES.products, CAPABILITIES.offers, CAPABILITIES.productAnalytics, CAPABILITIES.portfolioAnalytics],
  CUSTOMER_SUPPORT: [CAPABILITIES.live, CAPABILITIES.customers, CAPABILITIES.portfolioAnalytics, CAPABILITIES.downloads, CAPABILITIES.support],
};

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && value in ROLE_CAPABILITIES;
}

export function can(role: AdminRole | null | undefined, capability: string) {
  return Boolean(role && ROLE_CAPABILITIES[role]?.includes(capability));
}

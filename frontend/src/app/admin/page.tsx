"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BriefcaseBusiness,
  Eye,
  Loader2,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  Radio,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import styles from "./admin.module.css";

type Range = "today" | "7d" | "30d" | "90d";

interface Metrics {
  revenue: number;
  previousRevenue: number;
  revenueDelta: number;
  orders: number;
  previousOrders: number;
  orderDelta: number;
  newCustomers: number;
  previousCustomers: number;
  customerDelta: number;
  productViews: number;
  uniqueVisitors: number;
  returningVisitors: number;
  returningRate: number;
  liveVisitors: number;
  portfolioCreated: number;
  portfolioPublished: number;
  repeatCustomers: number;
  failedPayments: number;
  pendingOrders: number;
  totalUsers: number;
  premiumUsers: number;
  averageOrderValue: number;
  viewToPurchase: number;
  todayRevenue: number;
  todayOrders: number;
  todayProductViews: number;
  todayPortfolios: number;
}

interface OverviewData {
  range: Range;
  timestamp: string;
  metrics: Metrics;
  revenueSeries: Array<{
    day: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    id: string;
    title: string;
    orders: number;
    revenue: number;
  }>;
  devices: Array<{
    device: string;
    value: number;
  }>;
  sources: Array<{
    source: string;
    value: number;
  }>;
  countries: Array<{
    country: string;
    value: number;
  }>;
  funnel: {
    visitors: number;
    productViewers: number;
    checkouts: number;
    paymentAttempts: number;
    purchases: number;
  };
  recentOrders: Array<{
    id: string;
    totalAmount: number | string;
    status: string;
    createdAt: string;
    user?: {
      email?: string;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
    product?: {
      title?: string;
    } | null;
  }>;
  topConvertingProducts: Array<{
    id: string;
    title: string;
    views: number;
    orders: number;
    revenue: number;
    conversion: number;
  }>;
  productHealth: {
    missingDigitalAssets: Array<{
      id: string;
      title: string;
    }>;
  };
  attention: Array<{
    severity: "critical" | "warning";
    title: string;
    detail: string;
  }>;
}

const money = (value: number | string | null | undefined) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const number = (value: number | string | null | undefined) =>
  Number(value || 0).toLocaleString("en-IN");

const percent = (value: number | string | null | undefined) =>
  `${Number(value || 0).toFixed(1)}%`;

const customerName = (
  user?: OverviewData["recentOrders"][number]["user"],
) => {
  if (!user) return "Unknown customer";

  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email || "Unknown customer";
};

const tone = (value: number) => (value >= 0 ? styles.metricTrendUp : styles.metricTrendDown);

export default function AdminDashboard() {
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (manual = false) => {
      try {
        if (manual) setRefreshing(true);

        const response = await apiClient.get(
          `/admin/overview?range=${range}`,
        );

        setData(response.data);
        setError(null);
      } catch (requestError) {
        console.error("[ADMIN OVERVIEW]", requestError);
        setError("Unable to load the Pluten business overview.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range],
  );

  useEffect(() => {
    load();

    const timer = window.setInterval(() => {
      load();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [load]);

  if (loading && !data) {
    return (
      <div className={styles.authLoading}>
        <Loader2 className="pluten-login-spinner" size={30} />
        <span>Loading mission control</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <main className={styles.dashboardContainer}>
        <div className={styles.header}>
          <div>
            <p className={styles.pageEyebrow}>PLUTEN / OPERATIONS</p>
            <h1 className={styles.pageTitle}>Overview</h1>
          </div>
        </div>

        <div className={styles.errorState}>
          <AlertTriangle size={24} />
          <h2>Overview disconnected.</h2>
          <p>{error}</p>

          <button
            className={styles.primaryButton}
            onClick={() => load(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="pluten-login-spinner" size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const { metrics } = data;

  return (
    <main className={styles.dashboardContainer}>
      <div className={styles.header}>
        <div>
          <p className={styles.pageEyebrow}>PLUTEN / OPERATIONS</p>
          <h1 className={styles.pageTitle}>Overview</h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "#777",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Founder command center for revenue, customers, traffic,
            products and platform activity.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as Range)}
            style={{
              minHeight: 40,
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid #292929",
              background: "#141414",
              color: "#fff",
              fontSize: 12,
            }}
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <button
            className={styles.iconBtn}
            onClick={() => load(true)}
            disabled={refreshing}
            title="Refresh overview"
          >
            {refreshing ? (
              <Loader2 className="pluten-login-spinner" size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        </div>
      </div>

      <section className={styles.metricGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Revenue</span>
          <strong className={styles.metricValue}>
            {money(metrics.revenue)}
          </strong>
          <span className={tone(metrics.revenueDelta)}>
            <TrendingUp size={14} />
            {metrics.revenueDelta >= 0 ? "+" : ""}
            {percent(metrics.revenueDelta)} vs previous
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Successful orders</span>
          <strong className={styles.metricValue}>
            {number(metrics.orders)}
          </strong>
          <span className={tone(metrics.orderDelta)}>
            <ShoppingCart size={14} />
            {metrics.orderDelta >= 0 ? "+" : ""}
            {percent(metrics.orderDelta)} vs previous
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Customers</span>
          <strong className={styles.metricValue}>
            {number(metrics.totalUsers)}
          </strong>
          <span className={tone(metrics.customerDelta)}>
            <Users size={14} />
            +{number(metrics.newCustomers)} new
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Live visitors</span>
          <strong className={styles.metricValue}>
            {number(metrics.liveVisitors)}
          </strong>
          <span className={styles.metricTrendUp}>
            <Radio size={14} />
            Active right now
          </span>
        </div>
      </section>

      <section
        className={styles.metricGrid}
        style={{ marginTop: 14 }}
      >
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Product views</span>
          <strong className={styles.metricValue}>
            {number(metrics.productViews)}
          </strong>
          <span className={styles.metricTrendUp}>
            <Eye size={14} />
            {number(metrics.uniqueVisitors)} unique visitors
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Returning visitors</span>
          <strong className={styles.metricValue}>
            {number(metrics.returningVisitors)}
          </strong>
          <span className={styles.metricTrendUp}>
            <Users size={14} />
            {percent(metrics.returningRate)} return rate
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Portfolios created</span>
          <strong className={styles.metricValue}>
            {number(metrics.portfolioCreated)}
          </strong>
          <span className={styles.metricTrendUp}>
            <BriefcaseBusiness size={14} />
            {number(metrics.portfolioPublished)} published
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Average order value</span>
          <strong className={styles.metricValue}>
            {money(metrics.averageOrderValue)}
          </strong>
          <span className={styles.metricTrendUp}>
            <TrendingUp size={14} />
            {percent(metrics.viewToPurchase)} view → purchase
          </span>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(320px, .8fr)",
          gap: 14,
          marginTop: 14,
        }}
      >
        <div className={styles.tableCard}>
          <div style={{ padding: 20 }}>
            <p className={styles.pageEyebrow}>REVENUE</p>
            <h2 style={{ margin: "7px 0 0", fontSize: 22 }}>
              Business performance
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                gap: 10,
                marginTop: 18,
              }}
            >
              <div>
                <span className={styles.metricLabel}>Today</span>
                <strong
                  style={{
                    display: "block",
                    marginTop: 7,
                    fontSize: 21,
                    color: "#fff",
                  }}
                >
                  {money(metrics.todayRevenue)}
                </strong>
              </div>

              <div>
                <span className={styles.metricLabel}>Today orders</span>
                <strong
                  style={{
                    display: "block",
                    marginTop: 7,
                    fontSize: 21,
                    color: "#fff",
                  }}
                >
                  {number(metrics.todayOrders)}
                </strong>
              </div>

              <div>
                <span className={styles.metricLabel}>Today views</span>
                <strong
                  style={{
                    display: "block",
                    marginTop: 7,
                    fontSize: 21,
                    color: "#fff",
                  }}
                >
                  {number(metrics.todayProductViews)}
                </strong>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              {data.revenueSeries.length ? (
                data.revenueSeries.slice(-14).map((item) => {
                  const maxRevenue = Math.max(
                    ...data.revenueSeries.map((entry) => entry.revenue),
                    1,
                  );

                  return (
                    <div
                      key={item.day}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "78px 1fr 95px",
                        gap: 12,
                        alignItems: "center",
                        marginBottom: 9,
                      }}
                    >
                      <span style={{ color: "#777", fontSize: 10 }}>
                        {item.day.slice(5)}
                      </span>

                      <div
                        style={{
                          height: 8,
                          background: "#191919",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(
                              2,
                              (item.revenue / maxRevenue) * 100,
                            )}%`,
                            height: "100%",
                            background: "#e6e6e0",
                            borderRadius: 999,
                          }}
                        />
                      </div>

                      <span
                        style={{
                          color: "#d8d8d2",
                          fontSize: 11,
                          textAlign: "right",
                        }}
                      >
                        {money(item.revenue)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: "#666", fontSize: 12 }}>
                  No revenue activity in this period.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.tableCard}>
          <div style={{ padding: 20 }}>
            <p className={styles.pageEyebrow}>ATTENTION REQUIRED</p>
            <h2 style={{ margin: "7px 0 18px", fontSize: 22 }}>
              What needs action
            </h2>

            {data.attention.length ? (
              data.attention.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  style={{
                    padding: "13px 0",
                    borderTop: "1px solid #1d1d1d",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 9,
                      alignItems: "center",
                    }}
                  >
                    <AlertTriangle
                      size={15}
                      color={item.severity === "critical" ? "#ef6a6f" : "#d6b45d"}
                    />
                    <strong
                      style={{
                        color: "#f0f0eb",
                        fontSize: 12,
                      }}
                    >
                      {item.title}
                    </strong>
                  </div>

                  <p
                    style={{
                      margin: "6px 0 0 24px",
                      color: "#777",
                      fontSize: 11,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.detail}
                  </p>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: "20px 0",
                  color: "#55bc82",
                  fontSize: 12,
                }}
              >
                No critical issues detected.
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
          gap: 14,
          marginTop: 14,
        }}
      >
        <div className={styles.tableCard}>
          <div style={{ padding: 20 }}>
            <p className={styles.pageEyebrow}>PRODUCTS</p>
            <h2 style={{ margin: "7px 0 18px", fontSize: 22 }}>
              Best sellers
            </h2>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Product</th>
                    <th className={styles.th}>Orders</th>
                    <th className={styles.th}>Revenue</th>
                  </tr>
                </thead>

                <tbody>
                  {data.topProducts.length ? (
                    data.topProducts.slice(0, 6).map((product) => (
                      <tr key={product.id}>
                        <td className={styles.td}>{product.title}</td>
                        <td className={styles.td}>
                          {number(product.orders)}
                        </td>
                        <td className={styles.td}>
                          {money(product.revenue)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className={styles.td} colSpan={3}>
                        No product sales in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={styles.tableCard}>
          <div style={{ padding: 20 }}>
            <p className={styles.pageEyebrow}>CONVERSION</p>
            <h2 style={{ margin: "7px 0 18px", fontSize: 22 }}>
              Funnel health
            </h2>

            {[
              ["Visitors", data.funnel.visitors],
              ["Product viewers", data.funnel.productViewers],
              ["Checkout starts", data.funnel.checkouts],
              ["Payment attempts", data.funnel.paymentAttempts],
              ["Purchases", data.funnel.purchases],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderTop: "1px solid #1d1d1d",
                }}
              >
                <span style={{ color: "#999", fontSize: 12 }}>
                  {label}
                </span>

                <strong style={{ color: "#fff", fontSize: 14 }}>
                  {number(Number(value))}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.tableCard} style={{ marginTop: 14 }}>
        <div style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div>
              <p className={styles.pageEyebrow}>RECENT ACTIVITY</p>
              <h2 style={{ margin: "7px 0 0", fontSize: 22 }}>
                Latest orders
              </h2>
            </div>

            <span className={styles.topbarRole}>
              {number(data.recentOrders.length)} shown
            </span>
          </div>

          <div className={styles.tableWrap} style={{ marginTop: 18 }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Order</th>
                  <th className={styles.th}>Customer</th>
                  <th className={styles.th}>Product</th>
                  <th className={styles.th}>Amount</th>
                  <th className={styles.th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {data.recentOrders.length ? (
                  data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className={styles.td}>
                        #{String(order.id).slice(0, 12)}
                      </td>
                      <td className={styles.td}>
                        {customerName(order.user)}
                      </td>
                      <td className={styles.td}>
                        {order.product?.title || "—"}
                      </td>
                      <td className={styles.td}>
                        {money(order.totalAmount)}
                      </td>
                      <td className={styles.td}>
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "5px 8px",
                            borderRadius: 999,
                            border: "1px solid #292929",
                            fontSize: 9,
                            fontWeight: 800,
                            letterSpacing: ".08em",
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className={styles.td} colSpan={5}>
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,minmax(0,1fr))",
          gap: 14,
          marginTop: 14,
        }}
      >
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Pending orders</span>
          <strong className={styles.metricValue}>
            {number(metrics.pendingOrders)}
          </strong>
          <span className={styles.metricTrendDown}>
            <ShoppingCart size={14} />
            Review required
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Failed payments</span>
          <strong className={styles.metricValue}>
            {number(metrics.failedPayments)}
          </strong>
          <span className={styles.metricTrendDown}>
            <AlertTriangle size={14} />
            Payment health
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Repeat customers</span>
          <strong className={styles.metricValue}>
            {number(metrics.repeatCustomers)}
          </strong>
          <span className={styles.metricTrendUp}>
            <ArrowUpRight size={14} />
            Lifetime buyers
          </span>
        </div>
      </section>
    </main>
  );
}
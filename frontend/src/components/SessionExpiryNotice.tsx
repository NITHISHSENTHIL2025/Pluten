"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SESSION_EXPIRED_EVENT } from "@/lib/apiClient";

export default function SessionExpiryNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onExpired = () => setVisible(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="false"
      aria-label="Session expired"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "20px",
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: "min(92vw, 520px)",
        padding: "16px 18px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,.12)",
        background: "rgba(18,18,18,.94)",
        color: "#fff",
        boxShadow: "0 18px 60px rgba(0,0,0,.32)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <strong style={{ display: "block", marginBottom: 5 }}>
            Your session needs attention.
          </strong>
          <p style={{ margin: 0, opacity: 0.78, lineHeight: 1.5, fontSize: 14 }}>
            Your current changes remain in this browser. Sign in again to continue saving securely.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss session notice"
          style={{
            border: 0,
            background: "transparent",
            color: "inherit",
            fontSize: 22,
            lineHeight: 1,
            cursor: "pointer",
            padding: 2,
          }}
        >
          ×
        </button>
      </div>
      <Link
        href="/login"
        style={{
          display: "inline-flex",
          marginTop: 12,
          padding: "9px 14px",
          borderRadius: 999,
          background: "#fff",
          color: "#111",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        Sign in again →
      </Link>
    </div>
  );
}

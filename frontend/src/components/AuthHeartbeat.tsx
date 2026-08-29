"use client";

import { useEffect } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

function hasSessionHint() {
  return typeof document !== "undefined" && document.cookie.includes("client_auth=true");
}

async function refreshSession() {
  if (!API_URL || !hasSessionHint()) return;

  try {
    await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    // The editor's local draft protection is the fallback when offline.
  }
}

export default function AuthHeartbeat() {
  useEffect(() => {
    void refreshSession();

    const timer = window.setInterval(() => {
      void refreshSession();
    }, 8 * 60 * 1000);

    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshSession();
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}

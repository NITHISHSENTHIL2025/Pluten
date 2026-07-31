import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // This applies the unblock rule to every page in your app
        source: "/(.*)",
        headers: [
          {
            // THE FIX: Tells Next.js to allow the Google popup to send the token back
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
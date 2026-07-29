// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // THIS LINE IS CRITICAL - It loads Tailwind and your dark theme!
import { OfferProvider } from "@/context/OfferContext";

export const metadata: Metadata = {
    title: "iSevens | Premium Digital Ecosystem",
    description: "A premium ecosystem for people who want to improve every area of their lives.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="bg-[#0a0a0a] text-[#f5f5f5] antialiased">
                <OfferProvider>
                    {/* This renders your page.tsx, login, profile, etc. */}
                    {children} 
                </OfferProvider>
            </body>
        </html>
    );
}
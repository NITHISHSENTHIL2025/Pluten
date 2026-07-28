// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // THE FIX: Restores Tailwind and global CSS bindings
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
            <body className="bg-obsidian text-softWhite antialiased">
                <OfferProvider>
                    {children}
                </OfferProvider>
            </body>
        </html>
    );
}
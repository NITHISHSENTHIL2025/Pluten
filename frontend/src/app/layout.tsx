"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient'; // THE FIX: Added to destroy backend session

export default function Navbar() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Read the user session saved during login/registration
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = async () => {
        try {
            // Destroy the secure HttpOnly cookie on the backend
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error("Logout network fault:", error);
        } finally {
            // THE FIX: Wipe unified keys AND the frontend middleware cookie
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            document.cookie = "client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            window.location.href = '/login';
        }
    };

    return (
        <nav className="...">
            {/* Your logo and links */}
            
            {user ? (
                <div className="flex items-center gap-4">
                    <span className="text-sm text-neutral-300">
                        Welcome, {user.firstName || 'User'}
                    </span>
                    <button 
                        onClick={handleLogout}
                        className="text-xs text-red-400 hover:text-red-350 border border-red-900/50 px-3 py-1.5 rounded"
                    >
                        TERMINATE SESSION
                    </button>
                </div>
            ) : (
                <Link href="/login" className="px-4 py-2 bg-red-600 text-white rounded">
                    ACCESS SECURELY
                </Link>
            )}
        </nav>
    );
}
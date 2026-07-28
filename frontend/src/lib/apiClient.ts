// frontend/src/lib/apiClient.ts
import axios from 'axios';

// 1. Create a core instance with base configurations
const apiClient = axios.create({
    // THE FIX: Updated the fallback URL to target the v1 architecture
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
    withCredentials: true, // ALWAYS send the secure HttpOnly cookie
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Global Error Interceptor (Optional but highly recommended)
// If the backend ever responds with a 401 (Unauthorized), this instantly redirects to login.
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear any lingering frontend state
            if (typeof window !== 'undefined') {
                localStorage.removeItem('role');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
// frontend/src/lib/apiClient.ts
import axios from 'axios';

// 1. Create a core instance with base configurations
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://iseven.onrender.com/api/v1',
    withCredentials: true, 
    headers: {
        'Content-Type': 'application/json',
    },
});

// THE FIX: The Request Interceptor
// This reaches into localStorage, grabs your secure token, and manually staples it 
// to the front of the request. Browsers cannot block this!
apiClient.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// 2. Global Error Interceptor
// If the backend ever responds with a 401 (Unauthorized), this instantly redirects to login.
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear any lingering frontend state using the Unified Keys
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                document.cookie = "client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
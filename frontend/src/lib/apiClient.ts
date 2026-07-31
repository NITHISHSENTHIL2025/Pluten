// frontend/src/lib/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://iseven.onrender.com/api/v1',
    withCredentials: true, 
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        
        // THE FIX: Strictly ensure the token is a real token, not a corrupted string
        if (token && token !== 'undefined' && token !== 'null' && token !== '') {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // THE FIX: ONLY log the user out if the token is completely missing/dead (401)
        // Do NOT log them out for a 403 (Insufficient Clearance). 
        if (error.response?.status === 401) {
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
import axios from 'axios';

let isRedirecting = false;

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
        if (token && token !== 'undefined' && token !== 'null' && token !== '') {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only trigger logout sequence on 401, and only if not already redirecting
        if (error.response?.status === 401 && !isRedirecting) {
            isRedirecting = true;
            
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                
                document.cookie = "client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                
                window.location.href = '/login?expired=true';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
import axios from 'axios';

let isRedirecting = false;

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const url = typeof window !== 'undefined' ? window.location.pathname : '';

        if (
            status === 401 &&
            typeof window !== 'undefined' &&
            !isRedirecting &&
            url !== '/login'
        ) {
            isRedirecting = true;
            const redirect = `${window.location.pathname}${window.location.search}`;
            window.location.replace(`/login?expired=true&redirect=${encodeURIComponent(redirect)}`);
        }

        return Promise.reject(error);
    }
);

export default apiClient;

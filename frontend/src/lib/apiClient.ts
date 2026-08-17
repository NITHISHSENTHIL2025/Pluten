import axios from 'axios';

const baseURL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestId = error?.response?.headers?.['x-request-id'];

    if (requestId) {
      error.requestId = requestId;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
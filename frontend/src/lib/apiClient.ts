import axios from "axios";

let isRedirecting = false;

const PROTECTED_PREFIXES = [
  "/auth/me",
  "/user/",
  "/admin/",
  "/payments/create",
  "/payments/verify",
];

function isProtectedRequest(url?: string) {
  if (!url) return false;
  return PROTECTED_PREFIXES.some((prefix) => url.includes(prefix));
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    if (
      status === 401 &&
      isProtectedRequest(url) &&
      !isRedirecting &&
      typeof window !== "undefined"
    ) {
      isRedirecting = true;

      const currentPath =
        `${window.location.pathname}${window.location.search}`;

      const redirect = encodeURIComponent(currentPath);

      window.location.href = `/login?expired=true&redirect=${redirect}`;
    }

    return Promise.reject(error);
  }
);

export default apiClient;

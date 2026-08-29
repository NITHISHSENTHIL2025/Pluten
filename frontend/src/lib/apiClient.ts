export const SESSION_EXPIRED_EVENT = "pluten:session-expired";

import axios from "axios";

const baseURL = (
  process.env.NEXT_PUBLIC_API_URL || ""
).replace(/\/+$/, "");

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestId =
      error?.response?.headers?.["x-request-id"];

    if (error?.response?.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    if (requestId) {
      error.requestId = requestId;
    }

    if (!axios.isCancel(error)) console.error("[API ERROR]", {
      status: error?.response?.status,
      method: error?.config?.method,
      url: error?.config?.url,
      response: error?.response?.data,
      requestId,
      message: error?.message,
    });

    return Promise.reject(error);
  },
);

export default apiClient;
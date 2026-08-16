import axios from "axios";

let isRedirecting = false;

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
    if (
      error.response?.status === 401 &&
      !isRedirecting &&
      typeof window !== "undefined"
    ) {
      isRedirecting = true;

      // Do not store or recreate authentication tokens in JS.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      document.cookie =
        "client_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      document.cookie =
        "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      window.location.href =
        "/login?expired=true";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
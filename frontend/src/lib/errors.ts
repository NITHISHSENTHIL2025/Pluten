import axios from "axios";

export function getApiErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const value = error.response?.data;
    if (value && typeof value === "object" && "error" in value) {
      const message = (value as { error?: unknown }).error;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  return fallback;
}

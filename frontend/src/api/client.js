import axios from "axios";
import { getStoredToken } from "../auth/storage";

const baseURL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getApiError = (error, fallbackMessage) =>
  error?.response?.data?.message ||
  (Array.isArray(error?.response?.data?.details)
    ? error.response.data.details.join(" ")
    : null) ||
  fallbackMessage;

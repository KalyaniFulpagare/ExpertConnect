import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";

export const api = axios.create({
  baseURL
});

export const getApiError = (error, fallbackMessage) =>
  error?.response?.data?.message ||
  (Array.isArray(error?.response?.data?.details)
    ? error.response.data.details.join(" ")
    : null) ||
  fallbackMessage;

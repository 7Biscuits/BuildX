import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const AUTH_TOKEN_KEY = "buildx.auth.token";
const AUTH_LOGOUT_EVENT = "buildx:auth:logout";
const API_ERROR_EVENT = "buildx:api:error";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export type ApiErrorDetail = {
  status?: number;
  message: string;
  errors?: unknown[];
};

export function getStoredAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuthToken(token: string | null) {
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function subscribeToAuthLogout(callback: () => void) {
  window.addEventListener(AUTH_LOGOUT_EVENT, callback);
  return () => window.removeEventListener(AUTH_LOGOUT_EVENT, callback);
}

export function subscribeToApiErrors(callback: (detail: ApiErrorDetail) => void) {
  const handler = (event: Event) => {
    callback((event as CustomEvent<ApiErrorDetail>).detail);
  };
  window.addEventListener(API_ERROR_EVENT, handler);
  return () => window.removeEventListener(API_ERROR_EVENT, handler);
}

function dispatchApiError(detail: ApiErrorDetail) {
  window.dispatchEvent(new CustomEvent(API_ERROR_EVENT, { detail }));
}

function dispatchLogout() {
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
}

function normalizeApiError(error: AxiosError): ApiErrorDetail {
  const data = error.response?.data as
    | { message?: string; errors?: unknown[] }
    | undefined;

  return {
    status: error.response?.status,
    message: data?.message ?? error.message ?? "Request failed.",
    errors: data?.errors,
  };
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const detail = normalizeApiError(error);

    if (detail.status === 401) {
      setStoredAuthToken(null);
      dispatchLogout();
    }

    dispatchApiError(detail);
    return Promise.reject(error);
  },
);

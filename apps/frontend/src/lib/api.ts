export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // In browser, always route through relative path /api/v1 so Nginx reverse proxy handles it
    // Eliminates all CORS errors, SSL mixed content errors, and localhost issues.
    return "/api/v1";
  }
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000/api/v1";
}

export function getStoredToken(): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem("auth_token");
    } catch {
      return null;
    }
  }
  return null;
}

export function setStoredToken(token: string | null) {
  if (typeof window !== "undefined") {
    try {
      if (token) {
        localStorage.setItem("auth_token", token);
      } else {
        localStorage.removeItem("auth_token");
      }
    } catch {
      // Ignore localStorage security restrictions
    }
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, headers, ...restOptions } = options;

  const base = getApiBaseUrl();
  let url = `${base}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes("?") ? "&" : "?") + qs;
    }
  }

  const token = getStoredToken();
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(url, {
    credentials: "include", // Ensures session cookies are sent
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    },
    ...restOptions,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `Request failed with status ${response.status}` };
    }
    const message =
      errorData?.error?.message ||
      errorData?.message ||
      `HTTP error ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return response.json();
}

export async function uploadDocument(
  file: File,
  documentType: string,
): Promise<{ storageKey: string; fileName: string; originalName: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);

  const base = getApiBaseUrl();
  const url = `${base}/documents/upload`;

  const token = getStoredToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `Upload failed with status ${response.status}` };
    }
    const message =
      errorData?.error?.message ||
      errorData?.message ||
      `Upload failed with HTTP ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return response.json();
}

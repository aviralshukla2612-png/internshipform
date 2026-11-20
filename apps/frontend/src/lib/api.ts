const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, headers, ...restOptions } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

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

  const response = await fetch(url, {
    credentials: "include", // Ensures session cookies are sent
    headers: {
      "Content-Type": "application/json",
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

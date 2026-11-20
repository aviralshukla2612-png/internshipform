"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  department?: string;
  designation?: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  hasRole: () => false,
  hasPermission: () => false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session on load
    apiClient<AuthUser>("/auth/me")
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = (newUser: AuthUser) => {
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  };

  const hasRole = (role: string) => {
    if (!user) return false;
    if (user.roles.includes("SUPER_ADMIN")) return true;
    return user.roles.includes(role);
  };

  const hasPermission = (perm: string) => {
    if (!user) return false;
    if (user.roles.includes("SUPER_ADMIN")) return true;
    return user.permissions.includes(perm);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{ user, isLoading, login, logout, hasRole, hasPermission }}
      >
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

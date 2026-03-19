"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, clearToken, setToken } from "@/lib/api";
import type { Member, MemberRole } from "@/types/auth";

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role?: MemberRole;
  termsAgreedAt: string; // ISO datetime
}

interface AuthContextValue {
  user: Member | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<Member>("/auth/me");
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<{ token: string; member: Member }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(res.token);
      setUser(res.member);
    },
    []
  );

  const signup = useCallback(
    async (data: SignupData) => {
      await api("/members", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone || null,
          address: data.address || null,
          role: data.role ?? "USER",
          termsAgreedAt: data.termsAgreedAt,
        }),
      });
      await login(data.email, data.password);
    },
    [login]
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

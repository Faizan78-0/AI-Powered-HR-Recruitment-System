"use client";
import { useState, useEffect, useCallback } from "react";
import type { User } from "@/types";
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchUser = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me");
      if (r.ok) {
        const d = await r.json();
        setUser(d.data);
      } else setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);
  const logout = async () => {
    await fetch("/api/auth/bx/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/auth/bx/login";
  };
  return { user, loading, logout, refetch: fetchUser };
}

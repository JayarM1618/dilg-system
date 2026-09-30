"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { homeFor } from "@/lib/roles";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const { user } = await api.get<{ user: User }>("/api/me");
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user } = await api.post<{ user: User }>("/api/login", { email, password });
      setUser(user);

      router.push(homeFor(user.role));

      return user;
    },
    [router]
  );

  const logout = useCallback(async () => {
    await api.post("/api/logout");
    setUser(null);
    router.push("/login");
  }, [router]);

  return { user, loading, login, logout, refetch: fetchUser, ApiError };
}

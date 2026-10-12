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
      const data = await api.get<{ user: User }>("/api/me", { silent401: true });
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const login = useCallback(
    async (email: string, password: string, barangayId?: number) => {
      // Laravel decides whether this account may use this barangay (see AuthController@login).
      const { user } = await api.post<{ user: User }>("/api/login", {
        email,
        password,
        ...(barangayId ? { barangay_id: barangayId } : {}),
      });
      setUser(user);

      router.push(homeFor(user.role));

      return user;
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      if (user) {
        await api.post("/api/logout");
      }
    } catch {
      // Even if session is already expired or unreachable, clean up local state
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [user, router]);

  return { user, loading, login, logout, refetch: fetchUser, ApiError };
}

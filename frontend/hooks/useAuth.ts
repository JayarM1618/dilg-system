"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { homeFor } from "@/lib/roles";
import { saveAccount } from "@/lib/accountStorage";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>("/api/me", { silent401: true });
      if (data?.user) {
        saveAccount(data.user);
        setUser(data.user);
      } else {
        setUser(null);
      }
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
      saveAccount(user);
      setUser(user);

      router.push(homeFor(user.role));

      return user;
    },
    [router]
  );

  const logout = useCallback(async () => {
    setUser(null);
    try {
      await api.post("/api/logout", undefined, { silent401: true });
    } catch {
      // Even if session is already expired or unreachable, clean up local state
    } finally {
      router.push("/login");
    }
  }, [router]);

  return { user, loading, login, logout, refetch: fetchUser, ApiError };
}

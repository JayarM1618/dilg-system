"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { homeFor } from "@/lib/roles";
import { saveAccount } from "@/lib/accountStorage";
import type { User, VerificationInfo, SecurityInfo } from "@/types";

export interface TwoFactorChallenge {
  requires_2fa: true;
  user_id: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [verification, setVerification] = useState<VerificationInfo | null>(null);
  const [security, setSecurity] = useState<SecurityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const data = await api.get<{
        user: User;
        verification?: VerificationInfo;
        security?: SecurityInfo;
      }>("/api/me", { silent401: true });
      if (data?.user) {
        saveAccount(data.user);
        setUser(data.user);
        setVerification(data.verification ?? null);
        setSecurity(data.security ?? null);
      } else {
        setUser(null);
        setVerification(null);
        setSecurity(null);
      }
    } catch {
      setUser(null);
      setVerification(null);
      setSecurity(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  /**
   * Login step 1: submit credentials.
   * - If 2FA is enabled, returns { requires_2fa: true, user_id } (no session created yet).
   * - Otherwise logs in and redirects to the home page.
   */
  const login = useCallback(
    async (
      email: string,
      password: string,
      barangayId?: number
    ): Promise<User | TwoFactorChallenge> => {
      const payload: Record<string, unknown> = { email, password };
      if (barangayId) payload.barangay_id = barangayId;

      const data = await api.post<{ user?: User; requires_2fa?: boolean; user_id?: number }>(
        "/api/login",
        payload
      );

      // 2FA required — return the challenge so the login page shows the code form
      if (data.requires_2fa && data.user_id) {
        return { requires_2fa: true, user_id: data.user_id } as TwoFactorChallenge;
      }

      // Normal login (no 2FA)
      const loggedInUser = data.user!;
      saveAccount(loggedInUser);
      setUser(loggedInUser);

      router.push(homeFor(loggedInUser.role));
      return loggedInUser;
    },
    [router]
  );

  /**
   * Login step 2: verify TOTP code (only called when login returned requires_2fa).
   */
  const verifyTwoFactor = useCallback(
    async (userId: number, code: string) => {
      const data = await api.post<{ user: User; recovery_codes_remaining?: number }>(
        "/api/two-factor/verify",
        { user_id: userId, code }
      );

      saveAccount(data.user);
      setUser(data.user);

      router.push(homeFor(data.user.role));
      return data;
    },
    [router]
  );

  const logout = useCallback(async () => {
    setUser(null);
    setVerification(null);
    setSecurity(null);
    try {
      await api.post("/api/logout", undefined, { silent401: true });
    } catch {
      // Even if session is already expired or unreachable, clean up local state
    } finally {
      router.push("/login");
    }
  }, [router]);

  return {
    user,
    loading,
    verification,
    security,
    login,
    verifyTwoFactor,
    logout,
    refetch: fetchUser,
    ApiError,
  };
}

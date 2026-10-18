"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Old route — redirects to the new Talaghayan hub. */
export default function SuperAdminRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/talaghayan"); }, [router]);
  return null;
}

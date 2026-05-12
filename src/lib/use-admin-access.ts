"use client";

import { useCurrentAccount } from "@/lib/account-context";

export function useAdminAccess() {
  const account = useCurrentAccount();
  return account?.status === "ready" && account.profile.role === "admin";
}

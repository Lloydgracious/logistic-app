"use client";

import { createContext, useContext } from "react";

import type { CurrentAccount } from "@/lib/supabase/admin";

const AccountContext = createContext<CurrentAccount | null>(null);

export const AccountProvider = AccountContext.Provider;

export function useCurrentAccount() {
  return useContext(AccountContext);
}

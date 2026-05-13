"use client";

import { createContext, createElement, useContext, type ReactNode } from "react";

const AdminAccessContext = createContext(false);

export function AdminAccessProvider({ isAdmin, children }: { isAdmin: boolean; children: ReactNode }) {
  return createElement(AdminAccessContext.Provider, { value: isAdmin }, children);
}

export function useAdminAccess() {
  return useContext(AdminAccessContext);
}

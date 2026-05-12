"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useStore } from "@/lib/store";
import { PUBLIC_PATHS } from "@/lib/access-control";

export function StoreHydrator() {
  const loadRemoteData = useStore((state) => state.loadRemoteData);
  const pathname = usePathname();

  useEffect(() => {
    if (PUBLIC_PATHS.has(pathname)) return;
    void loadRemoteData();
  }, [loadRemoteData, pathname]);

  return null;
}

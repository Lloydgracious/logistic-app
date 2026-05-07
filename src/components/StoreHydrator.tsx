"use client";

import { useEffect } from "react";

import { useStore } from "@/lib/store";

export function StoreHydrator() {
  const loadRemoteData = useStore((state) => state.loadRemoteData);

  useEffect(() => {
    void loadRemoteData();
  }, [loadRemoteData]);

  return null;
}

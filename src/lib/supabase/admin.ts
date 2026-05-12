import type { User } from "@supabase/supabase-js";

import type { AppProfile, ModuleKey } from "@/lib/access-control";

import { createClient } from "./client";
import type { Json } from "./database.types";

export type CurrentAccount =
  | { status: "signed_out"; user: null; profile: null; enabledModules: ModuleKey[] }
  | { status: "ready"; user: User; profile: AppProfile; enabledModules: ModuleKey[] }
  | { status: "disabled"; user: User; profile: AppProfile; enabledModules: ModuleKey[] }
  | { status: "pending"; user: User; profile: null; enabledModules: ModuleKey[] };

type AccountResponse = {
  status: "signed_out" | "ready" | "disabled" | "pending";
  profile: AppProfile | null;
  enabledModules: ModuleKey[];
};

export async function getCurrentAccount(): Promise<CurrentAccount> {
  const supabase = createClient();
  if (!supabase) {
    return { status: "signed_out", user: null, profile: null, enabledModules: [] };
  }

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    return { status: "signed_out", user: null, profile: null, enabledModules: [] };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return { status: "signed_out", user: null, profile: null, enabledModules: [] };
  }

  const response = await fetch("/api/account/current", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return { status: "pending", user, profile: null, enabledModules: [] };
  }

  const account = await response.json() as AccountResponse;
  if (account.status === "signed_out") {
    return { status: "signed_out", user: null, profile: null, enabledModules: [] };
  }

  if (!account.profile) {
    return { status: "pending", user, profile: null, enabledModules: [] };
  }

  if (account.status === "disabled") {
    return { status: "disabled", user, profile: account.profile, enabledModules: account.enabledModules };
  }

  return { status: "ready", user, profile: account.profile, enabledModules: account.enabledModules };
}

export async function writeAdminAuditLog(action: string, targetType: string, targetId: string, details: Record<string, unknown> = {}) {
  const supabase = createClient();
  if (!supabase) return;

  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  await supabase.from("admin_audit_logs").insert({
    actor_id: data.user.id,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details as Json,
  });
}

export function createInviteToken() {
  const bytes = new Uint8Array(24);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

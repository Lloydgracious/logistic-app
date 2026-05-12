import type { User } from "@supabase/supabase-js";

import {
  MODULES,
  type AppProfile,
  type ModuleKey,
} from "@/lib/access-control";

import { createClient } from "./client";
import type { Json } from "./database.types";

export type CurrentAccount =
  | { status: "signed_out"; user: null; profile: null; enabledModules: ModuleKey[] }
  | { status: "ready"; user: User; profile: AppProfile; enabledModules: ModuleKey[] }
  | { status: "disabled"; user: User; profile: AppProfile; enabledModules: ModuleKey[] }
  | { status: "pending"; user: User; profile: null; enabledModules: ModuleKey[] };

const getDisplayName = (user: User) => {
  const metadata = user.user_metadata || {};
  const fullName = [metadata.first_name, metadata.last_name].filter(Boolean).join(" ").trim();
  return fullName || user.email?.split("@")[0] || "Team Member";
};

async function fetchProfile(userId: string) {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return data as AppProfile | null;
}

async function createBootstrapAdmin(user: User) {
  const supabase = createClient();
  if (!supabase || !user.email) return null;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name: getDisplayName(user),
      role: "admin",
      status: "active",
    })
    .select("*")
    .maybeSingle();

  if (error) return null;
  return data as AppProfile | null;
}

async function promoteBootstrapAdmin(profile: AppProfile) {
  const supabase = createClient();
  if (!supabase || profile.role === "admin") return profile;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      role: "admin",
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)
    .select("*")
    .maybeSingle();

  if (error) return profile;
  return data as AppProfile | null;
}

async function createInvitedStaffProfile(user: User) {
  const supabase = createClient();
  if (!supabase || !user.email) return null;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name: getDisplayName(user),
      role: "staff",
      status: "active",
    })
    .select("*")
    .maybeSingle();

  if (error) return null;

  await supabase
    .from("staff_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("email", user.email.toLowerCase())
    .eq("status", "pending");

  return data as AppProfile | null;
}

async function fetchEnabledModules(profile: AppProfile) {
  if (profile.role === "admin") return MODULES.map((module) => module.key);

  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_module_access")
    .select("module_key, enabled")
    .eq("user_id", profile.id)
    .eq("enabled", true);

  if (error) return [];
  return (data || [])
    .map((row) => row.module_key)
    .filter((moduleKey): moduleKey is ModuleKey => MODULES.some((module) => module.key === moduleKey));
}

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

  let profile = await fetchProfile(user.id);

  if (!profile) {
    profile = await createBootstrapAdmin(user);
  }

  if (!profile) {
    profile = await createInvitedStaffProfile(user);
  }

  if (profile && profile.role !== "admin") {
    profile = await promoteBootstrapAdmin(profile);
  }

  if (!profile) {
    return { status: "pending", user, profile: null, enabledModules: [] };
  }

  const enabledModules = await fetchEnabledModules(profile);

  if (profile.status === "disabled") {
    return { status: "disabled", user, profile, enabledModules };
  }

  return { status: "ready", user, profile, enabledModules };
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

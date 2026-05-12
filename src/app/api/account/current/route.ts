import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

import { MODULES, type AppProfile, type AppRole, type ModuleKey } from "@/lib/access-control";
import { createAdminClient } from "@/lib/supabase/server-admin";

const validRoles = new Set<AppRole>(["admin", "staff"]);
const validModules = new Set<ModuleKey>(MODULES.map((module) => module.key));

const getDisplayName = (user: User) => {
  const metadata = user.user_metadata || {};
  const fullName = String(metadata.full_name || "").trim();
  if (fullName) return fullName;

  return [metadata.first_name, metadata.last_name].filter(Boolean).join(" ").trim()
    || user.email?.split("@")[0]
    || "Team Member";
};

async function createProfileFromAuthUser(user: User) {
  const supabase = createAdminClient();
  if (!supabase || !user.email) return null;

  const metadata = user.user_metadata || {};
  const role = validRoles.has(metadata.app_role) ? metadata.app_role : "staff";
  const enabledModules = Array.isArray(metadata.enabled_modules)
    ? metadata.enabled_modules.filter((module): module is ModuleKey => validModules.has(module))
    : [];

  if (!metadata.app_created) return null;

  const { data: emailProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (emailProfile?.id && emailProfile.id !== user.id) {
    await supabase.from("profiles").delete().eq("id", emailProfile.id);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email.toLowerCase(),
      full_name: getDisplayName(user),
      role,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .maybeSingle();

  if (profileError || !profile) return null;

  await supabase.from("user_module_access").delete().eq("user_id", user.id);

  if (role === "staff" && enabledModules.length > 0) {
    await supabase.from("user_module_access").upsert(
      enabledModules.map((moduleKey) => ({
        user_id: user.id,
        module_key: moduleKey,
        enabled: true,
      }))
    );
  }

  return profile as AppProfile;
}

async function fetchEnabledModules(profile: AppProfile) {
  if (profile.role === "admin") return MODULES.map((module) => module.key);

  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_module_access")
    .select("module_key, enabled")
    .eq("user_id", profile.id)
    .eq("enabled", true);

  if (error) return [];
  return (data || [])
    .map((row) => row.module_key)
    .filter((moduleKey): moduleKey is ModuleKey => validModules.has(moduleKey as ModuleKey));
}

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ message: "Missing server Supabase configuration." }, { status: 500 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json({ status: "signed_out", profile: null, enabledModules: [] });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ status: "signed_out", profile: null, enabledModules: [] });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let profile = !error && data ? data as AppProfile : null;
  if (!profile) {
    profile = await createProfileFromAuthUser(user);
  }

  if (!profile) {
    return NextResponse.json({ status: "pending", profile: null, enabledModules: [] });
  }

  const enabledModules = await fetchEnabledModules(profile);
  return NextResponse.json({
    status: profile.status === "disabled" ? "disabled" : "ready",
    profile,
    enabledModules,
  });
}

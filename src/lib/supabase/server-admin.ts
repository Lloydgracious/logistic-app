import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import type { AppProfile } from "@/lib/access-control";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseAdminConfigured() {
  return Boolean(supabaseUrl && serviceRoleKey);
}

export function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getActiveAdminProfile(request: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) {
    const missing = [
      !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
      !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean).join(" and ");

    return {
      supabase: null,
      profile: null,
      error: `Missing ${missing}. Add it to your environment variables and restart the app.`,
    };
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { supabase, profile: null, error: "Missing admin session." };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData.user;
  if (userError || !user) {
    return { supabase, profile: null, error: "Invalid admin session." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const adminProfile = profile as AppProfile | null;
  if (profileError || adminProfile?.role !== "admin" || adminProfile.status !== "active") {
    return { supabase, profile: null, error: "Only active admins can manage accounts." };
  }

  return { supabase, profile: adminProfile, error: null };
}

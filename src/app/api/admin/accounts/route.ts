import { NextResponse, type NextRequest } from "next/server";

import { MODULES, type AppRole, type ModuleKey } from "@/lib/access-control";
import { getActiveAdminProfile } from "@/lib/supabase/server-admin";
import type { Json } from "@/lib/supabase/database.types";

const validRoles = new Set<AppRole>(["admin", "staff"]);
const validModules = new Set<ModuleKey>(MODULES.map((module) => module.key));

type CreateAccountBody = {
  email?: string;
  password?: string;
  fullName?: string;
  role?: AppRole;
  enabledModules?: ModuleKey[];
};

async function findAuthUserIdByEmail(
  supabase: NonNullable<Awaited<ReturnType<typeof getActiveAdminProfile>>["supabase"]>,
  email: string
) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return null;

    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 100) return null;
  }

  return null;
}

export async function POST(request: NextRequest) {
  const { supabase, profile: adminProfile, error } = await getActiveAdminProfile(request);
  if (!supabase) {
    return NextResponse.json({ message: error }, { status: 500 });
  }
  if (!adminProfile) {
    return NextResponse.json({ message: error }, { status: 403 });
  }

  const body = (await request.json()) as CreateAccountBody;
  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password || "";
  const fullName = body.fullName?.trim() || null;
  const role = body.role && validRoles.has(body.role) ? body.role : "staff";
  const enabledModules = (body.enabledModules || []).filter((module): module is ModuleKey => validModules.has(module));

  if (!email || !email.includes("@")) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 });
  }

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      app_created: true,
      app_role: role,
      enabled_modules: enabledModules,
    },
  });

  const existingUserId = createError ? await findAuthUserIdByEmail(supabase, email) : null;
  const userId = createdUser.user?.id || existingUserId;

  if (!userId) {
    return NextResponse.json({ message: createError?.message || "Could not create auth user." }, { status: 400 });
  }

  if (existingUserId) {
    const { error: passwordError } = await supabase.auth.admin.updateUserById(existingUserId, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        app_created: true,
        app_role: role,
        enabled_modules: enabledModules,
      },
    });

    if (passwordError) {
      return NextResponse.json({ message: passwordError.message }, { status: 400 });
    }
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName,
    role,
    status: "active",
  });

  if (profileError) {
    if (!existingUserId) await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json({ message: profileError.message }, { status: 400 });
  }

  await supabase.from("user_module_access").delete().eq("user_id", userId);

  if (role === "staff" && enabledModules.length > 0) {
    const { error: moduleError } = await supabase.from("user_module_access").upsert(
      enabledModules.map((moduleKey) => ({
        user_id: userId,
        module_key: moduleKey,
        enabled: true,
      }))
    );

    if (moduleError) {
      if (!existingUserId) await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ message: moduleError.message }, { status: 400 });
    }
  }

  await supabase.from("admin_audit_logs").insert({
    actor_id: adminProfile.id,
    action: existingUserId ? "account_profile_created" : "account_created",
    target_type: "profile",
    target_id: userId,
    details: { email, role, enabledModules } as Json,
  });

  return NextResponse.json({ userId, repaired: Boolean(existingUserId) });
}

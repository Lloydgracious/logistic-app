import { NextResponse, type NextRequest } from "next/server";

import { getActiveAdminProfile } from "@/lib/supabase/server-admin";
import type { Json } from "@/lib/supabase/database.types";

type RouteContext = {
  params: {
    userId: string;
  };
};

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { supabase, profile: adminProfile, error } = await getActiveAdminProfile(request);
  if (!supabase) {
    return NextResponse.json({ message: error }, { status: 500 });
  }
  if (!adminProfile) {
    return NextResponse.json({ message: error }, { status: 403 });
  }

  const userId = params.userId;
  if (userId === adminProfile.id) {
    return NextResponse.json({ message: "You cannot delete your own admin account." }, { status: 400 });
  }

  const { data: targetProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,role,status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !targetProfile) {
    return NextResponse.json({ message: "Account not found." }, { status: 404 });
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json({ message: deleteError.message }, { status: 400 });
  }

  await supabase.from("admin_audit_logs").insert({
    actor_id: adminProfile.id,
    action: "account_deleted",
    target_type: "profile",
    target_id: userId,
    details: targetProfile as Json,
  });

  return NextResponse.json({ ok: true });
}

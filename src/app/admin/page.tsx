"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Copy,
  Mail,
  Power,
  Search,
  ShieldCheck,
  ToggleLeft,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { MODULES, type AppProfile, type AppRole, type ModuleKey } from "@/lib/access-control";
import { createInviteToken, writeAdminAuditLog } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";

type Invite = {
  id: string;
  email: string;
  token: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
};

type ModuleAccessRow = {
  user_id: string;
  module_key: ModuleKey;
  enabled: boolean;
};

type AuditLog = {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

const buildInviteUrl = (token: string) => {
  if (typeof window === "undefined") return `/register?invite=${token}`;
  return `${window.location.origin}/register?invite=${token}`;
};

export default function AdminPage() {
  const [profiles, setProfiles] = useState<AppProfile[]>([]);
  const [accessRows, setAccessRows] = useState<ModuleAccessRow[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadAdminData = async () => {
    const supabase = createClient();
    if (!supabase) return;

    setIsLoading(true);
    const [profilesResult, accessResult, invitesResult, auditResult] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_module_access").select("*"),
      supabase.from("staff_invites").select("id,email,token,status,expires_at,created_at").order("created_at", { ascending: false }),
      supabase.from("admin_audit_logs").select("id,action,target_type,target_id,details,created_at").order("created_at", { ascending: false }).limit(12),
    ]);

    setIsLoading(false);
    if (profilesResult.error || accessResult.error || invitesResult.error || auditResult.error) {
      setError("Could not load admin data. Check Supabase schema and RLS policies.");
      return;
    }

    setProfiles((profilesResult.data || []) as AppProfile[]);
    setAccessRows((accessResult.data || []) as ModuleAccessRow[]);
    setInvites((invitesResult.data || []) as Invite[]);
    setAuditLogs((auditResult.data || []) as AuditLog[]);
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const filteredProfiles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return profiles;
    return profiles.filter((profile) =>
      profile.email.toLowerCase().includes(query) ||
      (profile.full_name || "").toLowerCase().includes(query) ||
      profile.role.toLowerCase().includes(query)
    );
  }, [profiles, searchTerm]);

  const getModuleEnabled = (userId: string, moduleKey: ModuleKey) => {
    const profile = profiles.find((item) => item.id === userId);
    if (profile?.role === "admin") return true;
    return accessRows.some((row) => row.user_id === userId && row.module_key === moduleKey && row.enabled);
  };

  const handleCreateInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    const supabase = createClient();
    if (!supabase) return;

    setError("");
    setNotice("");
    const token = createInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase.from("staff_invites").insert({
      email,
      token,
      status: "pending",
      expires_at: expiresAt,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    await writeAdminAuditLog("invite_created", "staff_invite", email, { email });
    setInviteEmail("");
    setNotice(`Invite created for ${email}. Share the invite link from Pending Invites.`);
    await loadAdminData();
  };

  const handleToggleModule = async (profile: AppProfile, moduleKey: ModuleKey) => {
    if (profile.role === "admin") return;

    const supabase = createClient();
    if (!supabase) return;

    const nextEnabled = !getModuleEnabled(profile.id, moduleKey);
    const { error: upsertError } = await supabase.from("user_module_access").upsert({
      user_id: profile.id,
      module_key: moduleKey,
      enabled: nextEnabled,
    });

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    await writeAdminAuditLog("module_access_changed", "profile", profile.id, {
      email: profile.email,
      module: moduleKey,
      enabled: nextEnabled,
    });
    await loadAdminData();
  };

  const handleStatusChange = async (profile: AppProfile) => {
    const supabase = createClient();
    if (!supabase) return;

    const nextStatus = profile.status === "active" ? "disabled" : "active";
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await writeAdminAuditLog("account_status_changed", "profile", profile.id, {
      email: profile.email,
      status: nextStatus,
    });
    await loadAdminData();
  };

  const handleRoleChange = async (profile: AppProfile, role: AppRole) => {
    const supabase = createClient();
    if (!supabase || role === profile.role) return;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await writeAdminAuditLog("role_changed", "profile", profile.id, { email: profile.email, role });
    await loadAdminData();
  };

  const handleCopyInvite = async (token: string) => {
    await navigator.clipboard.writeText(buildInviteUrl(token));
    setNotice("Invite link copied.");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Control Center
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white outfit">
            Staff <span className="text-cyan-500">Access</span>
          </h1>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Invite accounts, enable modules, and audit operational access.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
          <div className="saas-card p-4 rounded-none border-l-4 border-l-cyan-500">
            <p className="text-2xl font-black outfit text-slate-900 dark:text-white">{profiles.length}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Accounts</p>
          </div>
          <div className="saas-card p-4 rounded-none border-l-4 border-l-rose-500">
            <p className="text-2xl font-black outfit text-slate-900 dark:text-white">{profiles.filter((profile) => profile.role === "admin").length}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Admins</p>
          </div>
          <div className="saas-card p-4 rounded-none border-l-4 border-l-amber-500">
            <p className="text-2xl font-black outfit text-slate-900 dark:text-white">{invites.filter((invite) => invite.status === "pending").length}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Invites</p>
          </div>
        </div>
      </div>

      {(notice || error) && (
        <div className={`border px-4 py-3 text-xs font-black uppercase tracking-wider ${error ? "border-rose-200 bg-rose-50 text-rose-600" : "border-emerald-200 bg-emerald-50 text-emerald-600"}`}>
          {error || notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <section className="saas-card p-6 rounded-none border-t-4 border-t-cyan-500">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Invite Staff</h2>
              <UserPlus className="h-5 w-5 text-cyan-600" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="staff@company.com"
                  className="w-full border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-black dark:text-white"
                />
              </div>
              <button
                onClick={handleCreateInvite}
                className="w-full bg-slate-950 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-cyan-600 dark:bg-white dark:text-black dark:hover:bg-cyan-500 dark:hover:text-white"
              >
                Create Invite
              </button>
            </div>
          </section>

          <section className="saas-card p-6 rounded-none">
            <h2 className="mb-5 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Pending Invites</h2>
            <div className="space-y-3">
              {invites.slice(0, 8).map((invite) => (
                <div key={invite.id} className="border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black uppercase text-slate-800 dark:text-white">{invite.email}</p>
                      <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">{invite.status}</p>
                    </div>
                    {invite.status === "pending" && (
                      <button
                        onClick={() => handleCopyInvite(invite.token)}
                        className="p-2 text-slate-400 transition hover:text-cyan-600"
                        aria-label="Copy invite link"
                        title="Copy invite link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {invites.length === 0 && (
                <p className="py-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">No invites yet.</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="saas-card rounded-none overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-rose-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Accounts And Modules</h2>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search accounts..."
                  className="w-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-rose-500 dark:border-slate-800 dark:bg-black dark:text-white"
                />
              </div>
            </div>

            {isLoading ? (
              <p className="p-10 text-center text-xs font-black uppercase tracking-widest text-slate-400">Loading admin data...</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProfiles.map((profile) => (
                  <motion.div key={profile.id} layout className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white outfit">{profile.full_name || profile.email}</h3>
                          <span className={`border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${profile.role === "admin" ? "border-cyan-200 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                            {profile.role}
                          </span>
                          <span className={`border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${profile.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                            {profile.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-slate-400">{profile.email}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <select
                          value={profile.role}
                          onChange={(event) => handleRoleChange(profile, event.target.value as AppRole)}
                          className="border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none dark:border-slate-800 dark:bg-black dark:text-white"
                        >
                          <option value="admin">Admin</option>
                          <option value="staff">Staff</option>
                        </select>
                        <button
                          onClick={() => handleStatusChange(profile)}
                          className="inline-flex items-center gap-2 border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-800 dark:text-zinc-300"
                        >
                          <Power className="h-3.5 w-3.5" />
                          {profile.status === "active" ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                      {MODULES.map((module) => {
                        const isEnabled = getModuleEnabled(profile.id, module.key);
                        const Icon = module.icon;
                        return (
                          <button
                            key={module.key}
                            onClick={() => handleToggleModule(profile, module.key)}
                            disabled={profile.role === "admin"}
                            className={`flex items-center justify-between gap-3 border px-3 py-3 text-left transition disabled:cursor-not-allowed ${isEnabled ? "border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-900/50 dark:bg-cyan-950/20 dark:text-cyan-300" : "border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-black dark:text-zinc-500"}`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="truncate text-[10px] font-black uppercase tracking-widest">{module.label}</span>
                            </span>
                            <ToggleLeft className={`h-4 w-4 shrink-0 ${isEnabled ? "text-cyan-600" : "text-slate-300"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <section className="saas-card p-6 rounded-none">
            <div className="mb-5 flex items-center gap-3">
              <Activity className="h-5 w-5 text-cyan-600" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Admin Activity</h2>
            </div>
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-white">{log.action.replace(/_/g, " ")}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{log.target_type} / {log.target_id}</p>
                  </div>
                  <p className="shrink-0 text-[10px] font-bold text-slate-400">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="py-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">No admin actions yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

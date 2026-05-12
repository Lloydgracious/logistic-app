"use client";

import { ArrowLeft, CheckCircle2, Clock, Lock, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { MODULES } from "@/lib/access-control";
import { useCurrentAccount } from "@/lib/account-context";

export default function ProfilePage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const profile = account?.status === "ready" || account?.status === "disabled" ? account.profile : null;
  const enabledModules = account?.status === "ready" || account?.status === "disabled" ? account.enabledModules : [];
  const isAdmin = profile?.role === "admin";

  return (
    <div className="mx-auto max-w-4xl w-full pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <section className="saas-card overflow-hidden rounded-none border-l-4 border-l-cyan-500">
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-300">
            {enabledModules.length > 0 || isAdmin ? <ShieldCheck className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white outfit">
            {enabledModules.length > 0 || isAdmin ? "Account Access" : "Waiting For Access"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500 dark:text-zinc-400">
            {isAdmin
              ? "This admin account has full access to every module."
              : enabledModules.length > 0
                ? "These are the pages your admin has enabled for your account."
                : "Your account is active, but an admin has not enabled any pages yet. Ask an admin to turn on the modules you need."}
          </p>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="border border-slate-200 p-4 dark:border-slate-800">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Signed In As</p>
            <div className="flex items-center gap-3 text-sm font-black text-slate-800 dark:text-white">
              <Mail className="h-4 w-4 text-cyan-600" />
              {profile?.email || "Loading account..."}
            </div>
          </div>

          <div className="border border-slate-200 p-4 dark:border-slate-800">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Account Type</p>
            <div className="flex items-center gap-2">
              <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:border-slate-800 dark:bg-black dark:text-zinc-300">
                {profile?.role || "staff"}
              </span>
              <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                {profile?.status || "active"}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 p-6 dark:border-slate-800">
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Page Access</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODULES.map((module) => {
              const enabled = isAdmin || enabledModules.includes(module.key);
              const Icon = module.icon;

              return (
                <div key={module.key} className={`flex items-center justify-between border p-3 ${enabled ? "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-300" : "border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-black dark:text-zinc-600"}`}>
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{module.label}</span>
                  </span>
                  {enabled ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

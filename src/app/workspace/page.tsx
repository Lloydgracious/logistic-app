"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { getAllowedModules, type AppProfile, type ModuleKey } from "@/lib/access-control";
import { getCurrentAccount } from "@/lib/supabase/admin";

type WorkspaceAccount = {
  profile: AppProfile;
  enabledModules: ModuleKey[];
};

export default function WorkspacePage() {
  const [account, setAccount] = useState<WorkspaceAccount | null>(null);

  useEffect(() => {
    const loadAccount = async () => {
      const current = await getCurrentAccount();
      if (current.status === "ready" || current.status === "disabled") {
        setAccount({
          profile: current.profile,
          enabledModules: current.enabledModules,
        });
      }
    };

    void loadAccount();
  }, []);

  const modules = account ? getAllowedModules(account.profile.role, account.enabledModules) : [];
  const displayName = account?.profile.full_name || account?.profile.email?.split("@")[0] || "Team Member";

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col justify-center pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="mb-6 inline-flex bg-white border border-slate-200 px-4 py-3 shadow-xl">
          <Image src="/kt-logistic-logo.jpg" alt="KT Logistic & Trading" width={842} height={595} className="h-24 w-auto max-w-full object-contain" priority />
        </div>
        <div className="mb-3 inline-flex items-center gap-2 border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Staff Access
        </div>
        <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white outfit">
          Welcome, <span className="text-rose-600">{displayName}</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm font-black uppercase tracking-[0.2em] text-slate-400">
          Your available pages are controlled by admin access.
        </p>
      </div>

      {modules.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.key}
                href={module.href}
                className="group border-2 border-slate-200 bg-white p-6 shadow-xl transition-all hover:-translate-y-1 hover:border-rose-300 dark:border-slate-800 dark:bg-black"
              >
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center border border-slate-200 bg-slate-50 text-slate-900 transition group-hover:border-rose-200 group-hover:bg-rose-50 group-hover:text-rose-600 dark:border-slate-800 dark:bg-zinc-900 dark:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-rose-500" />
                </div>
                <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-900 outfit dark:text-white">
                  {module.label}
                </h2>
                <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Open assigned page
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="border-2 border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-black">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            No pages are enabled for this account yet.
          </p>
        </div>
      )}
    </div>
  );
}

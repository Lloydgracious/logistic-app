"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  PUBLIC_PATHS,
  canAccessModule,
  getDefaultLanding,
  getModuleForPath,
} from "@/lib/access-control";
import { getCurrentAccount, type CurrentAccount } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";
import { AdminAccessProvider } from "@/lib/use-admin-access";

function GateMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="saas-card max-w-md w-full p-8 rounded-none border-l-4 border-l-rose-500 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center border border-rose-200 bg-rose-50 text-rose-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-3 text-sm font-bold leading-6 text-slate-500 dark:text-zinc-400">{message}</p>
      </div>
    </div>
  );
}

function GateLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="flex items-center gap-3 text-slate-500">
        <ShieldCheck className="h-5 w-5 animate-pulse text-cyan-600" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Checking access</span>
      </div>
    </div>
  );
}

export function AccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [account, setAccount] = useState<CurrentAccount | null>(null);
  const isPublicPath = useMemo(() => PUBLIC_PATHS.has(pathname), [pathname]);

  useEffect(() => {
    let isMounted = true;

    const loadAccount = async () => {
      const nextAccount = await getCurrentAccount();
      if (isMounted) setAccount(nextAccount);
    };

    void loadAccount();

    const supabase = createClient();
    if (!supabase) return () => {
      isMounted = false;
    };

    const { data } = supabase.auth.onAuthStateChange(() => {
      void loadAccount();
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [pathname]);

  useEffect(() => {
    if (!account) return;

    if (isPublicPath) {
      return;
    }

    if (account.status === "signed_out") {
      router.replace("/login");
      return;
    }

    if (account.status !== "ready") return;

    const moduleKey = getModuleForPath(pathname);
    if (!canAccessModule(account.profile.role, account.enabledModules, moduleKey)) {
      router.replace(getDefaultLanding(account.profile.role, account.enabledModules));
    }
  }, [account, isPublicPath, pathname, router]);

  if (isPublicPath) return <AdminAccessProvider isAdmin={false}>{children}</AdminAccessProvider>;
  if (!account) return <GateLoading />;
  if (account.status === "signed_out") return <GateLoading />;
  if (account.status === "disabled") {
    return <GateMessage title="Account Disabled" message="This account is disabled. Ask an admin to reactivate access." />;
  }
  if (account.status === "pending") {
    return <GateMessage title="Account Pending" message="This login is not connected to an active account yet. Ask an admin to create or repair this account." />;
  }

  const moduleKey = getModuleForPath(pathname);
  if (!canAccessModule(account.profile.role, account.enabledModules, moduleKey)) {
    return <GateLoading />;
  }

  return (
    <AdminAccessProvider isAdmin={account.profile.role === "admin"}>
      {children}
    </AdminAccessProvider>
  );
}

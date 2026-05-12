"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";

import { getDefaultLanding } from "@/lib/access-control";
import { getCurrentAccount } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";

type InviteState = "checking" | "ready" | "error";

export default function InvitePage() {
  const router = useRouter();
  const [state, setState] = useState<InviteState>("checking");
  const [message, setMessage] = useState("Checking your invite link...");

  useEffect(() => {
    const acceptInvite = async () => {
      const supabase = createClient();
      if (!supabase) {
        setState("error");
        setMessage("Supabase is not configured yet.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const inviteToken = params.get("token") || "";
      const authCode = params.get("code");

      if (!inviteToken) {
        setState("error");
        setMessage("This invite link is missing its invite token.");
        return;
      }

      if (authCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(authCode);
        if (error) {
          setState("error");
          setMessage(error.message);
          return;
        }
      } else {
        await supabase.auth.getSession();
      }

      const account = await getCurrentAccount(inviteToken);
      if (account.status === "signed_out") {
        setState("error");
        setMessage("Open the latest invite email link to sign in automatically.");
        return;
      }

      if (account.status === "pending") {
        setState("error");
        setMessage("This invite is expired, deleted, or does not match your email.");
        return;
      }

      setState("ready");
      setMessage("Invite accepted. Opening your access page...");
      await useStore.getState().loadRemoteData();
      router.replace(getDefaultLanding(account.profile.role, account.enabledModules));
      router.refresh();
    };

    void acceptInvite();
  }, [router]);

  const Icon = state === "error" ? MailWarning : state === "ready" ? CheckCircle2 : Loader2;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 -mt-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/40 blur-3xl -z-10" />

      <div className="saas-card w-full max-w-md p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 inline-flex bg-white border border-slate-200 px-3 py-2 shadow-sm">
          <Image src="/kt-logistic-logo.jpg" alt="KT Logistic & Trading" width={842} height={595} className="h-24 w-auto object-contain" priority />
        </div>

        <div className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center border ${state === "error" ? "border-rose-200 bg-rose-50 text-rose-600" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}>
          <Icon className={`h-6 w-6 ${state === "checking" ? "animate-spin" : ""}`} />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900 outfit">
          {state === "error" ? "Invite Not Available" : "Staff Invite"}
        </h1>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{message}</p>
      </div>
    </div>
  );
}

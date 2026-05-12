"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Lock, Mail, MailWarning, User } from "lucide-react";

import { getDefaultLanding } from "@/lib/access-control";
import { getCurrentAccount } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";

type InviteState = "checking" | "setup" | "ready" | "error";

export default function InvitePage() {
  const router = useRouter();
  const [state, setState] = useState<InviteState>("checking");
  const [message, setMessage] = useState("Checking your invite link...");
  const [inviteToken, setInviteToken] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const prepareInvite = async () => {
      const supabase = createClient();
      if (!supabase) {
        setState("error");
        setMessage("Supabase is not configured yet.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const token = params.get("token") || "";
      const authCode = params.get("code");

      if (!token) {
        setState("error");
        setMessage("This invite link is missing its invite token.");
        return;
      }

      setInviteToken(token);

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

      const { data: userResult } = await supabase.auth.getUser();
      const user = userResult.user;
      if (!user?.email) {
        setState("error");
        setMessage("Open the latest invite email link to verify your email.");
        return;
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (existingProfile) {
        const existingAccount = await getCurrentAccount();
        if (existingAccount.status === "ready" || existingAccount.status === "disabled") {
          await useStore.getState().loadRemoteData();
          router.replace(getDefaultLanding(existingAccount.profile.role, existingAccount.enabledModules));
          router.refresh();
        } else {
          setState("error");
          setMessage("This account exists but could not be loaded. Please sign in again.");
        }
        return;
      }

      const { data: invite, error: inviteError } = await supabase
        .from("staff_invites")
        .select("id,email,status,expires_at")
        .eq("token", token)
        .eq("email", user.email.toLowerCase())
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (inviteError || !invite) {
        setState("error");
        setMessage("This invite is expired, deleted, or does not match your email.");
        return;
      }

      const metadata = user.user_metadata || {};
      const suggestedName = [metadata.first_name, metadata.last_name].filter(Boolean).join(" ").trim();
      setEmail(user.email);
      setFullName(String(metadata.full_name || suggestedName || ""));
      setState("setup");
      setMessage("Create your account password to finish setup.");
    };

    void prepareInvite();
  }, [router]);

  const handleSetup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setFormError("Enter your name.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setFormError("Supabase is not configured yet.");
      return;
    }

    setState("checking");
    setMessage("Saving your account setup...");

    const nameParts = trimmedName.split(/\s+/);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        full_name: trimmedName,
        first_name: nameParts[0] || trimmedName,
        last_name: nameParts.slice(1).join(" "),
        invite_token: inviteToken,
      },
    });

    if (updateError) {
      setState("setup");
      setFormError(updateError.message);
      return;
    }

    const account = await getCurrentAccount(inviteToken);
    if (account.status !== "ready") {
      setState("setup");
      setFormError("Account setup saved, but access could not be activated. Ask an admin to check this invite.");
      return;
    }

    setState("ready");
    setMessage("Account ready. Opening your dashboard...");
    await useStore.getState().loadRemoteData();
    router.replace(getDefaultLanding(account.profile.role, account.enabledModules));
    router.refresh();
  };

  const StatusIcon = state === "error" ? MailWarning : state === "ready" ? CheckCircle2 : Loader2;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 -mt-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/40 blur-3xl -z-10" />

      <div className="saas-card w-full max-w-md p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 inline-flex bg-white border border-slate-200 px-3 py-2 shadow-sm">
            <Image src="/kt-logistic-logo.jpg" alt="KT Logistic & Trading" width={842} height={595} className="h-24 w-auto object-contain" priority />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 outfit">
            {state === "setup" ? "Set Up Account" : state === "error" ? "Invite Not Available" : "Staff Invite"}
          </h1>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{message}</p>
        </div>

        {state === "setup" ? (
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="invite-email">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="invite-email"
                  value={email}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="full-name">Name</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-800 placeholder-slate-400 font-medium"
                  placeholder="Your name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-800 placeholder-slate-400 font-medium"
                  placeholder="Password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="confirm-password">Confirm Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-800 placeholder-slate-400 font-medium"
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>

            {formError && (
              <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-rose-600">
                {formError}
              </div>
            )}

            <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:bg-primaryHover transition-all flex items-center justify-center gap-2">
              Finish Setup <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center border ${state === "error" ? "border-rose-200 bg-rose-50 text-rose-600" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}>
              <StatusIcon className={`h-6 w-6 ${state === "checking" ? "animate-spin" : ""}`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

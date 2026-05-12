"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getCurrentAccount } from "@/lib/supabase/admin";
import { getDefaultLanding } from "@/lib/access-control";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setIsLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setFormError("Add your Supabase URL and publishable key in .env.local first.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setIsLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    const account = await getCurrentAccount();
    if (account.status === "disabled") {
      setFormError("This account is disabled. Ask an admin to reactivate it.");
      return;
    }
    if (account.status === "pending" || account.status === "signed_out") {
      setFormError("This login is not connected to an active staff invite yet.");
      return;
    }

    await useStore.getState().loadRemoteData();
    router.push(getDefaultLanding(account.profile.role, account.enabledModules));
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 -mt-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl -z-10"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="saas-card p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="mx-auto mb-5 inline-flex bg-white border border-slate-200 px-3 py-2 shadow-sm">
              <Image src="/kt-logistic-logo.jpg" alt="KT Logistic & Trading" width={842} height={595} className="h-24 w-auto object-contain" priority />
            </div>
            <h1 className="text-2xl font-black text-slate-900 outfit tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm mt-1 font-medium">Enter your credentials to access KT Logistic & Trading</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200" htmlFor="password">Password</label>
                <Link href="#" className="text-xs font-bold text-primary hover:text-primaryHover transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input 
                  type="password" 
                  id="password"
                  name="password"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {formError && (
              <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-rose-600">
                {formError}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:bg-primaryHover transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
              {isLoading ? "Signing In..." : "Sign In"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">
            Accounts are created by an admin. Use the email and password assigned to you.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

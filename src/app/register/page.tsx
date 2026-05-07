"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, User, Building } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";

const SIGNUP_EMAIL_COOLDOWN_MS = 60 * 1000;

const getSignupCooldownKey = (email: string) =>
  `garageflow-signup-email-sent-at:${email.trim().toLowerCase()}`;

const getRemainingSignupCooldownSeconds = (email: string) => {
  if (typeof window === "undefined") return 0;

  const sentAt = Number(window.localStorage.getItem(getSignupCooldownKey(email)) || 0);
  const remainingMs = SIGNUP_EMAIL_COOLDOWN_MS - (Date.now() - sentAt);
  return Math.max(0, Math.ceil(remainingMs / 1000));
};

const markSignupEmailSent = (email: string) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(getSignupCooldownKey(email), String(Date.now()));
};

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setNotice("");

    const formData = new FormData(e.currentTarget);
    const firstName = String(formData.get("firstName") || "");
    const lastName = String(formData.get("lastName") || "");
    const company = String(formData.get("company") || "");
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const cooldownSeconds = getRemainingSignupCooldownSeconds(email);

    if (cooldownSeconds > 0) {
      setNotice(`A confirmation email was just sent. Please wait ${cooldownSeconds} seconds before trying again.`);
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setFormError("Add your Supabase URL and publishable key in .env.local first.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          company,
        },
      },
    });

    setIsLoading(false);

    if (error) {
      const isEmailRateLimit = error.message.toLowerCase().includes("email") && error.message.toLowerCase().includes("rate");
      if (isEmailRateLimit) {
        markSignupEmailSent(email);
        setFormError("Supabase is cooling down confirmation emails. Please wait about a minute before trying again.");
        return;
      }

      setFormError(error.message);
      return;
    }

    if (!data.session) {
      markSignupEmailSent(email);
      setNotice("Account created. Check your email to confirm your login.");
      return;
    }

    await useStore.getState().loadRemoteData();
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 -mt-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-100/40 rounded-full blur-3xl -z-10"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="saas-card p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-900 outfit tracking-tight">Create an Account</h1>
            <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm mt-1 font-medium">Join GarageFlow and organize your fleet.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="firstName">First Name</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input 
                    type="text" 
                    id="firstName"
                    name="firstName"
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium"
                    placeholder="John"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="lastName">Last Name</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input 
                    type="text" 
                    id="lastName"
                    name="lastName"
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="company">Company Name</label>
              <div className="relative">
                <Building className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input 
                  type="text" 
                  id="company"
                  name="company"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium"
                  placeholder="Logistics Inc."
                  required
                />
              </div>
            </div>

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
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="password">Password</label>
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

            {notice && (
              <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-emerald-600">
                {notice}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:bg-primaryHover transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60">
              {isLoading ? "Creating..." : "Create Account"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">
            Already have an account? <Link href="/login" className="font-bold text-primary hover:text-primaryHover transition-colors">Sign in here</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

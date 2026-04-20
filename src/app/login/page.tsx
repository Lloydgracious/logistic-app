"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    router.push('/dashboard');
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
            <div className="w-12 h-12 rounded-xl bg-primary mx-auto flex items-center justify-center shadow-md mb-4">
               <span className="font-black text-white text-3xl">G</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 outfit tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm mt-1 font-medium">Enter your credentials to access GarageFlow</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input 
                  type="email" 
                  id="email"
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
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:bg-primaryHover transition-all flex items-center justify-center gap-2 mt-2">
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">
            Don&apos;t have an account? <Link href="/register" className="font-bold text-primary hover:text-primaryHover transition-colors">Create one here</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

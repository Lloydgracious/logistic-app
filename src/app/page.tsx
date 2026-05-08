"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="h-screen bg-white dark:bg-[#050505] relative overflow-hidden flex items-center justify-center font-inter selection:bg-rose-100 selection:text-rose-900">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.07] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-gradient-to-bl from-rose-500/10 via-transparent to-transparent blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-gradient-to-tr from-cyan-500/10 via-transparent to-transparent blur-[120px]"></div>

      <div className="max-w-4xl w-full px-8 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center"
        >
          {/* Logo Brand */}
          <div className="bg-white border border-slate-200 px-4 py-3 shadow-xl mb-12">
            <Image src="/kay-thi-logo.png" alt="Kay Thi (Myawady)" width={455} height={205} className="h-24 md:h-28 w-auto max-w-full object-contain" priority />
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-slate-900 dark:text-white leading-[0.85] outfit tracking-tighter mb-8 uppercase">
             Transport <br/> 
            <span className="text-rose-600 italic">Tracking.</span>
          </h1>

          <p className="text-base md:text-xl text-slate-500 dark:text-zinc-500 font-bold leading-tight tracking-tight uppercase max-w-xl mb-12">
            The simple way to manage your trucks and orders. <br className="hidden md:block" />
            Everything in one easy dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
            <Link href="/register" className="group px-12 py-5 bg-slate-950 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_rgba(225,29,72,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
              Create Account <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="px-12 py-5 border-2 border-slate-950 dark:border-white text-slate-900 dark:text-white font-black uppercase tracking-widest text-[11px] text-center hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all">
              Sign In
            </Link>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 border-t border-slate-100 dark:border-zinc-900 pt-10">
             {[
               { val: "Fast", label: "Tracking" },
               { val: "Simple", label: "Inventory" },
               { val: "Secure", label: "Cloud" }
             ].map(s => (
               <div key={s.label} className="text-center group">
                  <div className="text-xl font-black text-slate-950 dark:text-white outfit group-hover:text-rose-600 transition-colors uppercase italic">{s.val}</div>
                  <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{s.label}</div>
               </div>
             ))}
          </div>
        </motion.div>
      </div>

      <div className="absolute top-12 left-12 text-[10px] font-black uppercase tracking-[0.5em] text-slate-200 dark:text-zinc-900 hidden md:block">KT_System: Active</div>
      <div className="absolute bottom-12 right-12 text-[10px] font-black uppercase tracking-[0.5em] text-slate-200 dark:text-zinc-900 hidden md:block">Kay Thi // 2026</div>
    </div>
  );
}

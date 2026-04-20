"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="h-screen bg-white dark:bg-[#050505] relative overflow-hidden flex items-center justify-center font-inter selection:bg-rose-100 selection:text-rose-900 border-[12px] md:border-[24px] border-slate-950 dark:border-white">
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
          <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white outfit tracking-tighter flex items-center gap-4 mb-12">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-none bg-slate-950 dark:bg-white flex items-center justify-center transform rotate-45 group transition-all">
              <span className="text-white dark:text-black text-xl md:text-2xl font-black -rotate-45">G</span>
            </div>
            GARAGE<span className="text-rose-600 italic">FLOW</span>
          </div>

          <div className="px-4 py-1 bg-rose-600 text-white font-black text-[10px] uppercase tracking-[0.4em] mb-10 shadow-lg">
             Industrial Fleet Operating System
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-slate-900 dark:text-white leading-[0.85] outfit tracking-tighter mb-8 uppercase">
            Manage your <br/> 
            <span className="text-rose-600 italic">Global Fleet.</span>
          </h1>

          <p className="text-sm md:text-lg text-slate-500 dark:text-zinc-500 font-bold leading-tight tracking-tight uppercase max-w-xl mb-12">
            One minimal interface for your entire operation. <br className="hidden md:block" />
            <span className="text-slate-900 dark:text-white">Precision tracking. Industrial Scale.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
            <Link href="/register" className="group px-12 py-5 bg-slate-950 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_rgba(225,29,72,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
              Create Hub <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="px-12 py-5 border-2 border-slate-950 dark:border-white text-slate-900 dark:text-white font-black uppercase tracking-widest text-[11px] text-center hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all">
              Operator Sign In
            </Link>
          </div>

          {/* Quick Stats Overlay */}
          <div className="mt-16 flex flex-wrap justify-center gap-12 border-t-2 border-slate-100 dark:border-zinc-900 pt-10">
             {[
               { val: "99.9%", label: "Uptime" },
               { val: "2.4ms", label: "Latency" },
               { val: "AES-256", label: "Security" }
             ].map(s => (
               <div key={s.label} className="text-center">
                  <div className="text-xl font-black text-slate-950 dark:text-white outfit">{s.val}</div>
                  <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{s.label}</div>
               </div>
             ))}
          </div>
        </motion.div>
      </div>

      {/* Aesthetic Accents */}
      <div className="absolute top-12 left-12 text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 dark:text-zinc-800 hidden md:block">GF_System_Status: Stable</div>
      <div className="absolute bottom-12 right-12 text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 dark:text-zinc-800 hidden md:block">Edition 2026 // v4.5</div>
    </div>
  );
}

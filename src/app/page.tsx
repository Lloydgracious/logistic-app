"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap, BarChart3, Globe, Database, Star } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] relative overflow-hidden flex flex-col font-inter selection:bg-rose-100 selection:text-rose-900">
      {/* Refined Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.07] -z-10"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-rose-500/[0.04] dark:bg-rose-500/[0.08] -z-10 blur-[120px]"></div>
        <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/[0.04] dark:bg-cyan-500/[0.08] -z-10 blur-[100px]"></div>
      </div>

      {/* Elegant Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-8">
         <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-xl font-black text-slate-900 dark:text-white outfit tracking-tighter flex items-center gap-2.5">
               <div className="w-9 h-9 rounded-none bg-gradient-to-br from-indigo-600 via-rose-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <span className="text-white text-base font-black">G</span>
               </div>
               GARAGE<span className="text-rose-500 italic">FLOW</span>
            </div>
            
            <div className="flex items-center gap-6">
               <Link href="/login" className="text-sm font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">Sign In</Link>
               <Link href="/register" className="text-sm font-bold bg-slate-950 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-none hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all shadow-md">
                  Create Account
               </Link>
            </div>
         </div>
      </nav>
      
      {/* Minimal Hero Section */}
      <section className="relative pt-64 pb-40 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-[11px] font-bold mb-10 shadow-sm tracking-[0.1em] uppercase">
              All-in-one Fleet Management
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tight outfit leading-[0.95] mb-12">
              Manage your fleet <br/> 
              <span className="text-gradient italic">with ease.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-500 dark:text-zinc-500 max-w-2xl mx-auto font-medium leading-relaxed mb-16 tracking-tight">
              The simplest way to track your trucks, manage your inventory, and keep your business moving—all in one beautiful dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
              <Link href="/login" className="group w-full sm:w-auto px-12 py-5 bg-slate-950 dark:bg-white text-white dark:text-black font-black rounded-none shadow-xl hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95 uppercase tracking-widest text-sm">
                 Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/register" className="w-full sm:w-auto px-12 py-5 bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white font-black rounded-none border-2 border-slate-950 dark:border-white shadow-sm hover:border-cyan-500 hover:text-cyan-500 transition-all text-center active:scale-95 text-sm uppercase tracking-widest">
                Create Account
              </Link>
            </div>

            {/* Subtle Stats Grid */}
            <div className="flex flex-wrap justify-center gap-16 md:gap-24">
               {[
                  { value: "12k+", label: "Trucks Tracked", color: "text-indigo-600" },
                  { value: "99.9%", label: "Reliability", color: "text-rose-500" },
                  { value: "24/7", label: "Support", color: "text-cyan-500" }
               ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center">
                     <span className={`text-4xl font-black ${stat.color} dark:brightness-110 outfit mb-2`}>{stat.value}</span>
                     <span className="text-[10px] text-slate-400 dark:text-zinc-600 font-black uppercase tracking-[0.2em]">{stat.label}</span>
                  </div>
               ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section with Minimal Bento-ish feel */}
      <section id="features" className="py-40 px-6 border-t border-slate-100 dark:border-zinc-900 bg-slate-50/[0.2] dark:bg-zinc-950/[0.4]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-32">
             <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight outfit mb-8">Everything you need to <span className="text-gradient">succeed.</span></h2>
             <p className="text-xl text-slate-500 dark:text-zinc-500 font-medium max-w-2xl mx-auto tracking-tight">Stop juggling spreadsheets. GarageFlow gives you one clear view of your entire operation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-slate-200 dark:border-zinc-800">
            {[
              { icon: Zap, title: "Instant Updates", desc: "See where your trucks are right now, with lightning-fast updates from the road.", color: "text-indigo-600" },
              { icon: BarChart3, title: "Clear Reports", desc: "Understand your business better with automatic charts and easy-to-read reports.", color: "text-rose-500" },
              { icon: ShieldCheck, title: "Safe and Secure", desc: "Your data is always safe with us. We use the best security to protect your business.", color: "text-cyan-500" },
              { icon: Globe, title: "Smart Routing", desc: "Save time and fuel with routes that automatically avoid traffic and delays.", color: "text-emerald-500" },
              { icon: Database, title: "Full History", desc: "Every delivery and movement is saved, so you can look back whenever you need.", color: "text-purple-500" },
              { icon: Star, title: "Simple to Use", desc: "No complex training needed. Our dashboard is built to be simple for everyone.", color: "text-amber-500" }
            ].map((feature, i) => (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 whileInView={{ opacity: 1 }} 
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1, duration: 0.8 }}
                 key={feature.title} 
                 className="p-12 bg-white dark:bg-black border border-slate-100 dark:border-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-all group"
               >
                  <div className={`w-12 h-12 rounded-none ${feature.color} flex items-center justify-start mb-8 transition-transform duration-500 group-hover:translate-x-2`}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-4 outfit uppercase tracking-tight">{feature.title}</h3>
                  <p className="text-slate-500 dark:text-zinc-500 font-medium leading-relaxed tracking-tight">{feature.desc}</p>
               </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Very Simple Footer */}
      <footer className="py-20 px-6 bg-white dark:bg-[#050505]">
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 border-t border-slate-100 dark:border-zinc-900 pt-16">
            <div className="text-2xl font-black text-slate-900 dark:text-white outfit tracking-tighter flex items-center gap-2">
               GARAGE<span className="text-rose-500 italic">FLOW</span>
            </div>
            
            <p className="text-sm text-slate-400 dark:text-zinc-600 font-black uppercase tracking-[0.2em]">© 2026 GarageFlow Technologies Inc.</p>
         </div>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap, BarChart3, Globe, Database, Star, Menu, X, ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function WelcomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] relative overflow-hidden flex flex-col font-inter selection:bg-rose-100 selection:text-rose-900 border-[12px] md:border-[20px] border-slate-900 dark:border-white">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.07] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[50%] h-[30%] bg-gradient-to-bl from-rose-500/10 via-transparent to-transparent blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 w-[50%] h-[30%] bg-gradient-to-tr from-cyan-500/10 via-transparent to-transparent blur-[120px]"></div>

      {/* Adaptive Header */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'px-4 md:px-12 py-4' : 'px-4 md:px-12 py-8 md:py-12'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/80 dark:bg-black/80 backdrop-blur-md px-6 py-4 border-2 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
          <Link href="/" className="text-xl md:text-2xl font-black text-slate-900 dark:text-white outfit tracking-tighter flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-none bg-slate-900 dark:bg-white flex items-center justify-center transform rotate-45 group transition-all">
              <span className="text-white dark:text-black text-sm md:text-xl font-black -rotate-45">G</span>
            </div>
            GARAGE<span className="text-rose-600 italic">FLOW</span>
          </Link>

          <div className="hidden lg:flex items-center gap-12 font-black uppercase text-[11px] tracking-widest text-slate-500 dark:text-zinc-500">
             <Link href="#features" className="hover:text-rose-600 transition-colors">Audit Engine</Link>
             <Link href="#features" className="hover:text-cyan-600 transition-colors">Manifest Forge</Link>
             <Link href="/login" className="px-6 py-3 border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">Sign In</Link>
             <Link href="/register" className="px-6 py-3 bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Create Account</Link>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-slate-900 dark:text-white">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 mt-2 px-4">
            <div className="bg-white dark:bg-black border-2 border-slate-900 dark:border-white p-8 space-y-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black uppercase italic text-slate-900 dark:text-white border-b-2 border-slate-100 dark:border-zinc-800 pb-2">Sign In</Link>
              <Link href="/register" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black uppercase italic text-rose-600 border-b-2 border-slate-100 dark:border-zinc-800 pb-2">Register Hub</Link>
              <div className="pt-4 flex gap-4">
                <div className="w-10 h-10 bg-indigo-600"></div>
                <div className="w-10 h-10 bg-rose-600"></div>
                <div className="w-10 h-10 bg-cyan-600"></div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Industrial Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center pt-48 md:pt-60 pb-20 md:pb-32 px-6">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-start text-left"
          >
            <div className="px-4 py-1.5 bg-rose-600 text-white font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] mb-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              Industrial Grade Ops • Next Gen Efficiency
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-[140px] font-black text-slate-900 dark:text-white leading-[0.85] outfit tracking-tighter mb-12 uppercase select-none">
              Control the <br/>
              <span className="text-rose-600 pr-4 italic">Flow.</span>
              <br className="hidden md:block" />
              Scale the <span className="text-indigo-600 italic">Fleet.</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 w-full mt-12 items-end">
              <div className="md:col-span-12 lg:col-span-5 space-y-12">
                <p className="text-lg md:text-2xl text-slate-600 dark:text-zinc-500 font-bold leading-tight tracking-tight uppercase max-w-xl">
                  Stop juggling spreadsheets. GarageFlow gives you one <span className="text-slate-900 dark:text-white">Industrial Dashboard</span> for your entire global operation.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6">
                  <Link href="/register" className="group px-12 py-6 bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_rgba(225,29,72,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                    Initiate Hub <ArrowUpRight className="w-5 h-5" />
                  </Link>
                  <Link href="/login" className="px-12 py-6 border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm text-center hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all">
                    Operator Login
                  </Link>
                </div>
              </div>

              <div className="md:col-span-12 lg:col-span-7 flex flex-wrap gap-8 md:gap-12 justify-start md:justify-end">
                {[
                  { value: "54k", label: "Manifests Sent", color: "text-indigo-600" },
                  { value: "0.12ms", label: "Api Latency", color: "text-rose-600" },
                  { value: "100%", label: "System Uptime", color: "text-cyan-600" }
                ].map((stat) => (
                  <div key={stat.label} className="border-l-4 border-slate-900 dark:border-white pl-6">
                    <div className={`text-4xl md:text-5xl font-black ${stat.color} outfit uppercase tracking-tighter`}>{stat.value}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Editorial Grid Sections */}
      <section id="features" className="py-20 md:py-40 px-6 border-y-[12px] md:border-y-[20px] border-slate-900 dark:border-white bg-slate-50 dark:bg-[#070707]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 lg:items-end justify-between mb-24">
            <h2 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white outfit tracking-tighter leading-none uppercase">
              Engineered <br/> for <span className="text-rose-600 italic">Speed.</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-500 max-w-md font-bold uppercase tracking-tight">
              A high-precision fleet operating system built with industrial aesthetics and real-time reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Audit Engine", desc: "Real-time system telemetry tracking every asset movement across the global ecosystem.", color: "bg-indigo-600" },
              { icon: BarChart3, title: "Billing Forge", desc: "Instantly generate high-fidelity industrial invoices and billable manifests.", color: "bg-rose-600" },
              { icon: ShieldCheck, title: "Secure Protocol", desc: "E2E encryption for all shipment payloads and customer data handling.", color: "bg-cyan-600" },
              { icon: Globe, title: "Global Sync", desc: "Multi-regional cloud distribution ensures sub-millisecond data propagation.", color: "bg-emerald-600" },
              { icon: Database, title: "Warehouse Core", desc: "Unified inventory ledgering system with granular item tracking and unit management.", color: "bg-amber-600" },
              { icon: Star, title: "Premium UI", desc: "Sharp-edged, editorial design language optimized for high-performance operations.", color: "bg-purple-600" }
            ].map((feature, i) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                key={feature.title}
                className="p-8 md:p-12 border-2 border-slate-900 dark:border-white bg-white dark:bg-black hover:translate-x-2 hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(225,29,72,1)] transition-all cursor-default"
              >
                <div className={`w-12 h-12 ${feature.color} text-white flex items-center justify-center mb-10 shadow-lg`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white outfit uppercase tracking-tighter mb-6">{feature.title}</h3>
                <p className="text-sm md:text-base text-slate-500 dark:text-zinc-500 font-bold leading-relaxed tracking-tight">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industrial Footer */}
      <footer className="py-12 md:py-32 px-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-16">
          <div className="space-y-8">
            <div className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white outfit tracking-tighter uppercase italic">
              Garage<span className="text-rose-600">Flow</span>
            </div>
            <p className="max-w-xs text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600 leading-loose">
              GarageFlow Technologies Inc. <br/>
              Strategic Logistics Operating System. <br/>
              Edition 4.5.1 // Build 2026.4
            </p>
          </div>
          
          <div className="flex flex-wrap gap-12 md:gap-24">
             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Operational Hubs</p>
                <div className="flex flex-col gap-2 text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                   <Link href="/login" className="hover:line-through">North America</Link>
                   <Link href="/login" className="hover:line-through">Euro-Zone</Link>
                   <Link href="/login" className="hover:line-through">Asia Pacific</Link>
                </div>
             </div>
             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600">System Status</p>
                <div className="flex items-center gap-2 text-sm font-black uppercase text-emerald-500">
                   <div className="w-2 h-2 bg-emerald-500 rounded-none animate-pulse"></div>
                   All Vectors Green
                </div>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

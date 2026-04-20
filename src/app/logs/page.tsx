"use client";

import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, Terminal, Activity, ArrowRight, ShieldCheck, Cpu, Database } from "lucide-react";
import { ClientDate } from "@/components/ClientDate";

export default function LogsPage() {
  const { logs } = useStore();

  const getLogColors = (type: string) => {
    switch (type) {
      case "INCOMING": return "text-rose-500 border-rose-500 bg-rose-50/50";
      case "OUTGOING": return "text-indigo-500 border-indigo-500 bg-indigo-50/50";
      case "MANUAL": return "text-cyan-500 border-cyan-500 bg-cyan-50/50";
      default: return "text-slate-500 border-slate-500 bg-slate-50/50";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* Header with Technical Flair */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1.5 h-full bg-rose-500" />
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter outfit uppercase italic">
            Audit <span className="text-rose-500">Engine</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Activity className="w-3 h-3 text-rose-500 animate-pulse" /> Real-time system state sequencing
          </p>
        </div>

        <div className="flex items-center gap-3">
           <div className="px-4 py-3 bg-slate-900 text-white border-b-4 border-rose-600 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-rose-500" />
              <div className="text-right">
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-60 line-height-1">Security Status</p>
                 <p className="text-xs font-black uppercase tracking-tighter">Verified Protocol</p>
              </div>
           </div>
           <div className="px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-3">
              <Database className="w-5 h-5 text-indigo-500" />
              <div className="text-right">
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 line-height-1">Nodes Active</p>
                 <p className="text-xs font-black uppercase tracking-tighter text-slate-800 dark:text-white">{logs.length} Sequential Events</p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Logs Feed */}
      <div className="saas-card p-0 rounded-none border-2 border-slate-900 dark:border-zinc-800 shadow-2xl bg-white dark:bg-black overflow-hidden relative">
        
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">System.stdout</span>
           </div>
           <div className="flex items-center gap-1.5 grayscale opacity-50">
              <div className="w-2 h-2 bg-red-500" />
              <div className="w-2 h-2 bg-amber-500" />
              <div className="w-2 h-2 bg-emerald-500" />
           </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-zinc-900 font-mono">
          <AnimatePresence initial={false}>
            {logs.map((log, idx) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex flex-col md:flex-row items-start md:items-center p-6 gap-6 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-all relative overflow-hidden"
              >
                {/* ID Counter */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-8xl font-black text-slate-100 dark:text-zinc-900/40 pointer-events-none select-none -z-10 group-hover:text-rose-500/5 transition-colors">
                  {logs.length - idx}
                </div>

                <div className="w-full md:w-48 flex-shrink-0">
                  <span className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest block mb-1">timestamp_utc</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-400">
                    <ClientDate date={log.timestamp} format="full" />
                  </p>
                </div>

                <div className="flex-shrink-0">
                   <div className={`px-4 py-1.5 border-l-4 font-black text-[10px] uppercase tracking-widest shadow-sm ${getLogColors(log.type)}`}>
                     {log.type}
                   </div>
                </div>

                <div className="flex-1">
                   <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest block mb-1">event_payload</span>
                   <p className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                     <ArrowRight className="w-4 h-4 text-rose-500" />
                     {log.message}
                   </p>
                </div>

                <div className="hidden lg:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center">
                      <Cpu className="w-4 h-4" />
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {logs.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-zinc-900/50">
               <div className="w-16 h-16 rounded-none border-4 border-slate-200 flex items-center justify-center">
                  <ScrollText className="w-8 h-8 text-slate-300" />
               </div>
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Awaiting primary signal... No logs detected.</p>
            </div>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-zinc-950 px-6 py-4 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
           <span>Total Bytes Processed: {(logs.length * 256).toLocaleString()}B</span>
           <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 animate-pulse" />
              Stream Connected: Secure_Tunnel_v4.2
           </span>
        </div>
      </div>
    </div>
  );
}

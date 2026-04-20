"use client";

import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, Terminal, Activity, ArrowRight, ShieldCheck, Cpu, Database, Hash, Clock } from "lucide-react";
import { ClientDate } from "@/components/ClientDate";

export default function LogsPage() {
  const { logs } = useStore();

  const getLogColors = (type: string) => {
    switch (type) {
      case "INCOMING": return "text-rose-500 border-rose-500 bg-rose-500/5";
      case "OUTGOING": return "text-indigo-500 border-indigo-500 bg-indigo-500/5";
      case "MANUAL": return "text-cyan-500 border-cyan-500 bg-cyan-500/5";
      default: return "text-slate-500 border-slate-500 bg-slate-500/5";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500 font-inter">
      
      {/* Header with High-Resolution Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-8 border-b-4 border-slate-900 dark:border-white">
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-600 text-white text-[9px] font-black uppercase tracking-[0.3em] mb-4">
            Live Telemetry • Buffer Active
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter outfit uppercase leading-none">
            Audit <span className="text-rose-600 italic">Engine</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-500 mt-4 max-w-md leading-relaxed uppercase tracking-tight">
            Sequential event ledgering for the global garage ecosystem. 
            Cryptographic verification active for all incoming/outgoing data packets.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
           <div className="p-6 bg-slate-900 text-white border-b-8 border-rose-600 shadow-2xl min-w-[200px]">
              <div className="flex items-center gap-3 mb-4">
                 <ShieldCheck className="w-5 h-5 text-rose-500" />
                 <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Auth Protocol</span>
              </div>
              <p className="text-2xl font-black uppercase tracking-tighter outfit leading-none">V4.2.SECURE</p>
           </div>
           <div className="p-6 bg-white dark:bg-zinc-900 border-2 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(225,29,72,1)] min-w-[200px]">
              <div className="flex items-center gap-3 mb-4">
                 <Database className="w-5 h-5 text-indigo-500" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ledger Entry</span>
              </div>
              <p className="text-2xl font-black uppercase tracking-tighter outfit leading-none text-slate-900 dark:text-white">{logs.length} EVTS</p>
           </div>
        </div>
      </div>

      {/* Main Terminal Feed */}
      <div className="border-[6px] border-slate-900 dark:border-white bg-white dark:bg-black overflow-hidden relative">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b-2 border-slate-800">
           <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-rose-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">GarageFlow.Audit_LOG.v4</span>
           </div>
           <div className="hidden sm:flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-rose-500" /> CRITICAL</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500" /> SYSTEM</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-500" /> USER</span>
           </div>
        </div>

        <div className="divide-y-2 divide-slate-100 dark:divide-zinc-900">
          <AnimatePresence initial={false}>
            {logs.map((log, idx) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group flex flex-col lg:flex-row items-start lg:items-center p-8 gap-8 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-all relative overflow-hidden"
              >
                {/* Event Index Header */}
                <div className="flex items-center gap-4 w-full lg:w-48 flex-shrink-0">
                   <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center font-black outfit text-sm">
                      {logs.length - idx}
                   </div>
                   <div className="flex-1">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Entry ID</div>
                      <div className="text-xs font-black text-slate-900 dark:text-zinc-500 font-mono">EVT_{log.id.toUpperCase()}</div>
                   </div>
                </div>

                <div className="w-full lg:w-56 flex-shrink-0">
                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    <Clock className="w-3 h-3" /> Timestamp
                  </div>
                  <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                    <ClientDate date={log.timestamp} format="full" />
                  </p>
                </div>

                <div className="flex-shrink-0">
                   <div className={`px-5 py-2 border-2 font-black text-[10px] uppercase tracking-[0.2em] shadow-sm transition-colors ${getLogColors(log.type)}`}>
                     {log.type}
                   </div>
                </div>

                <div className="flex-1 lg:pl-8 lg:border-l-2 lg:border-slate-100 lg:dark:border-zinc-800">
                   <div className="flex items-center gap-2 text-[9px] text-rose-500 font-black uppercase tracking-widest mb-1">
                     <Hash className="w-3 h-3" /> Event Payload
                   </div>
                   <p className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                     {log.message}
                   </p>
                </div>

                <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-transparent via-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {logs.length === 0 && (
            <div className="p-32 text-center flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-[#030303]">
               <div className="w-24 h-24 border-8 border-slate-200 dark:border-zinc-800 flex items-center justify-center transform rotate-45">
                  <Terminal className="w-10 h-10 text-slate-300 -rotate-45" />
               </div>
               <div className="space-y-2">
                 <p className="text-xl font-black text-slate-400 dark:text-zinc-600 uppercase tracking-tighter outfit italic">Awaiting Primary Interface Signal</p>
                 <p className="text-[10px] font-black text-slate-300 dark:text-zinc-800 uppercase tracking-[0.5em]">System Status: Standby</p>
               </div>
            </div>
          )}
        </div>

        <div className="bg-slate-900 text-white px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
           <button className="flex items-center gap-2 hover:text-rose-500 transition-colors">
              <Cpu className="w-4 h-4 text-indigo-500" /> Process ID: GF_CORE_PROC_772
           </button>
           <span className="flex items-center gap-3 text-slate-500">
              <span className="w-2 h-2 bg-emerald-500 animate-pulse" />
              Stream Connected • TLS 1.3 Secure
           </span>
        </div>
      </div>
    </div>
  );
}

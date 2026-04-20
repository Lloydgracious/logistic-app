"use client";

import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { User, Clock, Search, Activity } from "lucide-react";
import { ClientDate } from "@/components/ClientDate";
import { useState } from "react";

export default function LogsPage() {
  const { logs } = useStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500 font-inter">
      
      {/* Simplified Tracker Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight outfit uppercase">Activity <span className="text-rose-500">Tracker</span></h2>
          <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1">Full operational log for inventory and logistics events.</p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter logs..." 
            className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 px-10 py-2.5 rounded-none text-sm outline-none focus:border-rose-500 transition-all font-medium text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Tracker Log Table */}
      <div className="saas-card p-0 rounded-none border-2 border-slate-900 dark:border-zinc-800 shadow-2xl bg-white dark:bg-black overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Activity Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Event Description</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Processed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
              <AnimatePresence initial={false}>
                {filteredLogs.map((log) => (
                  <motion.tr 
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400 outfit">
                        <Clock className="w-3.5 h-3.5" />
                        <ClientDate date={log.timestamp} format="full" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className={
                         `px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border border-current bg-opacity-10
                         ${log.type === 'INCOMING' ? 'text-rose-500 border-rose-500/30' : 
                          log.type === 'OUTGOING' ? 'text-indigo-500 border-indigo-500/30' : 
                          'text-cyan-500 border-cyan-500/30'}`
                       }>
                         {log.type}
                       </span>
                    </td>
                    <td className="px-6 py-5 flex-1">
                       <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 shrink-0 ${
                            log.type === 'INCOMING' ? 'bg-rose-500' : 
                            log.type === 'OUTGOING' ? 'bg-indigo-500' : 'bg-cyan-500'
                          }`} />
                          <span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight outfit uppercase">{log.message}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-zinc-800">
                             <User className="w-3 h-3 text-slate-400" />
                          </div>
                          <span className="text-xs font-black text-slate-600 dark:text-zinc-400 outfit uppercase tracking-tighter">{log.operator || "System"}</span>
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                     <Activity className="w-10 h-10 text-slate-200 mx-auto mb-4 animate-pulse" />
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No activity found in tracker.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simplified Footer Stats */}
      <div className="flex items-center gap-6 pt-4">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-emerald-500 rounded-none" />
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tracker Online</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Event Volume: <span className="text-slate-900 dark:text-white">{logs.length}</span></span>
        </div>
      </div>
    </div>
  );
}

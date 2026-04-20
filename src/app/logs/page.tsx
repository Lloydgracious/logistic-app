"use client";

import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, Activity, ArrowRight, CheckCircle2, Clock, MapPin, Package, ShoppingCart, Truck, Search, Filter } from "lucide-react";
import { ClientDate } from "@/components/ClientDate";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function LogsPage() {
  const { logs } = useStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLogIcon = (type: string) => {
    switch (type) {
      case "INCOMING": return <Truck className="w-5 h-5" />;
      case "OUTGOING": return <ShoppingCart className="w-5 h-5" />;
      case "MANUAL": return <Package className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getLogColors = (type: string) => {
    switch (type) {
      case "INCOMING": return "border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/20";
      case "OUTGOING": return "border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20";
      case "MANUAL": return "border-cyan-500 text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20";
      default: return "border-slate-500 text-slate-600 bg-slate-50 dark:bg-slate-900";
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-8 border-slate-900 dark:border-white pb-10">
        <div>
           <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-rose-600 text-white flex items-center justify-center font-black rotate-45">
                 <ScrollText className="w-5 h-5 -rotate-45" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-600">Operational History</span>
           </div>
           <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter outfit uppercase leading-none">
             Audit <span className="text-rose-600 italic">Timeline</span>
           </h2>
           <p className="text-sm font-bold text-slate-500 mt-4 max-w-md uppercase tracking-tight">
             Comprehensive sequential tracking of all garage operations and inventory shifts.
           </p>
        </div>

        <div className="relative w-full md:w-72 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search activity..." 
            className="w-full bg-slate-50 dark:bg-zinc-900 border-4 border-slate-900 dark:border-white pl-12 pr-4 py-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-rose-500/10 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Narrative Timeline */}
      <div className="relative">
        {/* Timeline Path Line */}
        <div className="absolute left-[26px] md:left-1/2 top-0 bottom-0 w-1 bg-slate-100 dark:bg-zinc-900 md:-translate-x-1/2 hidden sm:block" />

        <div className="space-y-12 relative z-10">
          <AnimatePresence initial={false}>
            {filteredLogs.map((log, idx) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "flex flex-col md:flex-row items-center gap-8 md:gap-0 w-full",
                  idx % 2 === 0 ? "md:flex-row-reverse" : ""
                )}
              >
                {/* Visual Label Section */}
                <div className="w-full md:w-1/2 flex flex-col md:px-12 items-center md:items-start text-center md:text-left">
                   <div className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 border-2 text-[10px] font-black uppercase tracking-widest mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]",
                      getLogColors(log.type)
                   )}>
                      {getLogIcon(log.type)}
                      {log.type} Phase
                   </div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3" /> <ClientDate date={log.timestamp} format="full" />
                   </div>
                </div>

                {/* Center Node */}
                <div className="relative flex items-center justify-center shrink-0">
                   <div className="w-14 h-14 bg-slate-950 dark:bg-white flex items-center justify-center border-4 border-white dark:border-black shadow-xl z-20">
                      <div className={cn("w-3 h-3 rounded-none animate-pulse", 
                        log.type === 'INCOMING' ? 'bg-rose-500' : 
                        log.type === 'OUTGOING' ? 'bg-indigo-500' : 'bg-cyan-500'
                      )} />
                   </div>
                </div>

                {/* Payload / Message Section */}
                <div className="w-full md:w-1/2 bg-white dark:bg-black border-2 border-slate-200 dark:border-zinc-800 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] md:mx-12 group hover:border-slate-900 dark:hover:border-white transition-all cursor-default">
                   <div className="flex items-center gap-3 mb-4">
                      <ArrowRight className="w-4 h-4 text-rose-500 group-hover:translate-x-1 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Activity Manifest</span>
                   </div>
                   <p className="text-base md:text-lg font-black text-slate-900 dark:text-slate-100 outfit leading-none italic uppercase tracking-tighter">
                      {log.message}
                   </p>
                   <div className="mt-6 pt-4 border-t border-slate-50 dark:border-zinc-900 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Seq: {log.id.toUpperCase()}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredLogs.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-zinc-900/50 border-4 border-dashed border-slate-200">
               <Activity className="w-10 h-10 text-slate-300 animate-pulse" />
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No sequential data detected for current parameters.</p>
            </div>
          )}
        </div>
      </div>

      {/* System Footer Stats */}
      <div className="bg-slate-900 text-white p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8">
         <div className="flex items-center gap-6">
            <div className="text-center">
               <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">Total Cycles</p>
               <p className="text-2xl font-black outfit">{logs.length}</p>
            </div>
            <div className="w-[1px] h-10 bg-slate-800" />
            <div className="text-center">
               <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">Uptime Trace</p>
               <p className="text-2xl font-black outfit text-emerald-500">100%</p>
            </div>
         </div>
         <div className="flex items-center gap-3 italic font-black text-xs opacity-80 uppercase tracking-tighter">
            GarageFlow Operational Archive // Verified Protocol Secure
         </div>
      </div>
    </div>
  );
}

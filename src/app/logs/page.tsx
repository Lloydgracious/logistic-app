"use client";

import { useStore, LogType } from "@/lib/store";
import { motion } from "framer-motion";
import { LogIn, LogOut, Wrench } from "lucide-react";
import { ClientDate } from "@/components/ClientDate";

const getLogIcon = (type: LogType) => {
  switch(type) {
    case 'INCOMING': return <LogIn className="w-4 h-4 text-orange-400" />;
    case 'OUTGOING': return <LogOut className="w-4 h-4 text-blue-400" />;
    case 'MANUAL': return <Wrench className="w-4 h-4 text-gray-400" />;
  }
};

const getLogBg = (type: LogType) => {
  switch(type) {
    case 'INCOMING': return "bg-orange-400/10 border-orange-400/20";
    case 'OUTGOING': return "bg-blue-400/10 border-blue-400/20";
    case 'MANUAL': return "bg-gray-400/10 border-gray-400/20";
  }
};

export default function LogsPage() {
  const { logs } = useStore();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">System Logs</h2>
        <p className="text-gray-400">Timeline of all operations within the GarageFlow system.</p>
      </div>

      <div className="relative border-l-2 border-white/10 pl-8 ml-4 space-y-8">
        {logs.map((log, index) => (
          <motion.div 
            key={log.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
          >
            <div className={`absolute -left-[41px] top-1.5 w-8 h-8 rounded-full border border-black flex items-center justify-center ${getLogBg(log.type)}`}>
              {getLogIcon(log.type)}
            </div>
            
            <div className="glass p-5 rounded-2xl border border-white/5 hover:border-[#00d1ff]/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded w-max ${getLogBg(log.type)} uppercase tracking-wider`}>
                  {log.type}
                </span>
                <span className="text-sm text-gray-500">
                  <ClientDate date={log.timestamp} />
                </span>
              </div>
              <p className="text-white text-lg font-medium">{log.message}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

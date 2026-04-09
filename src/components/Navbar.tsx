"use client";

import { Bell, Search, LayoutDashboard, LogIn, ShoppingCart, Package, ScrollText } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Incoming", href: "/incoming", icon: LogIn },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Logs", href: "/logs", icon: ScrollText },
];

export function Navbar() {
  const pathname = usePathname();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0, x: "-50%" }}
      animate={{ y: 0, opacity: 1, x: "-50%" }}
      transition={{ type: "spring", stiffness: 200, damping: 40, delay: 0.1 }}
      className="fixed top-8 left-1/2 z-[100] flex items-center justify-between px-6 py-2.5 w-[90%] max-w-6xl glass rounded-[3rem] border border-[#ffffff10] shadow-[0_30px_60px_rgba(0,0,0,0.7)] backdrop-blur-[50px] ring-1 ring-white/5"
    >
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00d1ff] to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,209,255,0.3)]">
             <span className="font-black text-white text-xl">G</span>
          </div>
          <span className="font-black text-xl italic tracking-tighter hidden md:block text-slate-200">FLOW</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 p-1 bg-white/5 rounded-full border border-white/5">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link key={link.name} href={link.href} className="relative px-4 py-2 flex items-center gap-2 group transition-all duration-300">
                {isActive && (
                  <motion.div 
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-[#00d1ff]/10 rounded-full border border-[#00d1ff]/20"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={cn(
                  "w-4 h-4 transition-colors duration-300",
                  isActive ? "text-[#00d1ff]" : "text-slate-400 group-hover:text-white"
                )} />
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                )}>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <motion.div 
          animate={{ 
            width: isSearchFocused ? "280px" : "160px",
            backgroundColor: isSearchFocused ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"
          }}
          className="relative flex items-center group rounded-full border border-white/5 overflow-hidden transition-all duration-500"
        >
          <Search className={cn(
            "absolute left-4 w-4 h-4 transition-colors duration-300",
            isSearchFocused ? "text-[#00d1ff]" : "text-slate-500"
          )} />
          <input 
            type="text" 
            placeholder="Search network..." 
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full bg-transparent pl-11 pr-4 py-2.5 text-xs outline-none text-white placeholder-slate-500 font-medium"
          />
        </motion.div>
        
        <div className="w-[1px] h-6 bg-white/10" />
        
        <button className="relative w-10 h-10 rounded-full bg-[#ffffff03] hover:bg-[#ffffff08] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 group">
          <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#00d1ff] rounded-full border-2 border-[#020617] shadow-[0_0_10px_rgba(0,209,255,0.8)] animate-pulse"></span>
        </button>

        <div className="w-10 h-10 rounded-full border-2 border-[#00d1ff]/20 overflow-hidden bg-white/5 flex-shrink-0 cursor-pointer hover:border-[#00d1ff]/40 transition-colors">
           <div className="w-full h-full bg-gradient-to-tr from-[#00d1ff]/10 to-blue-500/5 flex items-center justify-center font-bold text-xs">JS</div>
        </div>
      </div>
    </motion.header>
  );
}

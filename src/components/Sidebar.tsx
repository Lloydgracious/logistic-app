"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogIn, ShoppingCart, Package, ScrollText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Incoming", href: "/incoming", icon: LogIn },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Logs", href: "/logs", icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.aside 
      initial={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ 
        width: isHovered ? "220px" : "68px",
        x: 0 
      }}
      className="fixed left-6 top-1/2 -translate-y-1/2 z-[100] bg-white dark:bg-black/60 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-premium flex flex-col items-center py-8 gap-8 overflow-hidden backdrop-blur-2xl group transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
    >
      {/* App Logo/Icon */}
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center glow-hover shadow-[0_0_20px_rgba(37,99,235,0.3)]">
          <span className="font-black text-white text-lg">G</span>
        </div>
        <AnimatePresence>
          {isHovered && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-14 whitespace-nowrap font-bold text-xl tracking-tighter text-slate-800 dark:text-white"
            >
              GarageFlow
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 w-full px-3 space-y-3">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-4 px-3 py-3.5 rounded-[1.5rem] transition-all duration-300 relative group/item",
                isActive 
                  ? "text-primary dark:text-white" 
                  : "text-slate-400 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-blue-50 dark:bg-white/10 border border-blue-100 dark:border-white/20 rounded-[1.5rem]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <div className={cn(
                "relative z-10 w-6 h-6 flex items-center justify-center transition-transform group-hover/item:scale-110 duration-300",
                isActive && "text-primary dark:text-primary"
              )}>
                <Icon className="w-5 h-5 shrink-0" />
              </div>

              <AnimatePresence>
                {isHovered && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="relative z-10 whitespace-nowrap font-bold text-sm tracking-tight"
                  >
                    {link.name}
                  </motion.span>
                )}
              </AnimatePresence>

              {isActive && !isHovered && (
                <div className="absolute -left-1 w-1.5 h-6 bg-[#00d1ff] rounded-r-full shadow-[0_0_10px_#00d1ff] z-20" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile Section (always shown icon, expand info on hover) */}
      <div className="w-full px-3 pt-6 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-4 px-1">
          <div className="w-10 h-10 rounded-full bg-[#ffffff05] border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:ring-2 ring-orange-500/30 transition-all">
            <span className="font-bold text-gray-400 text-xs">JS</span>
          </div>
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden"
              >
                <p className="text-xs font-bold whitespace-nowrap">John Smith</p>
                <p className="text-[10px] text-gray-500 whitespace-nowrap">Manager</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}

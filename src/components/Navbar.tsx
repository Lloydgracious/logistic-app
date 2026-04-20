"use client";

import { Bell, Search, LayoutDashboard, Truck, ShoppingCart, Package, Moon, Sun, Layout, ScrollText, Receipt, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Incoming", href: "/incoming", icon: Truck },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Logs", href: "/logs", icon: ScrollText },
  { name: "Billing", href: "/invoices", icon: Receipt },
];

export function Navbar() {
  const pathname = usePathname();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
    // Close mobile menu on route change
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  if (['/', '/login', '/register'].includes(pathname)) {
    return null;
  }

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all"
      >
        <div className="flex items-center gap-4 md:gap-10">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-none bg-gradient-to-br from-indigo-600 via-rose-500 to-cyan-500 flex items-center justify-center shadow-lg transform rotate-45">
               <span className="font-black text-white text-base md:text-xl -rotate-45">G</span>
            </div>
            <span className="font-black text-lg md:text-xl tracking-tighter text-slate-900 dark:text-white outfit uppercase">Garage<span className="text-rose-500 italic">Flow</span></span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link key={link.name} href={link.href} className={cn(
                  "relative px-4 py-2 flex items-center gap-2 group transition-all border-b-2 uppercase tracking-widest",
                  isActive ? "text-rose-600 border-rose-600 bg-rose-50/50" : "text-slate-500 dark:text-zinc-500 border-transparent hover:text-slate-900 dark:hover:text-white"
                )}>
                  <Icon className={cn(
                    "w-4 h-4 z-10 transition-colors",
                    isActive ? "text-rose-600" : "text-slate-400 group-hover:text-rose-500"
                  )} />
                  <span className="text-[11px] font-black z-10">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div 
            className={cn(
              "relative hidden sm:flex items-center border overflow-hidden transition-all duration-300 rounded-none",
              isSearchFocused ? "w-48 md:w-64 border-rose-500 ring-4 ring-rose-500/10 bg-white" : "w-32 md:w-48 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-zinc-900"
            )}
          >
            <Search className={cn("absolute left-3 w-4 h-4", isSearchFocused ? "text-rose-500" : "text-slate-400")} />
            <input 
              type="text" 
              placeholder="System..." 
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full bg-transparent pl-9 pr-4 py-2 text-[10px] md:text-xs outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 font-extrabold uppercase tracking-tight"
            />
          </div>
          
          <div className="hidden md:block w-[1px] h-6 bg-slate-200 dark:bg-slate-800" />
          
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 flex items-center justify-center text-slate-500 dark:text-zinc-500 hover:text-rose-500 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link href="/notifications" className="hidden sm:flex relative w-9 h-9 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 flex items-center justify-center text-slate-500 dark:text-zinc-500 hover:text-cyan-500 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-none"></span>
          </Link>

          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-2 pr-1 py-1 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 group transition-all"
            >
              <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Admin Master</p>
                  <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Global Fleet</p>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-none bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-black outfit text-xs md:text-sm shadow-xl group-hover:bg-rose-500 group-hover:text-white transition-all">
                 AU
              </div>
            </button>

            {isProfileOpen && (
               <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none shadow-2xl py-0 flex flex-col z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-slate-800">
                     <p className="text-xs font-black text-slate-900 dark:text-white uppercase">John Smith</p>
                     <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold tracking-tight">john@garageflow.io</p>
                  </div>
                  <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="px-4 py-3 text-[11px] font-black uppercase text-slate-600 dark:text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-3">
                     <Layout className="w-4 h-4" />
                     Profile Settings
                  </Link>
                  <button onClick={() => { setIsProfileOpen(false); router.push('/'); }} className="w-full text-left px-4 py-3 text-[11px] font-black uppercase text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center gap-3 border-t border-slate-50 dark:border-slate-800">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                     Secure Log Out
                  </button>
               </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-black border-r border-slate-200 dark:border-slate-800 z-[70] lg:hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-none bg-slate-900 flex items-center justify-center text-white font-black">G</div>
                  <span className="font-black text-lg tracking-tighter uppercase italic">Garage<span className="text-rose-500">Flow</span></span>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-rose-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 py-8 px-4 overflow-y-auto">
                <nav className="space-y-1">
                  {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                      <Link 
                        key={link.name} 
                        href={link.href}
                        className={cn(
                          "flex items-center gap-4 px-4 py-4 font-black uppercase tracking-[0.2em] text-[10px] border-l-4 transition-all",
                          isActive 
                            ? "bg-rose-50 text-rose-600 border-rose-600 dark:bg-rose-950/20" 
                            : "text-slate-500 dark:text-zinc-500 border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {link.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-zinc-900 font-black text-[9px] uppercase tracking-widest text-slate-400">
                System Ver: 4.2.1-Prod
                <div className="mt-1 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-none animate-pulse" />
                  Network Secure
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

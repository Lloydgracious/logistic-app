"use client";

import { Bell, Search, Moon, Sun, Menu, X, LogOut, ShieldCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_MODULE, getAllowedModules, type ModuleKey } from "@/lib/access-control";
import { getCurrentAccount, type CurrentAccount } from "@/lib/supabase/admin";

export function Navbar() {
  const pathname = usePathname();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [account, setAccount] = useState<CurrentAccount | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
    // Close mobile menu on route change
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    const loadAccount = async () => {
      const nextAccount = await getCurrentAccount();
      if (isMounted) setAccount(nextAccount);
    };

    void loadAccount();

    const supabase = createClient();
    if (!supabase) return () => {
      isMounted = false;
    };

    const { data } = supabase.auth.onAuthStateChange(() => {
      void loadAccount();
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
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

  const handleLogout = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/');
    router.refresh();
  };

  if (['/', '/login', '/register'].includes(pathname)) {
    return null;
  }

  const profile = account?.status === "ready" || account?.status === "disabled" ? account.profile : null;
  const enabledModules: ModuleKey[] = account?.status === "ready" || account?.status === "disabled" ? account.enabledModules : [];
  const navigationLinks = profile ? getAllowedModules(profile.role, enabledModules) : [];
  const adminLink = profile?.role === "admin" ? ADMIN_MODULE : null;
  const canOpenNotifications = profile?.role === "admin" || enabledModules.includes("notifications");

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

          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex items-center">
              <Image src="/kt-logistic-logo.jpg" alt="KT Logistic & Trading" width={842} height={595} className="h-11 w-auto max-w-[190px] object-contain" priority />
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-1">
            {[...navigationLinks, ...(adminLink ? [adminLink] : [])].map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link key={link.label} href={link.href} className={cn(
                  "relative px-4 py-2 flex items-center gap-2 group transition-all border-b-2 uppercase tracking-widest",
                  isActive ? "text-rose-600 border-rose-600 bg-rose-50/50" : "text-slate-500 dark:text-zinc-500 border-transparent hover:text-slate-900 dark:hover:text-white"
                )}>
                  <Icon className={cn(
                    "w-4 h-4 z-10 transition-colors",
                    isActive ? "text-rose-600" : "text-slate-400 group-hover:text-rose-500"
                  )} />
                  <span className="text-[11px] font-black z-10">{link.label}</span>
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

          {canOpenNotifications && (
            <Link href="/notifications" className="hidden sm:flex relative w-9 h-9 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 flex items-center justify-center text-slate-500 dark:text-zinc-500 hover:text-cyan-500 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-none"></span>
            </Link>
          )}

          {profile?.role === "admin" && (
            <Link href="/admin" className="hidden sm:flex w-9 h-9 border border-transparent hover:border-cyan-200 dark:hover:border-cyan-900/50 flex items-center justify-center text-slate-500 dark:text-zinc-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 hover:text-cyan-600 transition-colors" aria-label="Admin control center" title="Admin control center">
              <ShieldCheck className="w-4 h-4" />
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="hidden sm:flex w-9 h-9 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 flex items-center justify-center text-slate-500 dark:text-zinc-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-colors"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
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
                  <span className="flex items-center">
                    <Image src="/kt-logistic-logo.jpg" alt="KT Logistic & Trading" width={842} height={595} className="h-11 w-auto max-w-[185px] object-contain" priority />
                  </span>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-rose-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 py-8 px-4 overflow-y-auto">
                <nav className="space-y-1">
                  {[...navigationLinks, ...(adminLink ? [adminLink] : [])].map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                      <Link 
                        key={link.label} 
                        href={link.href}
                        className={cn(
                          "flex items-center gap-4 px-4 py-4 font-black uppercase tracking-[0.2em] text-[10px] border-l-4 transition-all",
                          isActive 
                            ? "bg-rose-50 text-rose-600 border-rose-600 dark:bg-rose-950/20" 
                            : "text-slate-500 dark:text-zinc-500 border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {link.label}
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

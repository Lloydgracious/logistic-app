"use client";

import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Package, Truck, ShoppingCart, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ClientDate } from "@/components/ClientDate";

const AnimatedCar = dynamic(() => import("@/components/AnimatedCar").then(mod => mod.AnimatedCar), { ssr: false });

function Counter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value <= 0) { setCount(0); return; }
    let current = 0;
    const end = value;
    const totalDuration = 1000;
    const step = Math.max(1, Math.floor(end / 60));
    const incrementTime = totalDuration / (end / step);

    const timer = setInterval(() => {
      current += step;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}</span>;
}

export default function Dashboard() {
  const { incomingList, orders, inventory } = useStore();

  const totalInventory = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const lowStock = inventory.filter(item => item.quantity < 50).length;
  const incomingToday = incomingList.filter(i => i.status !== 'IN_GARAGE').length;
  const ordersPending = orders.filter(o => o.status !== 'DELIVERED').length;

  const statCards = [
    { title: "Total Inventory", value: totalInventory, icon: Package, color: "border-indigo-500 bg-indigo-50/10", iconColor: "text-indigo-600", href: "/inventory" },
    { title: "Incoming Vehicles", value: incomingToday, icon: Truck, color: "border-rose-500 bg-rose-50/10", iconColor: "text-rose-600", href: "/incoming" },
    { title: "Pending Orders", value: ordersPending, icon: ShoppingCart, color: "border-cyan-500 bg-cyan-50/10", iconColor: "text-cyan-600", href: "/orders" },
    { title: "Low Stock Alerts", value: lowStock, icon: AlertTriangle, color: "border-amber-500 bg-amber-50/10", iconColor: "text-amber-600", href: "/inventory" },
  ];

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Hero Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter outfit uppercase italic">
            Fleet <span className="text-rose-500">Intelligence</span>
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 dark:text-zinc-600 mt-1 font-black uppercase tracking-[0.2em] flex items-center gap-2 text-[10px]">
             Live Operations <span className="text-rose-500 animate-pulse">●</span> <ClientDate format="time" />
          </p>
        </div>
        <div className="saas-card px-5 py-3 flex items-center gap-3 border-l-4 border-l-rose-500 rounded-none shadow-xl">
          <div className="flex -space-x-1">
             {[1,2,3].map(i => (
               <div key={i} className={`w-8 h-8 rounded-none border border-white dark:border-zinc-800 bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-black shadow-lg`}>
                 {['A', 'M', 'B'][i-1]}
               </div>
             ))}
          </div>
          <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">3 Active Nodes</p>
        </div>
      </div>

      {/* Main Simulation Window */}
      <div className="h-[400px] md:h-96 rounded-none overflow-hidden relative group saas-card p-0 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="absolute inset-0 bg-slate-900 z-0" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.1] z-0" />
        
        {/* Animated 3D Component */}
        <div className="absolute inset-0 z-0 scale-110 grayscale-[0.2] brightness-75">
          <AnimatedCar type="loop" />
        </div>

        <div className="absolute top-6 left-6 z-10">
           <div className="bg-rose-600 text-white px-3 py-1 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg">LIVE SIMULATION</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Link href={stat.href} key={stat.title}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 saas-card group cursor-pointer h-full flex flex-col justify-between hover:-translate-y-2 border-2 ${stat.color} transition-all duration-300 rounded-none shadow-xl`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-slate-800 rounded-none group-hover:bg-slate-950 group-hover:text-white transition-all shadow-md`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                   <div className="w-1.5 h-1.5 bg-rose-500" />
                   <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Updated Now</span>
                </div>
              </div>
              
              <div>
                <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter outfit mb-1">
                  <Counter value={stat.value} />
                </div>
                <h3 className="text-slate-400 dark:text-zinc-500 font-black text-[10px] uppercase tracking-widest group-hover:text-rose-500 transition-colors">{stat.title}</h3>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 saas-card flex flex-col bg-white dark:bg-black border-2 border-indigo-500/10 rounded-none shadow-2xl">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 outfit uppercase tracking-tight italic">
              <div className="w-2 h-6 bg-indigo-500" /> Inventory Alerts
            </h3>
            <Link href="/inventory" className="text-[10px] bg-indigo-600 text-white px-3 py-1 font-black uppercase tracking-widest hover:bg-rose-500 transition-colors shadow-lg shadow-indigo-500/20">MANAGE ALL</Link>
          </div>
          
          <div className="space-y-3 flex-1 text-zinc-600">
            {inventory.slice(0, 5).map((item, idx) => (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + idx * 0.1 }} key={item.id}>
                <Link href="/inventory">
                  <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer group border-b border-slate-50 dark:border-slate-800 last:border-none">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 flex items-center justify-center font-black rounded-none border ${item.quantity < 50 ? 'border-rose-500 text-rose-500 bg-rose-50' : 'border-slate-200 text-slate-400'}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-tight group-hover:text-rose-500 transition-colors">{item.itemName}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Asset Ref #{item.id.slice(0, 4)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className={`text-xl font-black outfit ${item.quantity < 50 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100'}`}>{item.quantity}</span>
                       <span className="text-[8px] text-slate-400 uppercase tracking-[0.2em] font-black">UNITS</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="p-8 saas-card flex flex-col bg-white dark:bg-black border-2 border-rose-500/10 rounded-none shadow-2xl">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 outfit uppercase tracking-tight italic">
              <div className="w-2 h-6 bg-rose-500" /> Active Shipments
            </h3>
            <Link href="/incoming" className="text-[10px] bg-rose-600 text-white px-3 py-1 font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-lg shadow-rose-500/20">LIVE OPS</Link>
          </div>
          
          <div className="space-y-4 flex-1">
            {incomingList.slice(0, 4).map((item, idx) => (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + idx * 0.1 }} key={item.id}>
                <Link href="/incoming">
                  <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-12 h-12 rounded-none bg-slate-900 text-white flex items-center justify-center flex-shrink-0 group-hover:bg-rose-600 transition-colors shadow-lg">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-tight italic">SHIPMENT ID: {item.carNumber}</p>
                        <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-widest border border-slate-200 dark:border-slate-800">{item.status.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-zinc-900 h-1.5 overflow-hidden">
                         <motion.div 
                           className="h-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" 
                           initial={{ width: 0 }} 
                           animate={{ width: item.status === 'ON_THE_WAY' ? '60%' : item.status === 'AT_BRIDGE' ? '90%' : '100%' }}
                           transition={{ duration: 0.8 }}
                         />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

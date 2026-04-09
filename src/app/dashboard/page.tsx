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
    { title: "Total Inventory", value: totalInventory, icon: Package, color: "from-blue-500 to-blue-900", href: "/inventory" },
    { title: "Incoming Vehicles", value: incomingToday, icon: Truck, color: "from-[#00d1ff] to-orange-900", href: "/incoming" },
    { title: "Pending Orders", value: ordersPending, icon: ShoppingCart, color: "from-purple-500 to-purple-900", href: "/orders" },
    { title: "Low Stock Alerts", value: lowStock, icon: AlertTriangle, color: "from-red-500 to-red-900", href: "/inventory" },
  ];

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto">
      <div className="h-72 rounded-[2.5rem] glass overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-8 left-10 z-20 transition-transform group-hover:translate-x-2">
          <h2 className="text-4xl font-black text-white italic tracking-tighter glow-text">GARAGE SIMULATION</h2>
          <p className="text-gray-400 mt-2 font-medium tracking-wide">SYSTEM OPERATIONAL // REAL-TIME LOGISTICS DATA</p>
        </div>
        <AnimatedCar type="loop" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Link href={stat.href} key={stat.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-2xl glass border-t border-white/10 glow-hover relative overflow-hidden group cursor-pointer h-full`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
              
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-8 h-8 text-white/70 group-hover:text-white transition-colors" />
                <div className={`w-12 h-1 bg-gradient-to-r ${stat.color} rounded`} />
              </div>
              
              <h3 className="text-gray-400 font-medium mb-1 group-hover:text-gray-200 transition-colors">{stat.title}</h3>
              <div className="text-4xl font-bold text-white tracking-tight">
                <Counter value={stat.value} />
              </div>
              
              <div className="absolute bottom-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-gray-400">
                View Details <span>→</span>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl glass">
          <h3 className="text-xl font-semibold mb-4">Recent Inventory</h3>
          <div className="space-y-4">
            {inventory.slice(0, 5).map((item) => (
              <Link href="/inventory" key={item.id}>
                <div className="flex justify-between items-center p-4 bg-[#ffffff05] hover:bg-[#ffffff10] rounded-xl border border-white/5 transition-all cursor-pointer group">
                  <div>
                    <p className="font-medium group-hover:text-[#00d1ff] transition-colors">{item.itemName}</p>
                    <p className="text-xs text-gray-500">Updated: <ClientDate date={item.updatedAt} format="time" /></p>
                  </div>
                  <div className={`font-bold ${item.quantity < 50 ? 'text-red-400' : 'text-green-400'}`}>
                    {item.quantity} units
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl glass">
          <h3 className="text-xl font-semibold mb-4">Active Movements</h3>
          <div className="space-y-4">
            {incomingList.slice(0, 3).map((item) => (
              <Link href="/incoming" key={item.id}>
                <div className="flex gap-4 p-4 bg-[#ffffff05] hover:bg-[#ffffff10] rounded-xl border border-white/5 transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Truck className="w-5 h-5 text-[#00d1ff]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm group-hover:text-[#00d1ff] transition-colors">Incoming: Car {item.carNumber}</p>
                    <p className="text-xs text-gray-400">{item.supplierName} - {item.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

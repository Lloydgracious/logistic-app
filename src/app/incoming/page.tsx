"use client";

import { useStore, IncomingStatus } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowRight, Truck, Trash, Calendar, Timer } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";
import { getWaitingDays } from "@/lib/utils";

const AnimatedCar = dynamic(() => import("@/components/AnimatedCar").then(mod => mod.AnimatedCar), { ssr: false });

const statusConfig: Record<IncomingStatus, { label: string; color: string; progress: number }> = {
  ON_THE_WAY: { label: "On the way", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", progress: 33 },
  AT_BRIDGE: { label: "At Bridge", color: "text-orange-400 bg-orange-400/10 border-orange-400/20", progress: 66 },
  IN_GARAGE: { label: "In Garage", color: "text-green-400 bg-green-400/10 border-green-400/20", progress: 100 },
};

function StatusBadge({ status }: { status: IncomingStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color} whitespace-nowrap`}>
      {config.label}
    </span>
  );
}

export default function IncomingPage() {
  const { incomingList, updateIncomingStatus, addIncoming } = useStore();
  const [showAdd, setShowAdd] = useState(false);

  const [newCarNumber, setNewCarNumber] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [newArrivalDate, setNewArrivalDate] = useState("");
  const [newDuration, setNewDuration] = useState("24");
  const [items, setItems] = useState([{ name: "", quantity: "" }]);

  const addItemRow = () => setItems([...items, { name: "", quantity: "" }]);
  const removeItemRow = (idx: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };
  const updateItemRow = (idx: number, field: 'name' | 'quantity', val: string) => {
    const updated = [...items];
    updated[idx][field] = val;
    setItems(updated);
  };

  const handleAdd = () => {
    if (!newCarNumber || !newSupplier || items.some(i => !i.name || !i.quantity)) return;
    
    addIncoming({
      carNumber: newCarNumber,
      supplierName: newSupplier,
      items: items.map(i => ({ name: i.name, quantity: parseInt(i.quantity) || 0 })),
      arrivalTime: newArrivalDate ? new Date(newArrivalDate).toISOString() : undefined,
      durationHours: parseInt(newDuration) || 24
    });
    
    setShowAdd(false);
    setNewCarNumber("");
    setNewSupplier("");
    setNewArrivalDate("");
    setNewDuration("24");
    setItems([{ name: "", quantity: "" }]);
  };

  const handleNextStatus = (id: string, current: IncomingStatus) => {
    if (current === 'ON_THE_WAY') updateIncomingStatus(id, 'AT_BRIDGE');
    else if (current === 'AT_BRIDGE') updateIncomingStatus(id, 'IN_GARAGE');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Incoming Shipments</h2>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#00d1ff] hover:bg-[#ff8c40] text-white px-4 py-2 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(255,106,0,0.4)]"
        >
          <Plus className="w-5 h-5" /> Add Incoming
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-6 border border-[#00d1ff]/30"
          >
            <h3 className="text-lg font-semibold mb-4">New Shipment</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-bold px-1">Car Identification</label>
                <input value={newCarNumber} onChange={e=>setNewCarNumber(e.target.value)} placeholder="Car Number" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00d1ff]" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-bold px-1">Supplier / Origin</label>
                <input value={newSupplier} onChange={e=>setNewSupplier(e.target.value)} placeholder="Supplier Name" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00d1ff]" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-bold px-1 flex items-center gap-1">Process Start <Calendar className="w-3 h-3" /></label>
                <input value={newArrivalDate} type="date" onChange={e=>setNewArrivalDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00d1ff] [color-scheme:dark]" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-bold px-1 flex items-center gap-1">Duration (Hours) <Timer className="w-3 h-3" /></label>
                <input value={newDuration} type="number" onChange={e=>setNewDuration(e.target.value)} placeholder="24" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00d1ff]" />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs text-gray-400 font-bold uppercase">Shipment Cargo / Items</label>
                <button onClick={addItemRow} className="text-[#00d1ff] text-xs hover:underline flex items-center gap-1 font-bold">
                  + Add Item Row
                </button>
              </div>
              {items.map((it, idx) => (
                <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                  <input value={it.name} onChange={e=>updateItemRow(idx, 'name', e.target.value)} placeholder="Item Name" className="flex-1 bg-black/30 border border-white/5 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-white/20" />
                  <input value={it.quantity} type="number" onChange={e=>updateItemRow(idx, 'quantity', e.target.value)} placeholder="Qty" className="w-24 bg-black/30 border border-white/5 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-white/20" />
                  <button onClick={() => removeItemRow(idx)} disabled={items.length === 1} className="p-2 text-gray-600 hover:text-red-400 disabled:opacity-0 transition-colors">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition font-medium text-sm">Cancel</button>
              <button onClick={handleAdd} className="px-5 py-2 rounded-xl bg-[#00d1ff] hover:bg-orange-600 transition shadow-[0_0_10px_rgba(255,106,0,0.5)] font-bold text-sm">Save Shipment</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {incomingList.map((item) => (
          <motion.div 
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-white/5 glow-hover"
          >
            <div className="flex flex-col md:flex-row justify-between gap-6">
              
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{item.carNumber}</h3>
                    <p className="text-sm text-gray-400">{item.supplierName}</p>
                  </div>
                  <div className="ml-auto flex flex-col items-end gap-2">
                    <StatusBadge status={item.status} />
                    {item.status !== 'IN_GARAGE' && (() => {
                        const startMs = new Date(item.arrivalTime).getTime();
                        const etaMs = startMs + item.durationHours * 60 * 60 * 1000;
                        const remainingMs = etaMs - Date.now();
                        const remainingHrs = Math.abs(Math.round(remainingMs / (1000 * 60 * 60)));
                        const remainingDays = Math.floor(Math.abs(remainingMs) / (1000 * 60 * 60 * 24));
                        const isOverdue = remainingMs < 0;
                        const elapsed = Math.max(0, Date.now() - startMs);
                        const elapsedDays = Math.floor(elapsed / (1000 * 60 * 60 * 24));
                        return (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${isOverdue ? 'text-red-400 border-red-400/20 bg-red-400/5' : remainingHrs < 6 ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5' : 'text-blue-400 border-blue-400/20 bg-blue-400/5'}`}>
                            {isOverdue 
                              ? `Overdue by ${remainingDays > 0 ? remainingDays + 'd ' : ''}${remainingHrs % 24}h` 
                              : `ETA in ${remainingDays > 0 ? remainingDays + 'd ' : ''}${remainingHrs % 24}h`}
                            {elapsedDays > 0 && <span className="ml-1 opacity-60">· {elapsedDays}d waiting</span>}
                          </span>
                        );
                      })()}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Items Included:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.items.map((i, idx) => (
                      <div key={idx} className="px-3 py-1 bg-black/40 rounded-lg text-sm">
                        <span className="text-gray-400">{i.name}:</span> <span className="font-bold">{i.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 via-[#00d1ff] to-green-500"
                    initial={{ width: `${item.status === 'IN_GARAGE' ? 100 : Math.round((Date.now() - new Date(item.arrivalTime).getTime()) / (item.durationHours * 60 * 60 * 10))}%` }}
                    animate={{ width: `${item.status === 'IN_GARAGE' ? 100 : Math.min(100, Math.round(((Date.now() - new Date(item.arrivalTime).getTime()) / (item.durationHours * 60 * 60 * 1000)) * 100))}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </div>
              </div>

              <div className="w-full md:w-64 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/10 md:pl-6 pt-4 md:pt-0">
                <div className="h-32 rounded-xl overflow-hidden glass relative">
                   <AnimatedCar 
                    type={item.status === 'IN_GARAGE' ? 'depart' : 'arrive'} 
                    progress={item.status === 'IN_GARAGE' ? 1.0 : Math.min(0.9, (Date.now() - new Date(item.arrivalTime).getTime()) / (item.durationHours * 60 * 60 * 1000))} 
                    waitingDays={getWaitingDays(item.arrivalTime)}
                   />
                </div>
                {item.status !== 'IN_GARAGE' && (
                  <button 
                    onClick={() => handleNextStatus(item.id, item.status)}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    Progress Status <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

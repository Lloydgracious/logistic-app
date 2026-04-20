"use client";

import { useStore, IncomingStatus } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowRight, Truck, Trash } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";
import { getWaitingDays } from "@/lib/utils";

const AnimatedCar = dynamic(() => import("@/components/AnimatedCar").then(mod => mod.AnimatedCar), { ssr: false });

const statusConfig: Record<IncomingStatus, { label: string; color: string; progress: number }> = {
  ON_THE_WAY: { label: "On the way", color: "text-blue-600 bg-blue-50 border-blue-200", progress: 33 },
  AT_BRIDGE: { label: "At Bridge", color: "text-orange-600 bg-orange-50 border-orange-200", progress: 66 },
  IN_GARAGE: { label: "In Garage", color: "text-green-600 bg-green-50 border-green-200", progress: 100 },
};

function StatusBadge({ status }: { status: IncomingStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.color} whitespace-nowrap shadow-sm`}>
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
  const [newNote, setNewNote] = useState("");
  const [items, setItems] = useState([{ name: "", quantity: "", unit: "" }]);

  const addItemRow = () => setItems([...items, { name: "", quantity: "", unit: "" }]);
  const removeItemRow = (idx: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };
  const updateItemRow = (idx: number, field: 'name' | 'quantity' | 'unit', val: string) => {
    const updated = [...items];
    if (field === 'quantity') {
      updated[idx].quantity = val;
    } else if (field === 'name') {
      updated[idx].name = val;
    } else if (field === 'unit') {
      updated[idx].unit = val;
    }
    setItems(updated);
  };

  const handleAdd = () => {
    if (!newCarNumber || !newSupplier || items.some(i => !i.name || !i.quantity)) return;
    
    addIncoming({
      carNumber: newCarNumber,
      supplierName: newSupplier,
      items: items.map(i => ({ 
        name: i.name, 
        quantity: parseInt(i.quantity) || 0,
        unit: i.unit 
      })),
      arrivalTime: newArrivalDate ? new Date(newArrivalDate).toISOString() : undefined,
      durationHours: parseInt(newDuration) || 24,
      note: newNote
    });
    
    setShowAdd(false);
    setNewCarNumber("");
    setNewSupplier("");
    setNewArrivalDate("");
    setNewDuration("24");
    setNewNote("");
    setItems([{ name: "", quantity: "", unit: "" }]);
  };

  const handleNextStatus = (id: string, current: IncomingStatus) => {
    if (current === 'ON_THE_WAY') updateIncomingStatus(id, 'AT_BRIDGE');
    else if (current === 'AT_BRIDGE') updateIncomingStatus(id, 'IN_GARAGE');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter outfit uppercase">Incoming <span className="text-rose-500 italic">Fleet</span></h2>
           <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] mt-1">Live shipment tracking & arrival manifesting.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-slate-950 dark:bg-white text-white dark:text-black px-6 py-3 rounded-none font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white"
        >
          <Plus className={`w-4 h-4 transition-transform ${showAdd ? 'rotate-45' : ''}`} /> {showAdd ? 'Close' : 'Add Shipment'}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
             <div className="saas-card p-6 border-2 border-indigo-500/20 bg-indigo-50/10 mb-6 rounded-none">
               <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 italic mb-6">New Shipment Protocol</h3>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider">Car Number</label>
                   <input value={newCarNumber} onChange={e=>setNewCarNumber(e.target.value)} placeholder="ABC-123" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium italic" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider">Supplier</label>
                   <input value={newSupplier} onChange={e=>setNewSupplier(e.target.value)} placeholder="Origin / Supplier" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider flex items-center gap-1">Start Date</label>
                   <input value={newArrivalDate} type="date" onChange={e=>setNewArrivalDate(e.target.value)} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none transition-all font-medium" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider flex items-center gap-1">Hours</label>
                   <input value={newDuration} type="number" onChange={e=>setNewDuration(e.target.value)} placeholder="24" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none transition-all font-medium" />
                 </div>
               </div>

               <div className="space-y-1.5 mb-6">
                 <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider">Additional Notes</label>
                 <textarea 
                   value={newNote} 
                   onChange={e=>setNewNote(e.target.value)} 
                   placeholder="Special instructions, gate pass details, etc..." 
                   className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium h-20 resize-none"
                 />
               </div>

               <div className="bg-white dark:bg-black/40 rounded-none border border-slate-200 dark:border-slate-800 p-5 mb-8">
                 <div className="flex justify-between items-center mb-4">
                   <label className="text-[10px] text-slate-800 dark:text-slate-100 font-black uppercase tracking-widest">Expected Cargo</label>
                   <button onClick={addItemRow} className="text-indigo-500 text-[10px] hover:underline transition-colors flex items-center gap-1 font-black uppercase tracking-wider">
                     + Add Item Row
                   </button>
                 </div>
                 <div className="space-y-3">
                   {items.map((it, idx) => (
                     <div key={idx} className="flex gap-3 items-center group">
                       <input value={it.name} onChange={e=>updateItemRow(idx, 'name', e.target.value)} placeholder="Item Name" className="flex-1 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-slate-800 rounded-none px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-indigo-500 transition-all" />
                       <input value={it.quantity} type="number" onChange={e=>updateItemRow(idx, 'quantity', e.target.value)} placeholder="Qty" className="w-24 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-slate-800 rounded-none px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-indigo-500 transition-all" />
                       <input value={it.unit} onChange={e=>updateItemRow(idx, 'unit', e.target.value)} placeholder="Unit" className="w-28 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-slate-800 rounded-none px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-indigo-500 transition-all" />
                       <button onClick={() => removeItemRow(idx)} disabled={items.length === 1} className="p-2 text-slate-300 hover:text-red-500 disabled:opacity-0 transition-all">
                         <Trash className="w-4 h-4" />
                       </button>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="flex justify-end gap-3 pt-2">
                 <button onClick={() => setShowAdd(false)} className="px-6 py-3 rounded-none text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all font-bold text-xs uppercase tracking-widest">Cancel</button>
                 <button onClick={handleAdd} className="px-8 py-3 rounded-none bg-slate-950 dark:bg-white text-white dark:text-black hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all shadow-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2">Save Shipment <ArrowRight className="w-4 h-4" /></button>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {incomingList.map((item) => (
          <motion.div 
            key={item.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="saas-card p-0 rounded-none border-l-4 border-l-rose-500 overflow-hidden"
          >
            <div className="flex flex-col md:flex-row justify-between gap-0">
              
              <div className="flex-1 p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-none bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center border border-rose-100 dark:border-rose-800">
                    <Truck className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 outfit uppercase tracking-tight italic">{item.carNumber}</h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">{item.supplierName}</p>
                    {item.note && (
                      <div className="mt-2 text-xs bg-cyan-50 dark:bg-cyan-900/10 text-cyan-700 dark:text-cyan-400 p-2 rounded-none border border-cyan-100 dark:border-cyan-900/30 italic font-medium">
                        &quot; {item.note} &quot;
                      </div>
                    )}
                  </div>
                  <div className="ml-auto flex flex-col items-end gap-2">
                    <StatusBadge status={item.status} />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 mb-2 uppercase tracking-[0.2em]">Expected Cargo</p>
                  <div className="flex flex-wrap gap-2">
                    {item.items.map((i, idx) => (
                      <div key={idx} className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-none text-xs shadow-sm cursor-default group">
                        <span className="text-slate-500 dark:text-zinc-500 font-medium uppercase">{i.name}:</span> <span className="font-black text-rose-600 dark:text-rose-400 text-sm ml-1">{i.quantity}</span> <span className="text-[9px] text-slate-400 uppercase font-black ml-1">{i.unit || 'UNITS'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-zinc-900 h-1.5 rounded-none overflow-hidden">
                  <motion.div 
                    className="h-full bg-rose-500"
                    initial={{ width: `${item.status === 'IN_GARAGE' ? 100 : Math.round((Date.now() - new Date(item.arrivalTime).getTime()) / (item.durationHours * 60 * 60 * 10))}%` }}
                    animate={{ width: `${item.status === 'IN_GARAGE' ? 100 : Math.min(100, Math.round(((Date.now() - new Date(item.arrivalTime).getTime()) / (item.durationHours * 60 * 60 * 1000)) * 100))}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </div>
              </div>

              <div className="w-full md:w-64 flex flex-col gap-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800">
                <div className="h-full min-h-[140px] relative shadow-inner bg-slate-50 dark:bg-zinc-900 flex items-center justify-center">
                   <div className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay z-0 pointer-events-none" />
                   <AnimatedCar 
                    type={item.status === 'IN_GARAGE' ? 'depart' : 'arrive'} 
                    progress={item.status === 'IN_GARAGE' ? 1.0 : Math.min(0.9, (Date.now() - new Date(item.arrivalTime).getTime()) / (item.durationHours * 60 * 60 * 1000))} 
                    waitingDays={getWaitingDays(item.arrivalTime)}
                   />
                </div>
                {item.status !== 'IN_GARAGE' && (
                  <button 
                    onClick={() => handleNextStatus(item.id, item.status)}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-[10px]"
                  >
                    Transition <ArrowRight className="w-4 h-4" />
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

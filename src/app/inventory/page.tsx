"use client";

import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Package, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function InventoryPage() {
  const { inventory, updateInventoryManual } = useStore();
  const [showAdd, setShowAdd] = useState(false);

  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [itemUnit, setItemUnit] = useState("");
  const [itemNote, setItemNote] = useState("");

  const handleAdd = () => {
    if (!itemName || !itemQty) return;
    const qty = parseInt(itemQty);
    if (!isNaN(qty)) {
      updateInventoryManual(itemName, qty, qty, itemUnit);
    }
    setShowAdd(false);
    setItemName("");
    setItemQty("");
    setItemUnit("");
    setItemNote("");
  };

  const handleAdjust = (name: string, currentQty: number, difference: number) => {
    const newQty = Math.max(0, currentQty + difference);
    updateInventoryManual(name, newQty, difference);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter outfit uppercase">Warehouse <span className="text-cyan-500 italic">Core</span></h2>
           <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] mt-1">Real-time stock auditing & manual asset entry.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-slate-950 dark:bg-white text-white dark:text-black px-6 py-3 rounded-none font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:bg-cyan-600 dark:hover:bg-cyan-500 hover:text-white"
        >
          <Plus className={`w-4 h-4 transition-transform ${showAdd ? 'rotate-45' : ''}`} /> {showAdd ? 'Close' : 'Add Asset'}
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
            <div className="saas-card p-6 border-2 border-cyan-500/20 bg-cyan-50/10 mb-6 rounded-none">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 italic mb-6">Manual Inventory Protocol</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                 <div className="space-y-1.5 md:col-span-2">
                   <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider">Item Name</label>
                   <input value={itemName} onChange={e=>setItemName(e.target.value)} placeholder="E.g., Brake Pads" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider">Initial Qty</label>
                   <input value={itemQty} onChange={e=>setItemQty(e.target.value)} placeholder="0" type="number" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-cyan-500 transition-all font-medium" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider">Unit System</label>
                   <input value={itemUnit} onChange={e=>setItemUnit(e.target.value)} placeholder="Kg, Pcs, etc." className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-cyan-500 transition-all font-medium" />
                 </div>
              </div>
              <div className="space-y-1.5 mb-6">
                 <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider">Customer / Source Note</label>
                 <textarea 
                   value={itemNote} 
                   onChange={e=>setItemNote(e.target.value)} 
                   placeholder="Note from customer or supplier..." 
                   className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium h-20 resize-none"
                 />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                 <button onClick={() => setShowAdd(false)} className="px-6 py-2.5 rounded-none text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all font-black text-[10px] uppercase tracking-widest">Cancel</button>
                 <button onClick={handleAdd} className="px-8 py-2.5 rounded-none bg-slate-950 dark:bg-white text-white dark:text-black transition-all shadow-lg hover:bg-cyan-600 dark:hover:bg-cyan-500 hover:text-white font-black text-[10px] uppercase tracking-widest">Save Asset</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="saas-card overflow-hidden rounded-none border-t-4 border-t-cyan-500 shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-6 py-5">Item Name</th>
              <th className="px-6 py-5">Quantity</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {inventory.map((item) => {
              const isLow = item.quantity < 50;
              return (
                <motion.tr 
                  key={item.id}
                  layout
                  className="hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors group"
                >
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-none bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-slate-800 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                        <Package className="w-5 h-5" />
                      </div>
                      <span className="font-black text-slate-800 dark:text-slate-100 outfit uppercase tracking-tight">{item.itemName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <motion.span 
                      key={item.quantity}
                      initial={{ scale: 1.2, color: '#06b6d4' }}
                      animate={{ scale: 1, color: isLow ? '#ef4444' : '#0891b2' }}
                      className="text-2xl font-black block outfit"
                    >
                      {item.quantity} <span className="text-[9px] text-slate-400 dark:text-zinc-600 uppercase font-black ml-1">{item.unit || 'UNITS'}</span>
                    </motion.span>
                  </td>
                  <td className="px-6 py-6">
                    {isLow ? (
                       <span className="flex items-center gap-1.5 text-rose-600 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 px-3 py-1 rounded-none w-max text-[10px] font-black uppercase tracking-widest">
                         <AlertCircle className="w-3.5 h-3.5" /> Low Stock
                       </span>
                    ) : (
                       <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 px-3 py-1 rounded-none w-max text-[10px] font-black uppercase tracking-widest">
                         Optimal
                       </span>
                    )}
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                       <button onClick={() => handleAdjust(item.itemName, item.quantity, -10)} className="w-10 h-10 rounded-none bg-white dark:bg-zinc-900 hover:bg-rose-500 hover:text-white flex items-center justify-center transition text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-slate-800 font-black shadow-sm">−</button>
                       <button onClick={() => handleAdjust(item.itemName, item.quantity, +10)} className="w-10 h-10 rounded-none bg-white dark:bg-zinc-900 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-slate-800 font-black shadow-sm">+</button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

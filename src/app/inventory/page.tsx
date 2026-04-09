"use client";

import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Package, AlertCircle } from "lucide-react";
import { useState } from "react";
import { ClientDate } from "@/components/ClientDate";

export default function InventoryPage() {
  const { inventory, updateInventoryManual } = useStore();
  const [showAdd, setShowAdd] = useState(false);

  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("");

  const handleAdd = () => {
    if (!itemName || !itemQty) return;
    const qty = parseInt(itemQty);
    if (!isNaN(qty)) {
      updateInventoryManual(itemName, qty, qty);
    }
    setShowAdd(false);
    setItemName("");
    setItemQty("");
  };

  const handleAdjust = (name: string, currentQty: number, difference: number) => {
    const newQty = Math.max(0, currentQty + difference);
    updateInventoryManual(name, newQty, difference);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#00d1ff] hover:bg-cyan-400 text-black px-4 py-2 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(0,209,255,0.4)]"
        >
          <Plus className="w-5 h-5" /> Add Item
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
            <h3 className="text-lg font-semibold mb-4">Add Manual Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <input value={itemName} onChange={e=>setItemName(e.target.value)} placeholder="Item Name" className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00d1ff]" />
              <input value={itemQty} onChange={e=>setItemQty(e.target.value)} placeholder="Quantity" type="number" className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00d1ff]" />
            </div>
            <div className="flex justify-end gap-3 mt-4 max-w-2xl">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition font-bold">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 rounded-xl bg-[#00d1ff] hover:bg-cyan-400 text-black font-bold transition shadow-[0_0_15px_rgba(0,209,255,0.4)]">Save Item</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <table className="w-full text-left">
          <thead className="bg-black/40 text-gray-400 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">Item Name</th>
              <th className="px-6 py-4 font-medium">Quantity</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Last Updated</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {inventory.map((item) => {
              const isLow = item.quantity < 50;
              return (
                <motion.tr 
                  key={item.id}
                  layout
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <span className="font-semibold text-white">{item.itemName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <motion.span 
                      key={item.quantity}
                      initial={{ scale: 1.5, color: '#00d1ff' }}
                      animate={{ scale: 1, color: isLow ? '#f43f5e' : '#ffffff' }}
                      className="text-xl font-bold block"
                    >
                      {item.quantity}
                    </motion.span>
                  </td>
                  <td className="px-6 py-4">
                    {isLow ? (
                       <span className="flex items-center gap-1.5 text-red-400 bg-red-400/10 px-2 py-1 rounded w-max text-xs font-medium">
                         <AlertCircle className="w-3.5 h-3.5" /> Low Stock
                       </span>
                    ) : (
                       <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded w-max text-xs font-medium">
                         In Stock
                       </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    <ClientDate date={item.updatedAt} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => handleAdjust(item.itemName, item.quantity, -10)} className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-white font-bold">−</button>
                       <button onClick={() => handleAdjust(item.itemName, item.quantity, +10)} className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-white font-bold">+</button>
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

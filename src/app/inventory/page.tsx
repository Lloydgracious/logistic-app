"use client";

import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Package, AlertCircle, Search, Truck } from "lucide-react";
import { useState } from "react";

export default function InventoryPage() {
  const { inventory, inventorySections, containerStock, addInventorySection, updateInventoryManual } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [newHeaderTitle, setNewHeaderTitle] = useState("");
  const [itemSectionId, setItemSectionId] = useState(inventorySections[0]?.id || "");
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [itemUnit, setItemUnit] = useState("");
  const [containerNumber, setContainerNumber] = useState("");

  const filteredInventory = inventory.filter((item) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.inventorySectionTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContainerStock = containerStock.filter((row) =>
    row.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.containerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.carNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.inventorySectionTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedSections = inventorySections
    .map((section) => {
      const titleMatchesSearch = section.title.toLowerCase().includes(searchTerm.toLowerCase());
      const sectionInventory = filteredInventory.filter((item) => item.inventorySectionId === section.id);
      const sectionStock = filteredContainerStock.filter((row) => row.inventorySectionId === section.id);

      return {
        ...section,
        inventory: titleMatchesSearch ? inventory.filter((item) => item.inventorySectionId === section.id) : sectionInventory,
        stock: titleMatchesSearch ? containerStock.filter((row) => row.inventorySectionId === section.id) : sectionStock,
        titleMatchesSearch,
      };
    })
    .filter((section) => !searchTerm || section.titleMatchesSearch || section.inventory.length > 0 || section.stock.length > 0);

  const handleAddHeader = () => {
    const trimmedTitle = newHeaderTitle.trim();
    if (!trimmedTitle) return;
    addInventorySection(trimmedTitle);
    setNewHeaderTitle("");
  };

  const handleAdd = () => {
    if (!itemSectionId || !itemName || !itemQty) return;
    const qty = parseInt(itemQty);
    if (!isNaN(qty)) {
      updateInventoryManual(itemName, qty, qty, itemUnit, containerNumber, itemSectionId);
    }
    setShowAdd(false);
    setItemName("");
    setItemQty("");
    setItemUnit("");
    setContainerNumber("");
  };

  const handleAdjust = (rowId: string, difference: number) => {
    const row = containerStock.find((stockRow) => stockRow.id === rowId);
    if (!row) return;
    const newQty = Math.max(0, row.remainingQuantity + difference);
    updateInventoryManual(row.productName, newQty, difference, row.unit, row.containerNumber, row.inventorySectionId);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
           <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter outfit uppercase">Inventory <span className="text-cyan-500 italic">Headers</span></h2>
           <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] mt-1">Create headings, then keep products and container numbers under the right one.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product, container, car..."
              className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none pl-10 pr-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
            />
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center justify-center gap-2 bg-slate-950 dark:bg-white text-white dark:text-black px-6 py-3 rounded-none font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:bg-cyan-600 dark:hover:bg-cyan-500 hover:text-white"
          >
            <Plus className={`w-4 h-4 transition-transform ${showAdd ? 'rotate-45' : ''}`} /> {showAdd ? 'Close' : 'Add Product'}
          </button>
        </div>
      </div>

      <div className="saas-card p-5 rounded-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-black">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider">Custom Header</label>
            <input
              value={newHeaderTitle}
              onChange={(e) => setNewHeaderTitle(e.target.value)}
              placeholder="Add inventory title, e.g. Oils, Tires, Body Parts"
              className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
            />
          </div>
          <button
            onClick={handleAddHeader}
            className="px-6 py-3 rounded-none bg-cyan-600 text-white hover:bg-slate-950 dark:hover:bg-white dark:hover:text-black transition-all shadow-lg font-black text-[10px] uppercase tracking-widest"
          >
            Add Header
          </button>
        </div>
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
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 italic mb-6">Add Product Under Header</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider">Header</label>
                   <select
                    value={itemSectionId}
                    onChange={e=>setItemSectionId(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-black uppercase"
                   >
                    <option value="">Choose header</option>
                    {inventorySections.map((section) => (
                      <option key={section.id} value={section.id}>{section.title}</option>
                    ))}
                   </select>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider">Container</label>
                   <input value={containerNumber} onChange={e=>setContainerNumber(e.target.value)} placeholder="Optional" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider">Product Name</label>
                   <input value={itemName} onChange={e=>setItemName(e.target.value)} placeholder="E.g., Brake Pads" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider">Quantity Left</label>
                   <input value={itemQty} onChange={e=>setItemQty(e.target.value)} placeholder="0" type="number" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-cyan-500 transition-all font-medium" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-wider">Unit</label>
                   <input value={itemUnit} onChange={e=>setItemUnit(e.target.value)} placeholder="Kg, Pcs, etc." className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-cyan-500 transition-all font-medium" />
                 </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                 <button onClick={() => setShowAdd(false)} className="px-6 py-2.5 rounded-none text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all font-black text-[10px] uppercase tracking-widest">Cancel</button>
                 <button onClick={handleAdd} className="px-8 py-2.5 rounded-none bg-slate-950 dark:bg-white text-white dark:text-black transition-all shadow-lg hover:bg-cyan-600 dark:hover:bg-cyan-500 hover:text-white font-black text-[10px] uppercase tracking-widest">Save Stock</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {groupedSections.map((section) => (
          <motion.section
            key={section.id}
            layout
            className="saas-card p-0 rounded-none border-2 border-slate-900 dark:border-zinc-800 shadow-2xl bg-white dark:bg-black overflow-hidden relative"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 border-b-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-zinc-950">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight outfit italic">{section.title}</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.25em] font-black mt-1">{section.stock.length} container rows / {section.inventory.length} products</p>
              </div>
            </div>

            {section.inventory.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 border-b border-slate-100 dark:border-slate-800">
                {section.inventory.map((item) => {
                  const isLow = item.quantity < 50;
                  return (
                    <motion.div key={item.id} layout className="border border-slate-200 dark:border-slate-800 p-4 rounded-none bg-white dark:bg-black">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-none bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                            <Package className="w-5 h-5 text-cyan-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 dark:text-slate-100 outfit uppercase tracking-tight truncate">{item.itemName}</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Total in this header</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-2xl font-black outfit ${isLow ? "text-rose-500" : "text-cyan-600"}`}>{item.quantity}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-black">{item.unit || "UNITS"}</p>
                        </div>
                      </div>
                      {isLow && (
                        <div className="mt-4 flex items-center gap-1.5 text-rose-600 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 px-3 py-1 rounded-none w-max text-[10px] font-black uppercase tracking-widest">
                          <AlertCircle className="w-3.5 h-3.5" /> Low Stock
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {section.stock.length > 0 ? (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Container</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Product</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Left</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Original</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Source</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.4em] text-cyan-600 text-right">Adjustment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {section.stock.map((row) => {
                      const isLow = row.remainingQuantity < 50;
                      return (
                        <motion.tr
                          key={row.id}
                          layout
                          className="hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors group"
                        >
                          <td className="px-6 py-6">
                            <div className="font-black text-slate-800 dark:text-slate-100 outfit uppercase tracking-tight">{row.containerNumber}</div>
                            <div className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Car {row.carNumber}</div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-none bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-slate-800 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                <Package className="w-5 h-5" />
                              </div>
                              <span className="font-black text-slate-800 dark:text-slate-100 outfit uppercase tracking-tight">{row.productName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <span className={`text-2xl font-black block outfit ${isLow ? "text-rose-500" : "text-cyan-600"}`}>
                              {row.remainingQuantity} <span className="text-[9px] text-slate-400 dark:text-zinc-600 uppercase font-black ml-1">{row.unit || 'UNITS'}</span>
                            </span>
                          </td>
                          <td className="px-6 py-6">
                            <span className="text-sm font-black text-slate-500 dark:text-zinc-400 outfit uppercase">{row.initialQuantity} {row.unit || 'UNITS'}</span>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-slate-400" />
                              <span className="text-xs font-black text-slate-600 dark:text-zinc-400 uppercase tracking-tight">{row.supplierName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleAdjust(row.id, -10)} className="w-10 h-10 rounded-none bg-white dark:bg-zinc-900 hover:bg-rose-500 hover:text-white flex items-center justify-center transition text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-slate-800 font-black shadow-sm">-</button>
                              <button onClick={() => handleAdjust(row.id, +10)} className="w-10 h-10 rounded-none bg-white dark:bg-zinc-900 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-slate-800 font-black shadow-sm">+</button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No products under this header yet.</p>
              </div>
            )}
          </motion.section>
        ))}

        {groupedSections.length === 0 && (
          <div className="py-16 text-center saas-card rounded-none">
            <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No matching inventory headings found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

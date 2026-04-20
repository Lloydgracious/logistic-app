"use client";

import { useStore } from "@/lib/store";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, FileText, Printer, Download, ArrowRight, CheckCircle2, ShoppingCart, User, Calendar } from "lucide-react";
import { ClientDate } from "@/components/ClientDate";

export default function InvoicePage() {
  const { orders } = useStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // Mock calculation for the invoice
  const calculateTotal = (items: { quantity: number }[]) => {
    return items.reduce((acc, item) => acc + (item.quantity * 100), 0); // Flat 100 per unit for mock
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter outfit uppercase italic">
            Billing <span className="text-cyan-500">Forge</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] mt-2">Financial manifest generation and ledgering.</p>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => window.print()} 
             disabled={!selectedOrder}
             className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-cyan-600 disabled:opacity-30 disabled:bg-slate-400 transition-all shadow-xl"
           >
             <Printer className="w-4 h-4" /> Print Document
           </button>
           <button 
             disabled={!selectedOrder}
             className="flex items-center gap-2 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white px-5 py-3 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all shadow-lg"
           >
             <Download className="w-4 h-4" /> Export PDF
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Order Selector Pane */}
        <div className="lg:col-span-4 space-y-4">
           <div className="saas-card p-6 rounded-none border-t-4 border-t-cyan-500 bg-white dark:bg-black overflow-hidden relative">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-zinc-800 pb-3">Available Orders</h3>
              <div className="space-y-3">
                 {orders.map((order) => (
                    <button 
                      key={order.id} 
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`w-full text-left p-4 rounded-none border-2 transition-all flex items-center justify-between group ${selectedOrderId === order.id ? 'border-cyan-500 bg-cyan-50/50' : 'border-slate-100 dark:border-zinc-800 hover:border-slate-200'}`}
                    >
                       <div>
                          <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-cyan-600 transition-colors">{order.customerName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">REF: {order.id}</p>
                       </div>
                       <ArrowRight className={`w-4 h-4 ${selectedOrderId === order.id ? 'text-cyan-600' : 'text-slate-200'}`} />
                    </button>
                 ))}
                 {orders.length === 0 && (
                    <p className="text-center py-10 text-xs text-slate-400 font-black uppercase tracking-widest">No active orders found.</p>
                 )}
              </div>
           </div>

           <div className="saas-card p-6 rounded-none border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-slate-400">
              <div className="flex items-center gap-3 mb-4">
                 <FileText className="w-5 h-5" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Legal Notice</p>
              </div>
              <p className="text-[10px] leading-relaxed font-bold">This document Forge is a secure terminal for generating billable manifests. All generated invoices are authenticated against the central Audit Engine.</p>
           </div>
        </div>

        {/* Invoice Preview Pane */}
        <div className="lg:col-span-8">
           <AnimatePresence mode="wait">
              {selectedOrder ? (
                 <motion.div 
                   key={selectedOrder.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="invoice-document bg-white dark:bg-zinc-950 p-10 md:p-16 border border-slate-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden"
                 >
                    {/* Invoice Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 -mr-32 -mt-32 rotate-45 pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-20 border-b-8 border-slate-950 dark:border-white pb-12">
                       <div>
                          <div className="w-16 h-16 bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-black mb-6">
                            <Receipt className="w-8 h-8" />
                          </div>
                          <h1 className="text-4xl font-black outfit tracking-tighter text-slate-950 dark:text-white uppercase leading-none">GARAGE<br/><span className="text-cyan-500 italic">FLOW</span> LOGISTICS</h1>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-4 leading-relaxed">
                            Global Supply Chain Hub<br/>
                            Terminal 4, Sector 7G<br/>
                            Industrial-001
                          </p>
                       </div>
                       <div className="text-right">
                          <h2 className="text-6xl font-black outfit tracking-tighter text-slate-200 dark:text-zinc-800 uppercase italic">Invoice</h2>
                          <div className="mt-8 space-y-2">
                             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Manifest UUID</p>
                             <p className="text-sm font-black text-slate-900 dark:text-white uppercase">INV-01-{(Math.random() * 1000).toFixed(0)}-{selectedOrder.id.slice(0,4)}</p>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
                       <div>
                          <div className="flex items-center gap-2 mb-4 text-cyan-500">
                             <User className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Billing Address</span>
                          </div>
                          <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedOrder.customerName}</h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{selectedOrder.carNumber}</p>
                          <p className="text-xs text-slate-500 font-medium italic mt-4 max-w-xs">{selectedOrder.customerNote || "No instructions provided."}</p>
                       </div>
                       <div className="md:text-right">
                          <div className="flex items-center md:justify-end gap-2 mb-4 text-rose-500">
                             <Calendar className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Document Timeline</span>
                          </div>
                          <div className="space-y-4">
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                                <p className="text-xs font-black text-slate-900 dark:text-zinc-300 uppercase tracking-tight">Today, <ClientDate format="full" /></p>
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                                <p className="text-xs font-black text-rose-500 uppercase tracking-tight"><ClientDate date={selectedOrder.finalDate} format="full" /></p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="mb-20 overflow-x-auto custom-scrollbar">
                       <table className="w-full text-left min-w-[600px]">
                          <thead>
                             <tr className="border-b-2 border-slate-900 dark:border-white">
                                <th className="py-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Cargo Description</th>
                                <th className="py-4 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Alloc. Qty</th>
                                <th className="py-4 text-right text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Rate (M)</th>
                                <th className="py-4 text-right text-[10px] font-black uppercase tracking-[0.4em] text-cyan-600">Total Credits</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                             {selectedOrder.items.map((item, idx) => (
                                <tr key={idx}>
                                   <td className="py-6">
                                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Industrial Grade Asset</p>
                                   </td>
                                   <td className="py-6 text-center">
                                      <span className="text-sm font-black text-slate-600 dark:text-zinc-400 uppercase">{item.quantity} <span className="text-[9px] text-slate-400 ml-1">{item.unit || "U"}</span></span>
                                   </td>
                                   <td className="py-6 text-right">
                                      <span className="text-sm font-black text-slate-600 dark:text-zinc-400">100.00</span>
                                   </td>
                                   <td className="py-6 text-right">
                                      <span className="text-sm font-black text-slate-900 dark:text-white">{(item.quantity * 100).toFixed(2)}</span>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-12">
                       <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Shipment Status</p>
                             <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic">{selectedOrder.status.replace(/_/g, " ")}</p>
                          </div>
                       </div>
                       <div className="text-right border-t-4 border-slate-950 dark:border-white pt-6 min-w-[240px]">
                          <div className="flex justify-between items-center text-slate-400 font-black mb-2">
                             <span className="text-[10px] uppercase tracking-widest">Subtotal (Credits)</span>
                             <span className="text-sm">{calculateTotal(selectedOrder.items).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-400 font-black mb-6">
                             <span className="text-[10px] uppercase tracking-widest">Protocol Tax (0%)</span>
                             <span className="text-sm">0.00</span>
                          </div>
                          <div className="flex justify-between items-baseline">
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-600">Total Credits due</span>
                             <span className="text-6xl font-black text-slate-950 dark:text-white outfit tracking-tighter italic">{calculateTotal(selectedOrder.items).toFixed(2)}</span>
                          </div>
                       </div>
                    </div>

                    <div className="mt-32 pt-12 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center opacity-30">
                       <div className="flex gap-4">
                          <ShoppingCart className="w-5 h-5 text-slate-400" />
                          <div className="w-5 h-5 bg-slate-400" />
                          <div className="w-5 h-5 bg-cyan-500" />
                       </div>
                       <p className="text-[8px] font-black uppercase tracking-[0.5em]">Forge Terminal Session: SF-X-99</p>
                    </div>

                 </motion.div>
              ) : (
                 <div className="h-[600px] flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-900/20 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-none text-slate-400">
                    <Receipt className="w-16 h-16 mb-6 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">Select an order from the list to forge a billing manifest.</p>
                 </div>
              )}
           </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

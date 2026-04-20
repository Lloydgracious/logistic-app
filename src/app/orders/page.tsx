"use client";

import { useStore, OrderStatus } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import dynamic from "next/dynamic";
import { getWaitingDays } from "@/lib/utils";
import { Plus, ArrowRight, ShoppingCart, CheckCircle2, Trash } from "lucide-react";

const AnimatedCar = dynamic(() => import("@/components/AnimatedCar").then(mod => mod.AnimatedCar), { ssr: false });

const statusConfig: Record<OrderStatus, { label: string; color: string; progress: number }> = {
  PENDING: { label: "Pending", color: "text-slate-500 dark:text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-slate-700", progress: 25 },
  PREPARING: { label: "Preparing", color: "text-blue-600 bg-blue-50 border-blue-200", progress: 50 },
  ON_THE_WAY: { label: "On The Way", color: "text-amber-600 bg-amber-50 border-amber-200", progress: 75 },
  DELIVERED: { label: "Delivered", color: "text-green-600 bg-green-50 border-green-200", progress: 100 },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.color} whitespace-nowrap shadow-sm`}>
      {config.label}
    </span>
  );
}

export default function OrdersPage() {
  const { orders, updateOrderStatus, addOrder } = useStore();
  const [showAdd, setShowAdd] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [finalOrderDate, setFinalOrderDate] = useState("");
  const [customerNote, setCustomerNote] = useState("");
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
    if (!customerName || !carNumber || items.some(i => !i.name || !i.quantity)) return;
    
    addOrder({
      customerName,
      carNumber,
      items: items.map(i => ({ 
        name: i.name, 
        quantity: parseInt(i.quantity) || 0,
        unit: i.unit 
      })),
      orderTime: orderDate ? new Date(orderDate).toISOString() : undefined,
      finalDate: finalOrderDate ? new Date(finalOrderDate).toISOString() : undefined,
      customerNote
    });
    
    setShowAdd(false);
    setCustomerName("");
    setCarNumber("");
    setOrderDate("");
    setFinalOrderDate("");
    setCustomerNote("");
    setItems([{ name: "", quantity: "", unit: "" }]);
  };

  const handleNextStatus = (id: string, current: OrderStatus) => {
    if (current === 'PENDING') updateOrderStatus(id, 'PREPARING');
    else if (current === 'PREPARING') updateOrderStatus(id, 'ON_THE_WAY');
    else if (current === 'ON_THE_WAY') updateOrderStatus(id, 'DELIVERED');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight outfit">Outgoing Orders</h2>
           <p className="text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Manage, add, and track outgoing deliveries.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-sm max-w-max"
        >
          <Plus className={`w-5 h-5 transition-transform ${showAdd ? 'rotate-45' : ''}`} /> {showAdd ? 'Close' : 'New Order'}
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
            <div className="saas-card p-6 border border-primary/20 bg-blue-50/50 mb-6 rounded-none">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 italic">Create New Order</h3>
                 <span className="text-[10px] bg-rose-500 text-white px-2 py-1 rounded-none font-black uppercase tracking-widest shadow-lg shadow-rose-500/20">Customer Direct</span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black px-1 tracking-wider">Customer / Client</label>
                   <input value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="Full Name" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black px-1 tracking-wider">Target Vehicle</label>
                   <input value={carNumber} onChange={e=>setCarNumber(e.target.value)} placeholder="ABC-123" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black px-1 tracking-wider flex items-center gap-1">Order Date</label>
                   <input value={orderDate} type="date" onChange={e=>setOrderDate(e.target.value)} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none transition-all font-medium" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black px-1 tracking-wider flex items-center gap-1">Target Date</label>
                   <input value={finalOrderDate} type="date" onChange={e=>setFinalOrderDate(e.target.value)} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none transition-all font-medium" />
                 </div>
               </div>

               <div className="space-y-1.5 mb-6">
                 <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black px-1 tracking-wider">Note from Customer</label>
                 <textarea 
                   value={customerNote} 
                   onChange={e=>setCustomerNote(e.target.value)} 
                   placeholder="Any special instructions or notes..." 
                   className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium h-20 resize-none"
                 />
               </div>

               <div className="bg-white dark:bg-black/40 rounded-none border border-slate-200 dark:border-slate-800 p-5 mb-8">
                 <div className="flex justify-between items-center mb-4">
                   <label className="text-[10px] text-slate-800 dark:text-slate-100 font-black uppercase tracking-widest">Requested Items</label>
                   <button onClick={addItemRow} className="text-rose-500 text-[10px] hover:underline transition-colors flex items-center gap-1 font-black uppercase tracking-wider">
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

               <div className="flex justify-end gap-3">
                 <button onClick={() => setShowAdd(false)} className="px-6 py-3 rounded-none text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all font-bold text-xs uppercase tracking-widest">Cancel</button>
                 <button onClick={handleAdd} className="px-8 py-3 rounded-none bg-slate-950 dark:bg-white text-white dark:text-black hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all shadow-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2">Submit Order <ArrowRight className="w-4 h-4" /></button>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {orders.map((order) => (
          <motion.div 
            key={order.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="saas-card p-0 rounded-none border-l-4 border-l-indigo-500 relative overflow-hidden"
          >
            <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
              
              <div className="flex-1 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-none bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                    <ShoppingCart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 outfit uppercase tracking-tight">{order.customerName}</h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider">VEHICLE ID: {order.carNumber}</p>
                    {order.customerNote && (
                      <div className="mt-2 text-xs bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 p-2 rounded-none border border-rose-100 dark:border-rose-900/30 italic">
                        &quot; {order.customerNote} &quot;
                      </div>
                    )}
                  </div>
                  <div className="ml-auto flex flex-col items-end gap-2">
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-[0.2em]">Manifest</p>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((i, idx) => (
                      <div key={idx} className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-none text-xs shadow-sm group cursor-default">
                        <span className="text-slate-500 dark:text-slate-400 font-medium uppercase">{i.name}:</span> <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm ml-1">{i.quantity}</span> <span className="text-[9px] text-slate-400 uppercase font-black ml-1">{i.unit || 'UNITS'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-zinc-900 h-1.5 rounded-none overflow-hidden">
                  <motion.div 
                    className="h-full bg-indigo-500"
                    initial={{ width: `${order.status === 'DELIVERED' ? 100 : Math.min(100, Math.round(((Date.now() - new Date(order.orderTime).getTime()) / (new Date(order.finalDate).getTime() - new Date(order.orderTime).getTime())) * 100))}%` }}
                    animate={{ width: `${order.status === 'DELIVERED' ? 100 : Math.min(100, Math.round(((Date.now() - new Date(order.orderTime).getTime()) / (new Date(order.finalDate).getTime() - new Date(order.orderTime).getTime())) * 100))}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <div className="w-full md:w-64 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-zinc-900 md:pl-6 pt-4 md:pt-0">
                <div className="h-32 rounded-none overflow-hidden relative shadow-inner bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                   <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay z-0 pointer-events-none" />
                  {order.status === 'DELIVERED' ? (
                     <div className="text-center relative z-10">
                       <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                       <span className="text-emerald-500 font-black outfit uppercase tracking-widest text-xs">Delivered</span>
                     </div>
                  ) : (
                    <AnimatedCar 
                      type={order.status === 'PREPARING' ? 'arrive' : order.status === 'ON_THE_WAY' ? 'depart' : 'loop'} 
                      progress={order.status === 'ON_THE_WAY' ? Math.min(0.9, (Date.now() - new Date(order.orderTime).getTime()) / (new Date(order.finalDate).getTime() - new Date(order.orderTime).getTime())) : 0.5} 
                      waitingDays={getWaitingDays(order.orderTime)}
                     />
                  )}
                </div>
                {order.status !== 'DELIVERED' && (
                  <button 
                    onClick={() => handleNextStatus(order.id, order.status)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-none flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-[10px]"
                  >
                    Next Stage <ArrowRight className="w-4 h-4" />
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

"use client";

import { useStore, OrderStatus } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getWaitingDays } from "@/lib/utils";
import { Plus, ArrowRight, ShoppingCart, CheckCircle2, Trash, Pencil, Save, X, Star, ArchiveRestore } from "lucide-react";
import { useAdminAccess } from "@/lib/use-admin-access";

const AnimatedCar = dynamic(() => import("@/components/AnimatedCar").then(mod => mod.AnimatedCar), { ssr: false });

type OrderDraftItem = {
  stockId: string;
  quantity: string;
};

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
  const { orders, customers, updateOrderStatus, addOrder, updateOrder, deleteOrder, containerStock, toggleOrderBookmark, restoreOrder } = useStore();
  const isAdmin = useAdminAccess();
  const [showAdd, setShowAdd] = useState(false);
  const [listFilter, setListFilter] = useState<"current" | "bookmarked" | "archive">("current");

  const [customerName, setCustomerName] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [finalOrderDate, setFinalOrderDate] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [items, setItems] = useState<OrderDraftItem[]>([{ stockId: "", quantity: "" }]);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCarNumber, setEditCarNumber] = useState("");
  const [editOrderDate, setEditOrderDate] = useState("");
  const [editFinalOrderDate, setEditFinalOrderDate] = useState("");
  const [editCustomerNote, setEditCustomerNote] = useState("");
  const [editStatus, setEditStatus] = useState<OrderStatus>("PENDING");
  const [editItems, setEditItems] = useState<OrderDraftItem[]>([{ stockId: "", quantity: "" }]);
  const [editError, setEditError] = useState("");

  const availableStock = containerStock.filter((row) => row.remainingQuantity > 0);
  const existingCustomers = [...customers].sort((a, b) => a.name.localeCompare(b.name));
  const filteredOrders = orders.filter((order) => {
    if (listFilter === "archive") return Boolean(order.archivedAt);
    if (listFilter === "bookmarked") return Boolean(order.isBookmarked) && !order.archivedAt;
    return !order.archivedAt;
  });

  const addItemRow = () => setItems([...items, { stockId: "", quantity: "" }]);
  const removeItemRow = (idx: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };
  const updateItemRow = (idx: number, field: keyof OrderDraftItem, val: string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    setItems(updated);
    setFormError("");
  };

  const handleAdd = () => {
    const trimmedCustomerName = customerName.trim();
    const trimmedCarNumber = carNumber.trim();

    if (!trimmedCustomerName || !trimmedCarNumber || items.some(i => !i.stockId || !i.quantity)) {
      setFormError("Please fill client, delivery car, container product, and quantity.");
      return;
    }

    const orderItems = items.map((item) => {
      const stockRow = containerStock.find((row) => row.id === item.stockId);
      return {
        name: stockRow?.productName || "",
        quantity: parseInt(item.quantity) || 0,
        unit: stockRow?.unit,
        containerId: stockRow?.id,
        containerNumber: stockRow?.containerNumber,
      };
    });
    
    const result = addOrder({
      customerName: trimmedCustomerName,
      carNumber: trimmedCarNumber,
      items: orderItems,
      orderTime: orderDate ? new Date(orderDate).toISOString() : undefined,
      finalDate: finalOrderDate ? new Date(finalOrderDate).toISOString() : undefined,
      customerNote
    });

    if (!result.ok) {
      setFormError(result.message || "Could not create order.");
      return;
    }
    
    setShowAdd(false);
    setCustomerName("");
    setCarNumber("");
    setOrderDate("");
    setFinalOrderDate("");
    setCustomerNote("");
    setItems([{ stockId: "", quantity: "" }]);
    setFormError("");
  };

  const handleNextStatus = (id: string, current: OrderStatus) => {
    if (current === 'PENDING') updateOrderStatus(id, 'PREPARING');
    else if (current === 'PREPARING') updateOrderStatus(id, 'ON_THE_WAY');
    else if (current === 'ON_THE_WAY') updateOrderStatus(id, 'DELIVERED');
  };

  const startEdit = (order: typeof orders[number]) => {
    setEditingId(order.id);
    setEditCustomerName(order.customerName);
    setEditCarNumber(order.carNumber);
    setEditOrderDate(order.orderTime ? new Date(order.orderTime).toISOString().slice(0, 10) : "");
    setEditFinalOrderDate(order.finalDate ? new Date(order.finalDate).toISOString().slice(0, 10) : "");
    setEditCustomerNote(order.customerNote || "");
    setEditStatus(order.status);
    setEditItems(order.items.length > 0 ? order.items.map((item) => ({
      stockId: item.containerId || "",
      quantity: String(item.quantity),
    })) : [{ stockId: "", quantity: "" }]);
    setEditError("");
  };

  const updateEditItemRow = (idx: number, field: keyof OrderDraftItem, val: string) => {
    const updated = [...editItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setEditItems(updated);
    setEditError("");
  };

  const saveEdit = () => {
    const trimmedCustomerName = editCustomerName.trim();
    const trimmedCarNumber = editCarNumber.trim();

    if (!editingId || !trimmedCustomerName || !trimmedCarNumber || editItems.some(i => !i.stockId || !i.quantity)) {
      setEditError("Please fill client, delivery car, container product, and quantity.");
      return;
    }

    const orderItems = editItems.map((item) => {
      const stockRow = containerStock.find((row) => row.id === item.stockId);
      return {
        name: stockRow?.productName || "",
        quantity: parseInt(item.quantity) || 0,
        unit: stockRow?.unit,
        containerId: stockRow?.id,
        containerNumber: stockRow?.containerNumber,
      };
    });

    const result = updateOrder(editingId, {
      customerName: trimmedCustomerName,
      carNumber: trimmedCarNumber,
      items: orderItems,
      status: editStatus,
      orderTime: editOrderDate ? new Date(editOrderDate).toISOString() : new Date().toISOString(),
      finalDate: editFinalOrderDate ? new Date(editFinalOrderDate).toISOString() : new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      customerNote: editCustomerNote,
    });

    if (!result.ok) {
      setEditError(result.message || "Could not update order.");
      return;
    }

    setEditingId(null);
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

      <div className="flex flex-wrap gap-2">
        {([
          ["current", "Current"],
          ["bookmarked", "Bookmarked"],
          ["archive", "Archive"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setListFilter(value)}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${listFilter === value ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white dark:bg-black border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600"}`}
            type="button"
          >
            {label}
          </button>
        ))}
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
                   <select
                     value={customerName}
                     onChange={(e) => {
                       setCustomerName(e.target.value);
                       setFormError("");
                     }}
                     className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium"
                   >
                     <option value="">Choose customer</option>
                     {existingCustomers.map((name) => (
                       <option key={name.id} value={name.name}>{name.name}</option>
                     ))}
                   </select>
                   <Link href="/customers" className="inline-flex text-[10px] text-rose-500 hover:text-rose-600 font-black uppercase tracking-widest">
                     Manage Customers
                   </Link>
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
                   <label className="text-[10px] text-slate-800 dark:text-slate-100 font-black uppercase tracking-widest">Requested Items by Container</label>
                   <button onClick={addItemRow} className="text-rose-500 text-[10px] hover:underline transition-colors flex items-center gap-1 font-black uppercase tracking-wider">
                     + Add Item Row
                   </button>
                 </div>
                 <div className="space-y-3">
                    {items.map((it, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-3 items-start md:items-center group">
                        <select value={it.stockId} onChange={e=>updateItemRow(idx, 'stockId', e.target.value)} className="w-full md:flex-1 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-slate-800 rounded-none px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-indigo-500 transition-all">
                          <option value="">Choose container and product</option>
                          {availableStock.map((row) => (
                            <option key={row.id} value={row.id}>
                              {row.containerNumber} / {row.productName} / {row.remainingQuantity} {row.unit || 'units'} left
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-3 w-full md:w-auto">
                          <input value={it.quantity} type="number" onChange={e=>updateItemRow(idx, 'quantity', e.target.value)} placeholder="Qty" className="flex-1 md:w-24 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-slate-800 rounded-none px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-indigo-500 transition-all" />
                          <button onClick={() => removeItemRow(idx)} disabled={items.length === 1} className="md:opacity-0 group-hover:opacity-100 p-2.5 text-slate-400 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100">
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>

               {formError && (
                 <div className="mb-6 border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-rose-600">
                   {formError}
                 </div>
               )}

               <div className="flex justify-end gap-3">
                 <button onClick={() => setShowAdd(false)} className="px-6 py-3 rounded-none text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all font-bold text-xs uppercase tracking-widest">Cancel</button>
                 <button onClick={handleAdd} className="px-8 py-3 rounded-none bg-slate-950 dark:bg-white text-white dark:text-black hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all shadow-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2">Submit Order <ArrowRight className="w-4 h-4" /></button>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {filteredOrders.map((order) => (
          <motion.div 
            key={order.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="saas-card p-0 rounded-none border-l-4 border-l-indigo-500 relative overflow-hidden"
          >
            {editingId === order.id ? (
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <select value={editCustomerName} onChange={(e) => setEditCustomerName(e.target.value)} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-sm font-bold outline-none">
                    <option value="">Choose customer</option>
                    {existingCustomers.map((customer) => <option key={customer.id} value={customer.name}>{customer.name}</option>)}
                  </select>
                  <input value={editCarNumber} onChange={e=>setEditCarNumber(e.target.value)} placeholder="Vehicle" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-sm font-bold outline-none" />
                  <input value={editOrderDate} type="date" onChange={e=>setEditOrderDate(e.target.value)} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-sm font-bold outline-none" />
                  <input value={editFinalOrderDate} type="date" onChange={e=>setEditFinalOrderDate(e.target.value)} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-sm font-bold outline-none" />
                  <select value={editStatus} onChange={e=>setEditStatus(e.target.value as OrderStatus)} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-sm font-black uppercase outline-none">
                    {Object.keys(statusConfig).map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                  </select>
                </div>
                <textarea value={editCustomerNote} onChange={e=>setEditCustomerNote(e.target.value)} placeholder="Customer note" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-sm font-medium outline-none h-20 resize-none" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Items</p>
                    <button onClick={() => setEditItems([...editItems, { stockId: "", quantity: "" }])} className="text-[10px] font-black uppercase tracking-widest text-rose-500">+ Add Row</button>
                  </div>
                  {editItems.map((it, idx) => {
                    const editStockOptions = containerStock.filter((row) => row.remainingQuantity > 0 || editItems.some((editItem) => editItem.stockId === row.id));
                    return (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-3">
                        <select value={it.stockId} onChange={e=>updateEditItemRow(idx, "stockId", e.target.value)} className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm font-bold outline-none">
                          <option value="">Choose container and product</option>
                          {editStockOptions.map((row) => (
                            <option key={row.id} value={row.id}>{row.containerNumber} / {row.productName} / {row.remainingQuantity} {row.unit || "units"} left</option>
                          ))}
                        </select>
                        <input value={it.quantity} type="number" onChange={e=>updateEditItemRow(idx, "quantity", e.target.value)} placeholder="Qty" className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm font-bold outline-none" />
                        <button onClick={() => editItems.length > 1 && setEditItems(editItems.filter((_, itemIndex) => itemIndex !== idx))} className="p-2.5 text-slate-400 hover:text-rose-500 border border-slate-200 dark:border-slate-800">
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                {editError && <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-rose-600">{editError}</div>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><X className="w-4 h-4" />Cancel</button>
                  <button onClick={saveEdit} className="px-5 py-2.5 bg-slate-950 dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Save className="w-4 h-4" />Save</button>
                </div>
              </div>
            ) : (
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
                    <div className="flex items-center gap-2">
                      {order.archivedAt && (
                        <span className="px-2 py-1 border border-slate-200 dark:border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-400">Archived</span>
                      )}
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleOrderBookmark(order.id)}
                        className={`p-2 border transition-colors ${order.isBookmarked ? "border-amber-200 bg-amber-50 text-amber-500" : "border-slate-200 dark:border-slate-800 text-slate-300 hover:text-amber-500"}`}
                        aria-label={order.isBookmarked ? "Remove bookmark" : "Bookmark order"}
                        title={order.isBookmarked ? "Remove bookmark" : "Bookmark order"}
                        type="button"
                      >
                        <Star className={`w-3.5 h-3.5 ${order.isBookmarked ? "fill-current" : ""}`} />
                      </button>
                      {order.archivedAt && (
                        <button
                          onClick={() => restoreOrder(order.id)}
                          className="p-2 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-emerald-500 transition-colors"
                          aria-label="Restore order"
                          title="Restore order"
                          type="button"
                        >
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(order)} className="p-2 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-500 transition-colors" aria-label="Edit order">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteOrder(order.id)} className="p-2 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 transition-colors" aria-label="Delete order">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-[0.2em]">Manifest</p>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((i, idx) => (
                      <div key={idx} className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-none text-xs shadow-sm group cursor-default">
                        <span className="text-slate-500 dark:text-slate-400 font-medium uppercase">{i.name}:</span> <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm ml-1">{i.quantity}</span> <span className="text-[9px] text-slate-400 uppercase font-black ml-1">{i.unit || 'UNITS'}</span>
                        {i.containerNumber && <span className="block text-[9px] text-rose-500 uppercase font-black mt-1">From {i.containerNumber}</span>}
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
            )}
          </motion.div>
        ))}
      </div>

    </div>
  );
}

"use client";

import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Phone, Plus, StickyNote, UserPlus, Users } from "lucide-react";
import { FormEvent, useState } from "react";

const formatDate = (value: string) => new Date(value).toISOString().slice(0, 10);

export default function CustomersPage() {
  const { customers, orders, addCustomer } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const sortedCustomers = [...customers].sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setNotice("");

    const result = addCustomer({ name, phone, address, note });
    if (!result.ok) {
      setFormError(result.message || "Could not create customer.");
      return;
    }

    setName("");
    setPhone("");
    setAddress("");
    setNote("");
    setNotice(`${result.customer?.name || "Customer"} is available for new orders.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight outfit">Customers</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Create customer profiles and reuse them when making outgoing orders.</p>
        </div>
        <div className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-black text-slate-800 dark:text-slate-100 font-black text-xs uppercase tracking-widest flex items-center gap-2">
          <Users className="w-4 h-4 text-rose-500" />
          {customers.length} Customers
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <form onSubmit={handleSubmit} className="saas-card p-6 rounded-none border border-rose-500/20 bg-rose-50/30 dark:bg-rose-950/5 h-max">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 italic">New Customer</h3>
            <UserPlus className="w-5 h-5 text-rose-500" />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black px-1 tracking-wider">Customer Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name or company" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black px-1 tracking-wider">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contact number" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black px-1 tracking-wider">Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery area or address" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black px-1 tracking-wider">Note</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Customer preferences or instructions" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium h-24 resize-none" />
            </div>
          </div>

          {formError && (
            <div className="mt-5 border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-rose-600">
              {formError}
            </div>
          )}

          {notice && (
            <div className="mt-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-emerald-600">
              {notice}
            </div>
          )}

          <button type="submit" className="mt-6 w-full px-6 py-3 rounded-none bg-slate-950 dark:bg-white text-white dark:text-black hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all shadow-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
            Add Customer <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Customer Directory</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Used by Orders</span>
          </div>

          {sortedCustomers.length === 0 ? (
            <div className="border border-dashed border-slate-300 dark:border-slate-800 p-10 text-center">
              <Plus className="w-8 h-8 text-rose-500 mx-auto mb-3" />
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No customers yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {sortedCustomers.map((customer, index) => {
                const orderCount = orders.filter((order) => order.customerName.toLowerCase() === customer.name.toLowerCase()).length;

                return (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="saas-card p-5 rounded-none border-l-4 border-l-rose-500"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-slate-950 dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-xs uppercase">
                        {customer.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight outfit">{customer.name}</h4>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Created {formatDate(customer.createdAt)}</p>
                          </div>
                          <span className="shrink-0 border border-cyan-200 bg-cyan-50 text-cyan-700 px-2 py-1 text-[10px] font-black uppercase tracking-widest">
                            {orderCount} Orders
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                          {customer.phone && (
                            <p className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-indigo-500" />
                              {customer.phone}
                            </p>
                          )}
                          {customer.address && (
                            <p className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              {customer.address}
                            </p>
                          )}
                          {customer.note && (
                            <p className="flex items-start gap-2 italic text-rose-600 dark:text-rose-400">
                              <StickyNote className="w-3.5 h-3.5 mt-0.5" />
                              {customer.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

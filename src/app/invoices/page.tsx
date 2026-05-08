"use client";

import { useStore } from "@/lib/store";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, FileText, Printer, Download, ArrowRight, User, Calendar, BadgeDollarSign } from "lucide-react";

const companyDetails = [
  "No.(C/21), Qtr 1, Near Chit Kyi Yay Bridge, Ba Yint Naung Road, Myawaddy.",
  "No.(41-A, Naung Yoe Street, Ba Yint Naung, MaYanGone Tsp, Yangon.",
  "095198258, 095670988, 09783299546",
  "kay.t.win67@gmail.com",
];

export default function InvoicePage() {
  const { orders } = useStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [documentDate, setDocumentDate] = useState("");
  const [manifestId, setManifestId] = useState("");
  const [defaultRate, setDefaultRate] = useState("100");
  const [itemRates, setItemRates] = useState<Record<string, string>>({});

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const resolvedManifestId = manifestId.trim() || (selectedOrder ? `ID-${selectedOrder.id.toUpperCase()}` : "ID-DRAFT");
  const resolvedDocumentDate = documentDate || new Date().toISOString().slice(0, 10);
  const numericDefaultRate = Math.max(0, Number(defaultRate) || 0);
  const getRateKey = (orderId: string, itemIndex: number) => `${orderId}:${itemIndex}`;
  const getItemRate = (itemIndex: number) => {
    if (!selectedOrder) return numericDefaultRate;

    const value = itemRates[getRateKey(selectedOrder.id, itemIndex)];
    return Math.max(0, Number(value ?? defaultRate) || 0);
  };

  const calculateTotal = (items: { quantity: number }[]) => {
    return items.reduce((acc, item, index) => acc + (item.quantity * getItemRate(index)), 0);
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setManifestId((current) => current || `ID-${orderId.toUpperCase()}`);
  };

  const handleDefaultRateChange = (value: string) => {
    setDefaultRate(value);
    if (!selectedOrder) return;

    setItemRates((currentRates) => {
      const nextRates = { ...currentRates };
      selectedOrder.items.forEach((_item, index) => {
        nextRates[getRateKey(selectedOrder.id, index)] = value;
      });
      return nextRates;
    });
  };

  const handleItemRateChange = (itemIndex: number, value: string) => {
    if (!selectedOrder) return;

    setItemRates((currentRates) => ({
      ...currentRates,
      [getRateKey(selectedOrder.id, itemIndex)]: value,
    }));
  };

  const handleExportPdf = () => {
    const invoiceElement = document.getElementById("invoice-export-document");
    if (!selectedOrder || !invoiceElement) return;

    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((element) => element.outerHTML)
      .join("\n");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${resolvedManifestId}</title>
          <base href="${window.location.origin}" />
          ${styles}
          <style>
            @page { size: A4; margin: 14mm; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { margin: 0; background: white; color: #0f172a; font-family: Arial, sans-serif; }
            .invoice-document { border: 0 !important; box-shadow: none !important; min-height: auto !important; }
          </style>
        </head>
        <body>
          ${invoiceElement.outerHTML}
          <script>
            window.addEventListener("load", function () {
              window.focus();
              window.print();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter outfit uppercase italic">
            Billing <span className="text-cyan-500">Office</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] mt-2">KT Logistic invoice generation and transport billing.</p>
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
             onClick={handleExportPdf}
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
                      onClick={() => handleSelectOrder(order.id)}
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

           <div className="saas-card p-6 rounded-none border border-cyan-100 dark:border-cyan-900/40 bg-cyan-50/30 dark:bg-cyan-950/10">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 border-b border-cyan-100 dark:border-cyan-900/40 pb-3">Document Setup</h3>
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                       <FileText className="w-3.5 h-3.5 text-cyan-600" />
                       ID
                    </label>
                    <input
                      value={manifestId}
                      onChange={(event) => setManifestId(event.target.value)}
                      placeholder={selectedOrder ? `ID-${selectedOrder.id.toUpperCase()}` : "ID-CUSTOM-001"}
                      className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                       <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                       Document Date
                    </label>
                    <input
                      type="date"
                      value={documentDate}
                      onChange={(event) => setDocumentDate(event.target.value)}
                      className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                       <BadgeDollarSign className="w-3.5 h-3.5 text-cyan-600" />
                       Default Price Rate
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={defaultRate}
                      onChange={(event) => handleDefaultRateChange(event.target.value)}
                      placeholder="100"
                      className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                    />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Applies to all current items. You can edit each item rate below.</p>
                 </div>
                 {selectedOrder && (
                   <div className="space-y-3 border-t border-cyan-100 dark:border-cyan-900/40 pt-4">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Item Rates</p>
                    {selectedOrder.items.map((item, index) => (
                      <div key={`${selectedOrder.id}-${index}`} className="grid grid-cols-[1fr_110px] gap-3 items-center">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{item.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.quantity} {item.unit || "units"}</p>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={itemRates[getRateKey(selectedOrder.id, index)] ?? defaultRate}
                          onChange={(event) => handleItemRateChange(index, event.target.value)}
                          className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-3 py-2 text-right text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                        />
                      </div>
                    ))}
                   </div>
                 )}
              </div>
           </div>

           <div className="saas-card p-6 rounded-none border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-slate-400">
              <div className="flex items-center gap-3 mb-4">
                 <FileText className="w-5 h-5" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Legal Notice</p>
              </div>
              <p className="text-[10px] leading-relaxed font-bold">Invoices are generated for KT Logistic & Trading export, import, and transportation records.</p>
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
                   id="invoice-export-document"
                   className="invoice-document bg-white dark:bg-zinc-950 p-10 md:p-16 border border-slate-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden"
                 >
                    {/* Invoice Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 -mr-32 -mt-32 rotate-45 pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16 border-b-4 border-slate-950 dark:border-white pb-10">
                       <div className="max-w-xl">
                          <div className="bg-white border border-slate-200 p-3 inline-flex mb-6">
                            <Image src="/kt-logistic-logo.jpg" alt="KT Logistic & Trading" width={842} height={595} className="h-32 w-auto object-contain" priority />
                          </div>
                          <h1 className="text-3xl md:text-4xl font-black outfit tracking-tighter text-slate-950 dark:text-white uppercase leading-none">
                            KT Logistic <span className="text-cyan-500 italic">& Trading</span>
                          </h1>
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mt-3">
                            Kay Thi (Myawady) Trading Company Limited
                          </p>
                          <div className="mt-5 space-y-1">
                            {companyDetails.map((detail) => (
                              <p key={detail} className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-zinc-400 leading-relaxed">
                                {detail}
                              </p>
                            ))}
                          </div>
                       </div>
                       <div className="text-right">
                          <h2 className="text-6xl font-black outfit tracking-tighter text-slate-200 dark:text-zinc-800 uppercase italic">Invoice</h2>
                          <div className="mt-8 space-y-2">
                             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">ID</p>
                             <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{resolvedManifestId}</p>
                             <p className="text-xs font-black text-slate-400 uppercase tracking-widest pt-4">Date</p>
                             <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{resolvedDocumentDate}</p>
                          </div>
                       </div>
                    </div>

                    <div className="mb-16">
                       <div>
                          <div className="flex items-center gap-2 mb-4 text-cyan-500">
                             <User className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Billing Name</span>
                          </div>
                          <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedOrder.customerName}</h4>
                       </div>
                    </div>

                    <div className="mb-16 overflow-x-auto custom-scrollbar">
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
                                      <span className="text-sm font-black text-slate-600 dark:text-zinc-400">{getItemRate(idx).toFixed(2)}</span>
                                   </td>
                                   <td className="py-6 text-right">
                                      <span className="text-sm font-black text-slate-900 dark:text-white">{(item.quantity * getItemRate(idx)).toFixed(2)}</span>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>

                    <div className="flex justify-end">
                       <div className="border-t-4 border-slate-950 dark:border-white pt-6 w-full max-w-md">
                          <div className="grid grid-cols-[1fr_auto] gap-6 items-center text-slate-400 font-black mb-2">
                             <span className="text-[10px] uppercase tracking-widest">Subtotal (Credits)</span>
                             <span className="text-sm">{calculateTotal(selectedOrder.items).toFixed(2)}</span>
                          </div>
                          <div className="grid grid-cols-[1fr_auto] gap-6 items-center text-slate-400 font-black mb-6">
                             <span className="text-[10px] uppercase tracking-widest">Protocol Tax (0%)</span>
                             <span className="text-sm">0.00</span>
                          </div>
                          <div className="grid grid-cols-[1fr_auto] gap-6 items-baseline border-t border-slate-100 dark:border-zinc-800 pt-5">
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-600">Total Credits due</span>
                             <span className="text-5xl md:text-6xl font-black text-slate-950 dark:text-white outfit tracking-tighter italic tabular-nums text-right">{calculateTotal(selectedOrder.items).toFixed(2)}</span>
                          </div>
                       </div>
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

"use client";
import { useStore } from "@/lib/store";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, FileText, Printer, Download, ArrowRight, User, Calendar, BadgeDollarSign, Save, Trash2, Plus, RotateCcw, X } from "lucide-react";

const companyDetails = [
  "No.(C/21), Qtr 1, Near Chit Kyi Yay Bridge, Ba Yint Naung Road, Myawaddy.",
  "No.(41-A, Naung Yoe Street, Ba Yint Naung, MaYanGone Tsp, Yangon.",
  "095198258, 095670988, 09783299546",
  "kay.t.win67@gmail.com",
];

const SAVED_RECEIPTS_KEY = "kt-logistic-saved-receipts";

type SavedReceipt = {
  id: string;
  orderId: string;
  manifestId: string;
  documentDate: string;
  customerName: string;
  total: number;
  savedAt: string;
  html: string;
};

type InvoiceItemDraft = {
  id: string;
  name: string;
  subtitle: string;
  quantity: string;
  unit: string;
  rate: string;
};

const escapeReceiptText = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const parsePositiveNumber = (value: string | number) => Math.max(0, Number(value) || 0);

const onePagePrintStyles = `
  @page { size: A4; margin: 4mm; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
  html, body { margin: 0; background: white; color: #0f172a; font-family: Arial, sans-serif; }
  body { overflow: hidden; }
  .compact-receipt {
    width: 188mm;
    max-height: 245mm;
    margin: 0 auto;
    padding: 0;
    background: #fff;
    color: #0f172a;
    overflow: hidden;
  }
  .compact-header {
    display: grid;
    grid-template-columns: 1fr 48mm;
    gap: 8mm;
    align-items: start;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 4mm;
    margin-bottom: 4mm;
  }
  .compact-logo { width: 42mm; height: auto; display: block; margin-bottom: 2mm; }
  .compact-company { font-size: 16px; line-height: 1; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; }
  .compact-subtitle { margin-top: 1.5mm; font-size: 7px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.14em; color: #475569; }
  .compact-details { margin-top: 2mm; display: grid; gap: 0.7mm; }
  .compact-detail { font-size: 7px; line-height: 1.18; font-weight: 700; text-transform: uppercase; color: #475569; }
  .compact-meta { text-align: right; }
  .compact-title { margin: 0 0 4mm; font-size: 28px; line-height: 0.9; font-weight: 900; font-style: italic; text-transform: uppercase; color: #dbe3ef; letter-spacing: -0.04em; }
  .compact-meta-grid { display: grid; gap: 2mm; }
  .compact-meta-row { display: grid; grid-template-columns: 15mm 1fr; align-items: baseline; gap: 2mm; }
  .compact-label { font-size: 7px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.18em; color: #94a3b8; }
  .compact-value { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #0f172a; }
  .compact-billing {
    display: grid;
    grid-template-columns: 31mm 1fr;
    align-items: baseline;
    gap: 3mm;
    margin-bottom: 5mm;
    padding-bottom: 3mm;
    border-bottom: 1px solid #e2e8f0;
  }
  .compact-billing-name { font-size: 14px; font-weight: 900; text-transform: uppercase; color: #0f172a; }
  .compact-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .compact-table th {
    padding: 2mm 1.2mm;
    border-bottom: 2px solid #0f172a;
    font-size: 6.5px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #64748b;
  }
  .compact-table td {
    padding: 2.3mm 1.2mm;
    border-bottom: 1px solid #eef2f7;
    font-size: 9px;
    font-weight: 900;
    color: #0f172a;
    vertical-align: top;
  }
  .compact-table .muted { display: block; margin-top: 0.7mm; font-size: 6.5px; color: #94a3b8; letter-spacing: 0.06em; }
  .compact-right { text-align: right; }
  .compact-center { text-align: center; }
  .compact-total {
    width: 72mm;
    margin: 7mm 0 0 auto;
    border-top: 2px solid #0f172a;
    padding-top: 3mm;
  }
  .compact-total-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6mm;
    align-items: baseline;
    margin-bottom: 2mm;
    color: #64748b;
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .compact-total-due {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6mm;
    align-items: baseline;
    border-top: 1px solid #e2e8f0;
    padding-top: 3mm;
    margin-top: 3mm;
  }
  .compact-due-label { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.22em; color: #0891b2; }
  .compact-due-value { font-size: 26px; line-height: 1; font-weight: 900; font-style: italic; color: #0f172a; letter-spacing: -0.06em; }
  .invoice-document {
    width: 194mm !important;
    max-width: 194mm !important;
    min-height: auto !important;
    margin: 0 !important;
    padding: 7mm !important;
    border: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
    color: #0f172a !important;
    overflow: hidden !important;
  }
  .receipt-decoration { display: none !important; }
  .receipt-header {
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    gap: 8mm !important;
    margin-bottom: 8mm !important;
    padding-bottom: 5mm !important;
    border-bottom: 2px solid #0f172a !important;
  }
  .receipt-company { max-width: 118mm !important; }
  .receipt-logo-card { border: 0 !important; padding: 0 !important; margin-bottom: 3mm !important; background: white !important; }
  .receipt-logo { height: 24mm !important; width: auto !important; object-fit: contain !important; }
  .receipt-company-title { font-size: 21px !important; line-height: 0.95 !important; letter-spacing: 0 !important; color: #0f172a !important; }
  .receipt-company-subtitle { font-size: 8px !important; letter-spacing: 0.12em !important; margin-top: 2mm !important; color: #475569 !important; }
  .receipt-company-details { margin-top: 3mm !important; }
  .receipt-company-detail { font-size: 8px !important; line-height: 1.25 !important; letter-spacing: 0.02em !important; color: #475569 !important; }
  .receipt-meta { text-align: right !important; min-width: 44mm !important; }
  .receipt-invoice-title { font-size: 34px !important; line-height: 1 !important; color: #cbd5e1 !important; }
  .receipt-meta-label { font-size: 8px !important; letter-spacing: 0.18em !important; color: #94a3b8 !important; }
  .receipt-meta-value { font-size: 10px !important; color: #0f172a !important; }
  .receipt-meta-stack { margin-top: 5mm !important; }
  .receipt-billing { margin-bottom: 7mm !important; }
  .receipt-billing-label { margin-bottom: 2mm !important; color: #06b6d4 !important; }
  .receipt-billing-name { font-size: 15px !important; color: #0f172a !important; }
  .receipt-table-wrap { margin-bottom: 7mm !important; overflow: visible !important; }
  .receipt-table { width: 100% !important; min-width: 0 !important; table-layout: fixed !important; border-collapse: collapse !important; }
  .receipt-table th { padding: 2.5mm 1.5mm !important; font-size: 7px !important; letter-spacing: 0.14em !important; border-bottom: 2px solid #0f172a !important; }
  .receipt-table td { padding: 2.6mm 1.5mm !important; }
  .receipt-item-name { font-size: 10px !important; color: #0f172a !important; }
  .receipt-item-subtitle { display: none !important; }
  .receipt-cell { font-size: 10px !important; color: #334155 !important; }
  .receipt-total-wrap { justify-content: flex-end !important; }
  .receipt-total-box { max-width: 72mm !important; padding-top: 4mm !important; border-top: 2px solid #0f172a !important; }
  .receipt-total-row { margin-bottom: 1.5mm !important; gap: 6mm !important; }
  .receipt-total-label { font-size: 7px !important; letter-spacing: 0.12em !important; }
  .receipt-total-due { padding-top: 3mm !important; }
  .receipt-total-value { font-size: 30px !important; line-height: 1 !important; color: #0f172a !important; }
`;

export default function InvoicePage() {
  const { orders } = useStore();
  const activeOrders = orders.filter((order) => !order.archivedAt);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [documentDate, setDocumentDate] = useState("");
  const [manifestId, setManifestId] = useState("");
  const [defaultRate, setDefaultRate] = useState("100");
  const [billingName, setBillingName] = useState("");
  const [companyName, setCompanyName] = useState("KT Logistic & Trading");
  const [companySubtitle, setCompanySubtitle] = useState("Kay Thi (Myawady) Trading Company Limited");
  const [companyDetailText, setCompanyDetailText] = useState(companyDetails.join("\n"));
  const [taxRate, setTaxRate] = useState("0");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemDraft[]>([]);
  const [savedReceipts, setSavedReceipts] = useState<SavedReceipt[]>([]);
  const defaultRateRef = useRef(defaultRate);
  const initializedOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SAVED_RECEIPTS_KEY);
      if (stored) setSavedReceipts(JSON.parse(stored));
    } catch {
      setSavedReceipts([]);
    }
  }, []);

  useEffect(() => {
    defaultRateRef.current = defaultRate;
  }, [defaultRate]);

  const selectedOrder = activeOrders.find(o => o.id === selectedOrderId);
  const resolvedManifestId = manifestId.trim() || (selectedOrder ? `ID-${selectedOrder.id.toUpperCase()}` : "ID-DRAFT");
  const resolvedDocumentDate = documentDate || new Date().toISOString().slice(0, 10);
  const resolvedBillingName = billingName.trim() || selectedOrder?.customerName || "Draft Customer";
  const resolvedCompanyName = companyName.trim() || "KT Logistic & Trading";
  const resolvedCompanySubtitle = companySubtitle.trim() || "Kay Thi (Myawady) Trading Company Limited";
  const companyDetailLines = companyDetailText
    .split(/\r?\n/)
    .map((detail) => detail.trim())
    .filter(Boolean);
  const resolvedCompanyDetails = companyDetailLines.length > 0 ? companyDetailLines : companyDetails;
  const subtotal = invoiceItems.reduce((acc, item) => acc + (parsePositiveNumber(item.quantity) * parsePositiveNumber(item.rate)), 0);
  const taxPercentage = parsePositiveNumber(taxRate);
  const taxAmount = subtotal * (taxPercentage / 100);
  const grandTotal = subtotal + taxAmount;

  useEffect(() => {
    if (!selectedOrder) {
      initializedOrderIdRef.current = null;
      setBillingName("");
      setInvoiceItems([]);
      return;
    }

    if (initializedOrderIdRef.current === selectedOrder.id) return;

    initializedOrderIdRef.current = selectedOrder.id;
    setBillingName(selectedOrder.customerName);
    setInvoiceItems(selectedOrder.items.map((item, index) => ({
      id: `${selectedOrder.id}-${index}-${Date.now()}`,
      name: item.name,
      subtitle: "Industrial Grade Asset",
      quantity: String(item.quantity),
      unit: item.unit || "U",
      rate: defaultRateRef.current,
    })));
  }, [selectedOrder]);

  const buildCurrentReceiptHtml = () => {
    if (!selectedOrder) return "";

    const rows = invoiceItems.map((item) => {
      const quantity = parsePositiveNumber(item.quantity);
      const rate = parsePositiveNumber(item.rate);
      const lineTotal = quantity * rate;

      return `
        <tr>
          <td style="width: 46%;">
            ${escapeReceiptText(item.name || "Cargo Item")}
            ${item.subtitle.trim() ? `<span class="muted">${escapeReceiptText(item.subtitle)}</span>` : ""}
          </td>
          <td class="compact-center" style="width: 16%;">${escapeReceiptText(quantity)} ${escapeReceiptText(item.unit || "U")}</td>
          <td class="compact-right" style="width: 18%;">${rate.toFixed(2)}</td>
          <td class="compact-right" style="width: 20%;">${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    return `
      <main class="compact-receipt">
        <section class="compact-header">
          <div>
            <img src="/kt-logistic-logo.jpg" alt="KT Logistic & Trading" class="compact-logo" />
            <div class="compact-company">${escapeReceiptText(resolvedCompanyName)}</div>
            <div class="compact-subtitle">${escapeReceiptText(resolvedCompanySubtitle)}</div>
            <div class="compact-details">
              ${resolvedCompanyDetails.map((detail) => `<div class="compact-detail">${escapeReceiptText(detail)}</div>`).join("")}
            </div>
          </div>
          <div class="compact-meta">
            <h1 class="compact-title">Invoice</h1>
            <div class="compact-meta-grid">
              <div class="compact-meta-row">
                <span class="compact-label">ID</span>
                <span class="compact-value">${escapeReceiptText(resolvedManifestId)}</span>
              </div>
              <div class="compact-meta-row">
                <span class="compact-label">Date</span>
                <span class="compact-value">${escapeReceiptText(resolvedDocumentDate)}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="compact-billing">
          <span class="compact-label">Billing Name</span>
          <span class="compact-billing-name">${escapeReceiptText(resolvedBillingName)}</span>
        </section>

        <table class="compact-table">
          <thead>
            <tr>
              <th>Cargo Description</th>
              <th class="compact-center">Alloc. Qty</th>
              <th class="compact-right">Rate (M)</th>
              <th class="compact-right">Total Credits</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <section class="compact-total">
          <div class="compact-total-row">
            <span>Subtotal (Credits)</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div class="compact-total-row">
            <span>Protocol Tax (${taxPercentage.toFixed(2)}%)</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div class="compact-total-due">
            <span class="compact-due-label">Total Credits Due</span>
            <span class="compact-due-value">${grandTotal.toFixed(2)}</span>
          </div>
        </section>
      </main>
    `;
  };

  const persistReceipts = (receipts: SavedReceipt[]) => {
    setSavedReceipts(receipts);
    window.localStorage.setItem(SAVED_RECEIPTS_KEY, JSON.stringify(receipts));
  };

  const saveCurrentReceipt = () => {
    if (!selectedOrder) return null;

    const receipt: SavedReceipt = {
      id: `${selectedOrder.id}:${resolvedManifestId}:${resolvedDocumentDate}`,
      orderId: selectedOrder.id,
      manifestId: resolvedManifestId,
      documentDate: resolvedDocumentDate,
      customerName: resolvedBillingName,
      total: grandTotal,
      savedAt: new Date().toISOString(),
      html: buildCurrentReceiptHtml(),
    };

    const nextReceipts = [
      receipt,
      ...savedReceipts.filter((savedReceipt) => savedReceipt.id !== receipt.id),
    ].slice(0, 30);

    persistReceipts(nextReceipts);
    return receipt;
  };

  const deleteSavedReceipt = (receiptId: string) => {
    persistReceipts(savedReceipts.filter((receipt) => receipt.id !== receiptId));
  };

  const openReceiptPrintWindow = (html: string, title: string) => {
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
          <title>${title}</title>
          <base href="${window.location.origin}" />
          ${styles}
          <style>${onePagePrintStyles}</style>
        </head>
        <body>
          ${html}
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

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setManifestId((current) => current || `ID-${orderId.toUpperCase()}`);
  };

  const handleDefaultRateChange = (value: string) => {
    setDefaultRate(value);
    setInvoiceItems((currentItems) => currentItems.map((item) => ({ ...item, rate: value })));
  };

  const updateInvoiceItem = (itemId: string, field: keyof Omit<InvoiceItemDraft, "id">, value: string) => {
    setInvoiceItems((currentItems) => currentItems.map((item) => (
      item.id === itemId ? { ...item, [field]: value } : item
    )));
  };

  const addInvoiceItem = () => {
    setInvoiceItems((currentItems) => [
      ...currentItems,
      {
        id: `draft-${Date.now()}`,
        name: "New Cargo Item",
        subtitle: "Industrial Grade Asset",
        quantity: "1",
        unit: "U",
        rate: defaultRate,
      },
    ]);
  };

  const removeInvoiceItem = (itemId: string) => {
    setInvoiceItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  };

  const resetBillDraft = () => {
    if (!selectedOrder) return;

    setBillingName(selectedOrder.customerName);
    setCompanyName("KT Logistic & Trading");
    setCompanySubtitle("Kay Thi (Myawady) Trading Company Limited");
    setCompanyDetailText(companyDetails.join("\n"));
    setTaxRate("0");
    setInvoiceItems(selectedOrder.items.map((item, index) => ({
      id: `${selectedOrder.id}-${index}-${Date.now()}`,
      name: item.name,
      subtitle: "Industrial Grade Asset",
      quantity: String(item.quantity),
      unit: item.unit || "U",
      rate: defaultRate,
    })));
  };

  const handleExportPdf = () => {
    if (!selectedOrder) return;

    saveCurrentReceipt();
    openReceiptPrintWindow(buildCurrentReceiptHtml(), resolvedManifestId);
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
             onClick={handleExportPdf} 
             disabled={!selectedOrder}
             className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-cyan-600 disabled:opacity-30 disabled:bg-slate-400 transition-all shadow-xl"
           >
             <Printer className="w-4 h-4" /> Print Receipt
           </button>
           <button 
             onClick={saveCurrentReceipt}
             disabled={!selectedOrder}
             className="flex items-center gap-2 bg-cyan-600 text-white px-5 py-3 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 disabled:opacity-30 disabled:bg-slate-400 transition-all shadow-xl"
           >
             <Save className="w-4 h-4" /> Save Receipt
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
                 {activeOrders.map((order) => (
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
                 {activeOrders.length === 0 && (
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
                   <div className="space-y-5 border-t border-cyan-100 dark:border-cyan-900/40 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Editable Bill Details</p>
                      <button
                        onClick={resetBillDraft}
                        className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-600 transition-colors"
                        type="button"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                        <User className="w-3.5 h-3.5 text-cyan-600" />
                        Billing Name
                      </label>
                      <input
                        value={billingName}
                        onChange={(event) => setBillingName(event.target.value)}
                        className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <input
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                        aria-label="Company name"
                        className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                      />
                      <input
                        value={companySubtitle}
                        onChange={(event) => setCompanySubtitle(event.target.value)}
                        aria-label="Company subtitle"
                        className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                      />
                      <textarea
                        value={companyDetailText}
                        onChange={(event) => setCompanyDetailText(event.target.value)}
                        aria-label="Company address and contact lines"
                        rows={4}
                        className="w-full resize-y bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                        <BadgeDollarSign className="w-3.5 h-3.5 text-cyan-600" />
                        Protocol Tax %
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={taxRate}
                        onChange={(event) => setTaxRate(event.target.value)}
                        className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Cargo Lines</p>
                        <button
                          onClick={addInvoiceItem}
                          className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-cyan-600 hover:text-slate-900 dark:hover:text-white transition-colors"
                          type="button"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Line
                        </button>
                      </div>
                      {invoiceItems.map((item, index) => (
                        <div key={item.id} className="border border-cyan-100 dark:border-cyan-900/40 bg-white/70 dark:bg-black/30 p-3 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Line {index + 1}</p>
                            <button
                              onClick={() => removeInvoiceItem(item.id)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                              aria-label="Remove cargo line"
                              title="Remove cargo line"
                              type="button"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            value={item.name}
                            onChange={(event) => updateInvoiceItem(item.id, "name", event.target.value)}
                            aria-label="Cargo description"
                            className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-3 py-2 text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-black uppercase"
                          />
                          <input
                            value={item.subtitle}
                            onChange={(event) => updateInvoiceItem(item.id, "subtitle", event.target.value)}
                            aria-label="Cargo subtitle"
                            className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-3 py-2 text-slate-700 dark:text-slate-200 text-xs outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                          />
                          <div className="grid grid-cols-[1fr_76px_1fr] gap-2">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(event) => updateInvoiceItem(item.id, "quantity", event.target.value)}
                              aria-label="Quantity"
                              className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-3 py-2 text-right text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                            />
                            <input
                              value={item.unit}
                              onChange={(event) => updateInvoiceItem(item.id, "unit", event.target.value)}
                              aria-label="Unit"
                              className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-3 py-2 text-center text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold uppercase"
                            />
                            <input
                              type="number"
                              min="0"
                              value={item.rate}
                              onChange={(event) => updateInvoiceItem(item.id, "rate", event.target.value)}
                              aria-label="Rate"
                              className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-3 py-2 text-right text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                   </div>
                 )}
              </div>
           </div>

           <div className="saas-card p-6 rounded-none border border-slate-100 dark:border-zinc-800 bg-white dark:bg-black">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-zinc-800 pb-3">Saved Receipts</h3>
              <div className="space-y-3">
                {savedReceipts.map((receipt) => (
                  <div key={receipt.id} className="border border-slate-100 dark:border-zinc-800 p-3 rounded-none bg-slate-50 dark:bg-zinc-900/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">{receipt.customerName}</p>
                        <p className="text-[10px] text-cyan-600 font-black uppercase tracking-widest mt-0.5">{receipt.manifestId}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{receipt.documentDate} / {receipt.total.toFixed(2)} credits</p>
                      </div>
                      <button
                        onClick={() => deleteSavedReceipt(receipt.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        aria-label="Delete saved receipt"
                        title="Delete saved receipt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => openReceiptPrintWindow(receipt.html, receipt.manifestId)}
                      className="mt-3 w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-zinc-300 hover:border-cyan-500 hover:text-cyan-600 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Saved Receipt
                    </button>
                  </div>
                ))}
                {savedReceipts.length === 0 && (
                  <p className="text-center py-8 text-xs text-slate-400 font-black uppercase tracking-widest">No saved receipts yet.</p>
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
                    <div className="receipt-decoration absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 -mr-32 -mt-32 rotate-45 pointer-events-none" />
                    
                    <div className="receipt-header flex flex-col md:flex-row justify-between items-start gap-8 mb-16 border-b-4 border-slate-950 dark:border-white pb-10">
                       <div className="receipt-company max-w-xl">
                          <div className="receipt-logo-card bg-white border border-slate-200 p-3 inline-flex mb-6">
                            <Image src="/kt-logistic-logo.jpg" alt="KT Logistic & Trading" width={842} height={595} className="receipt-logo h-32 w-auto object-contain" priority />
                          </div>
                          <h1 className="receipt-company-title text-3xl md:text-4xl font-black outfit tracking-tighter text-slate-950 dark:text-white uppercase leading-none">
                            {resolvedCompanyName}
                          </h1>
                          <p className="receipt-company-subtitle text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mt-3">
                            {resolvedCompanySubtitle}
                          </p>
                          <div className="receipt-company-details mt-5 space-y-1">
                            {resolvedCompanyDetails.map((detail) => (
                              <p key={detail} className="receipt-company-detail text-[10px] md:text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-zinc-400 leading-relaxed">
                                {detail}
                              </p>
                            ))}
                          </div>
                       </div>
                       <div className="receipt-meta text-right">
                          <h2 className="receipt-invoice-title text-6xl font-black outfit tracking-tighter text-slate-200 dark:text-zinc-800 uppercase italic">Invoice</h2>
                          <div className="receipt-meta-stack mt-8 space-y-2">
                             <p className="receipt-meta-label text-xs font-black text-slate-400 uppercase tracking-widest">ID</p>
                             <p className="receipt-meta-value text-sm font-black text-slate-900 dark:text-white uppercase">{resolvedManifestId}</p>
                             <p className="receipt-meta-label text-xs font-black text-slate-400 uppercase tracking-widest pt-4">Date</p>
                             <p className="receipt-meta-value text-sm font-black text-slate-900 dark:text-white uppercase">{resolvedDocumentDate}</p>
                          </div>
                       </div>
                    </div>

                    <div className="receipt-billing mb-16">
                       <div>
                          <div className="receipt-billing-label flex items-center gap-2 mb-4 text-cyan-500">
                             <User className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Billing Name</span>
                          </div>
                          <h4 className="receipt-billing-name text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{resolvedBillingName}</h4>
                       </div>
                    </div>

                    <div className="receipt-table-wrap mb-16 overflow-x-auto custom-scrollbar">
                       <table className="receipt-table w-full text-left min-w-[600px]">
                          <thead>
                             <tr className="border-b-2 border-slate-900 dark:border-white">
                                <th className="py-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Cargo Description</th>
                                <th className="py-4 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Alloc. Qty</th>
                                <th className="py-4 text-right text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Rate (M)</th>
                                <th className="py-4 text-right text-[10px] font-black uppercase tracking-[0.4em] text-cyan-600">Total Credits</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                             {invoiceItems.map((item) => {
                              const quantity = parsePositiveNumber(item.quantity);
                              const rate = parsePositiveNumber(item.rate);

                              return (
                                <tr key={item.id}>
                                   <td className="py-6">
                                      <p className="receipt-item-name text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name || "Cargo Item"}</p>
                                      {item.subtitle.trim() && (
                                        <p className="receipt-item-subtitle text-[9px] text-slate-400 font-bold uppercase mt-1">{item.subtitle}</p>
                                      )}
                                   </td>
                                   <td className="py-6 text-center">
                                      <span className="receipt-cell text-sm font-black text-slate-600 dark:text-zinc-400 uppercase">{quantity} <span className="text-[9px] text-slate-400 ml-1">{item.unit || "U"}</span></span>
                                   </td>
                                   <td className="py-6 text-right">
                                      <span className="receipt-cell text-sm font-black text-slate-600 dark:text-zinc-400">{rate.toFixed(2)}</span>
                                   </td>
                                   <td className="py-6 text-right">
                                      <span className="receipt-cell text-sm font-black text-slate-900 dark:text-white">{(quantity * rate).toFixed(2)}</span>
                                   </td>
                                </tr>
                              );
                             })}
                          </tbody>
                       </table>
                    </div>

                    <div className="receipt-total-wrap flex justify-end">
                       <div className="receipt-total-box border-t-4 border-slate-950 dark:border-white pt-6 w-full max-w-md">
                          <div className="receipt-total-row grid grid-cols-[1fr_auto] gap-6 items-center text-slate-400 font-black mb-2">
                             <span className="receipt-total-label text-[10px] uppercase tracking-widest">Subtotal (Credits)</span>
                             <span className="text-sm">{subtotal.toFixed(2)}</span>
                          </div>
                          <div className="receipt-total-row grid grid-cols-[1fr_auto] gap-6 items-center text-slate-400 font-black mb-6">
                             <span className="receipt-total-label text-[10px] uppercase tracking-widest">Protocol Tax ({taxPercentage.toFixed(2)}%)</span>
                             <span className="text-sm">{taxAmount.toFixed(2)}</span>
                          </div>
                          <div className="receipt-total-due grid grid-cols-[1fr_auto] gap-6 items-baseline border-t border-slate-100 dark:border-zinc-800 pt-5">
                             <span className="receipt-total-label text-[10px] font-black uppercase tracking-[0.4em] text-cyan-600">Total Credits due</span>
                             <span className="receipt-total-value text-5xl md:text-6xl font-black text-slate-950 dark:text-white outfit tracking-tighter italic tabular-nums text-right">{grandTotal.toFixed(2)}</span>
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

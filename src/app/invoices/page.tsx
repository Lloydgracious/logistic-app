"use client";
import { useStore } from "@/lib/store";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Printer, Download, User, Calendar, BadgeDollarSign, Save, Trash2, Plus, RotateCcw, X, MapPin, Phone, Mail, CreditCard } from "lucide-react";

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
  currencyLabel?: string;
  savedAt: string;
  html: string;
};

type InvoiceItemDraft = {
  id: string;
  name: string;
  subtitle: string;
  pricingType: "fixed" | "weight";
  quantity: string;
  unit: string;
  rate: string;
  weight: string;
  weightUnit: string;
  weightRate: string;
};

const escapeReceiptText = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const parsePositiveNumber = (value: string | number) => Math.max(0, Number(value) || 0);

const weightUnits = ["kg", "g", "lb", "ton"];

const getLineTotal = (item: InvoiceItemDraft) => {
  if (item.pricingType === "weight") {
    return parsePositiveNumber(item.weight) * parsePositiveNumber(item.weightRate);
  }

  return parsePositiveNumber(item.quantity) * parsePositiveNumber(item.rate);
};

const getLineQuantityDisplay = (item: InvoiceItemDraft) => {
  if (item.pricingType === "weight") return parsePositiveNumber(item.quantity || "1").toString();

  return parsePositiveNumber(item.quantity).toString();
};

const getLineUnitDisplay = (item: InvoiceItemDraft) => {
  if (item.pricingType === "weight") {
    return `${parsePositiveNumber(item.weight).toFixed(2)} ${(item.weightUnit || "kg").toUpperCase()}`;
  }

  return `${parsePositiveNumber(item.quantity).toFixed(2)} ${(item.unit || "U").toUpperCase()}`;
};

const getLineRateDisplay = (item: InvoiceItemDraft) => {
  if (item.pricingType === "weight") {
    return `${parsePositiveNumber(item.weightRate).toFixed(2)} / ${item.weightUnit || "kg"}`;
  }

  return parsePositiveNumber(item.rate).toFixed(2);
};

const createDraftInvoiceItem = (id = "draft-line-1", rate = "100"): InvoiceItemDraft => ({
  id,
  name: "New Cargo Item",
  subtitle: "Industrial Grade Asset",
  pricingType: "fixed",
  quantity: "1",
  unit: "U",
  rate,
  weight: "1",
  weightUnit: "kg",
  weightRate: rate,
});

const formatInvoiceDate = (dateValue: string) => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const onePagePrintStyles = `
  @page { size: A4; margin: 4mm; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
  html, body { margin: 0; background: white; color: #111827; font-family: Arial, sans-serif; }
  body { overflow: hidden; }
  .kt-print-invoice {
    width: 194mm;
    min-height: 277mm;
    margin: 0 auto;
    padding: 10mm 11mm 8mm;
    background: #fff;
    position: relative;
    overflow: hidden;
  }
  .kt-print-invoice:before,
  .kt-print-invoice:after {
    content: "";
    position: absolute;
    z-index: 0;
    pointer-events: none;
  }
  .kt-print-invoice:before {
    right: 0;
    top: 0;
    width: 52mm;
    height: 24mm;
    background: linear-gradient(45deg, transparent 0 38%, #071947 38% 67%, transparent 67%), linear-gradient(45deg, transparent 0 60%, #cf1126 60%);
  }
  .kt-print-invoice:after {
    left: 0;
    bottom: 0;
    width: 70mm;
    height: 24mm;
    background: linear-gradient(45deg, #071947 0 63%, transparent 63%), linear-gradient(45deg, transparent 0 70%, #cf1126 70%);
  }
  .kt-print-content { position: relative; z-index: 1; }
  .kt-print-top {
    display: grid;
    grid-template-columns: 1fr 76mm;
    gap: 10mm;
    align-items: start;
    margin-bottom: 8mm;
  }
  .kt-print-logo { width: 70mm; height: auto; display: block; margin-bottom: 6mm; }
  .kt-print-title { margin: 15mm 0 0; font-size: 36px; line-height: 1; font-weight: 900; color: #071947; text-transform: uppercase; letter-spacing: 0.02em; }
  .kt-print-redline { width: 15mm; height: 1mm; background: #cf1126; margin: 4mm 0 5mm; }
  .kt-print-date { display: grid; grid-template-columns: 28mm 1fr; gap: 4mm; font-size: 11px; font-weight: 700; }
  .kt-print-date strong { color: #111827; }
  .kt-print-date span { color: #c3192d; }
  .kt-print-info {
    display: grid;
    grid-template-columns: 1fr 1px 1fr;
    gap: 9mm;
    margin-bottom: 8mm;
  }
  .kt-print-company h2 { margin: 0; color: #c3192d; font-size: 16px; line-height: 1.1; font-weight: 900; text-transform: uppercase; }
  .kt-print-company h3 { margin: 3mm 0 0; color: #c3192d; font-size: 10px; line-height: 1.3; font-weight: 900; text-transform: uppercase; }
  .kt-print-company .small-line { width: 24mm; height: 0.7mm; background: #c3192d; margin: 4mm 0; }
  .kt-print-details { display: grid; gap: 2.2mm; font-size: 9px; line-height: 1.45; color: #111827; }
  .kt-print-divider { background: #d6d6d6; }
  .kt-print-bill-tag { display: inline-block; min-width: 37mm; padding: 2.3mm 5mm; background: linear-gradient(70deg, #071947 0 84%, #cf1126 84% 92%, transparent 92%); color: #fff; font-size: 10px; font-weight: 900; text-transform: uppercase; }
  .kt-print-bill-lines { margin-top: 6mm; display: grid; gap: 3mm; }
  .kt-print-bill-line { min-height: 7mm; border-bottom: 1px dotted #b9b9b9; font-size: 10px; font-weight: 700; color: #111827; padding-bottom: 1mm; }
  .kt-print-contact { margin-top: 6mm; display: grid; gap: 3mm; font-size: 10px; }
  .kt-print-contact-row { display: grid; grid-template-columns: 16mm 1fr; gap: 3mm; align-items: end; }
  .kt-print-contact-row span:last-child { border-bottom: 1px solid #a9a9a9; min-height: 5mm; }
  .kt-print-table { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 2mm; }
  .kt-print-table th {
    background: #071947;
    color: white;
    padding: 4mm 2mm;
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    text-align: center;
  }
  .kt-print-table th:last-child { background: #cf1126; }
  .kt-print-table td {
    border-right: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
    padding: 5mm 3mm;
    font-size: 11px;
    color: #111827;
    vertical-align: middle;
  }
  .kt-print-table tr:last-child td { border-bottom: 0; }
  .kt-print-table td:last-child { border-right: 0; color: #c3192d; font-weight: 900; }
  .kt-print-desc strong { display: block; margin-bottom: 1.2mm; }
  .kt-print-desc span { display: block; font-size: 8px; line-height: 1.35; color: #111827; font-weight: 400; }
  .kt-print-center { text-align: center; }
  .kt-print-right { text-align: right; }
  .kt-print-bottom {
    border-top: 1px solid #cfd3da;
    margin-top: 8mm;
    padding-top: 6mm;
    display: grid;
    grid-template-columns: 1fr 1px 82mm;
    gap: 8mm;
  }
  .kt-print-payment h3 { margin: 0 0 2mm; color: #071947; font-size: 11px; font-weight: 900; text-transform: uppercase; }
  .kt-print-payment .red-short { width: 8mm; height: 0.7mm; background: #cf1126; margin-bottom: 4mm; }
  .kt-print-payment p { margin: 0; font-size: 9px; color: #111827; }
  .kt-print-summary { display: grid; gap: 3mm; }
  .kt-print-summary-row {
    display: grid;
    grid-template-columns: 1fr 22mm;
    gap: 5mm;
    font-size: 11px;
    color: #111827;
  }
  .kt-print-grand { display: grid; grid-template-columns: 1fr 32mm; align-items: center; color: white; margin-top: 1mm; }
  .kt-print-grand span:first-child { background: #071947; padding: 3.5mm 4mm; font-size: 12px; font-weight: 900; text-transform: uppercase; }
  .kt-print-grand span:last-child { background: #cf1126; padding: 3.5mm 4mm; font-size: 19px; font-weight: 900; text-align: right; }
  .kt-print-thanks { margin-top: 11mm; text-align: center; color: #071947; font-size: 11px; font-weight: 900; text-transform: uppercase; }
  .invoice-document {
    width: 194mm !important;
    max-width: 194mm !important;
    min-height: auto !important;
    margin: 0 !important;
    padding: 10mm 11mm 8mm !important;
    border: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
    color: #111827 !important;
    overflow: hidden !important;
  }
`;

export default function InvoicePage() {
  const { orders } = useStore();
  const activeOrders = orders.filter((order) => !order.archivedAt);
  const [selectedOrderId] = useState<string | null>(null);
  const [documentDate, setDocumentDate] = useState("");
  const [manifestId, setManifestId] = useState("");
  const [defaultRate, setDefaultRate] = useState("100");
  const [currencyLabel, setCurrencyLabel] = useState("Kyat");
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer / Cash / Other");
  const [companyName, setCompanyName] = useState("KT Logistic & Trading");
  const [companySubtitle, setCompanySubtitle] = useState("Kay Thi (Myawady) Trading Company Limited");
  const [companyDetailText, setCompanyDetailText] = useState(companyDetails.join("\n"));
  const [taxRate, setTaxRate] = useState("0");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemDraft[]>(() => [createDraftInvoiceItem()]);
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
  const displayDocumentDate = formatInvoiceDate(resolvedDocumentDate);
  const resolvedBillingName = billingName.trim() || selectedOrder?.customerName || "Draft Customer";
  const resolvedBillingAddress = billingAddress.trim();
  const resolvedBillingPhone = billingPhone.trim();
  const resolvedBillingEmail = billingEmail.trim();
  const resolvedPaymentMethod = paymentMethod.trim() || "Bank Transfer / Cash / Other";
  const resolvedCurrencyLabel = currencyLabel.trim() || "Kyat";
  const resolvedCompanyName = companyName.trim() || "KT Logistic & Trading";
  const resolvedCompanySubtitle = companySubtitle.trim() || "Kay Thi (Myawady) Trading Company Limited";
  const companyDetailLines = companyDetailText
    .split(/\r?\n/)
    .map((detail) => detail.trim())
    .filter(Boolean);
  const resolvedCompanyDetails = companyDetailLines.length > 0 ? companyDetailLines : companyDetails;
  const subtotal = invoiceItems.reduce((acc, item) => acc + getLineTotal(item), 0);
  const taxPercentage = parsePositiveNumber(taxRate);
  const taxAmount = subtotal * (taxPercentage / 100);
  const grandTotal = subtotal + taxAmount;

  useEffect(() => {
    if (!selectedOrder) {
      initializedOrderIdRef.current = null;
      return;
    }

    if (initializedOrderIdRef.current === selectedOrder.id) return;

    initializedOrderIdRef.current = selectedOrder.id;
    setBillingName(selectedOrder.customerName);
    setBillingAddress(selectedOrder.customerNote || "");
    setBillingPhone("");
    setBillingEmail("");
    setInvoiceItems(selectedOrder.items.map((item, index) => ({
      id: `${selectedOrder.id}-${index}-${Date.now()}`,
      name: item.name,
      subtitle: "Industrial Grade Asset",
      pricingType: "fixed",
      quantity: String(item.quantity),
      unit: item.unit || "U",
      rate: defaultRateRef.current,
      weight: String(item.quantity),
      weightUnit: "kg",
      weightRate: defaultRateRef.current,
    })));
  }, [selectedOrder]);

  const buildCurrentReceiptHtml = () => {
    const rows = invoiceItems.map((item) => {
      const lineTotal = getLineTotal(item);

      return `
        <tr>
          <td class="kt-print-center" style="width: 13%;">${escapeReceiptText(getLineQuantityDisplay(item))}</td>
          <td class="kt-print-desc" style="width: 36%;">
            <strong>${escapeReceiptText(item.name || "Cargo Item")}</strong>
            ${item.subtitle.trim() ? `<span>${escapeReceiptText(item.subtitle)}</span>` : ""}
          </td>
          <td class="kt-print-center" style="width: 17%;">${escapeReceiptText(getLineUnitDisplay(item))}</td>
          <td class="kt-print-center" style="width: 18%;">${escapeReceiptText(resolvedCurrencyLabel)} ${escapeReceiptText(getLineRateDisplay(item))}</td>
          <td class="kt-print-center" style="width: 16%;">${escapeReceiptText(resolvedCurrencyLabel)} ${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    return `
      <main class="kt-print-invoice invoice-document">
        <div class="kt-print-content">
          <section class="kt-print-top">
            <div>
              <img src="/kt-logistic-logo.jpg" alt="KT Logistic & Trading" class="kt-print-logo" />
              <div style="color:#071947;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">${escapeReceiptText(resolvedCompanyName)}</div>
            </div>
            <div>
              <h1 class="kt-print-title">Invoice</h1>
              <div class="kt-print-redline"></div>
              <div class="kt-print-date">
                <strong>Invoice Date :</strong>
                <span>${escapeReceiptText(displayDocumentDate)}</span>
              </div>
            </div>
          </section>

          <section class="kt-print-info">
            <div class="kt-print-company">
              <h2>${escapeReceiptText(resolvedCompanySubtitle)}</h2>
              <h3>Import / Export & Transportation</h3>
              <div class="small-line"></div>
              <div class="kt-print-details">
                ${resolvedCompanyDetails.map((detail) => `<div>${escapeReceiptText(detail)}</div>`).join("")}
              </div>
            </div>
            <div class="kt-print-divider"></div>
            <div>
              <div class="kt-print-bill-tag">Bill To:</div>
              <div class="kt-print-bill-lines">
                <div class="kt-print-bill-line">${escapeReceiptText(resolvedBillingName)}</div>
                <div class="kt-print-bill-line">${escapeReceiptText(resolvedBillingAddress)}</div>
                <div class="kt-print-bill-line">Invoice No: ${escapeReceiptText(resolvedManifestId)}</div>
              </div>
              <div class="kt-print-contact">
                <div class="kt-print-contact-row"><span>Phone :</span><span>${escapeReceiptText(resolvedBillingPhone)}</span></div>
                <div class="kt-print-contact-row"><span>Email :</span><span>${escapeReceiptText(resolvedBillingEmail)}</span></div>
              </div>
            </div>
          </section>

          <table class="kt-print-table">
            <thead>
              <tr>
                <th>Qty</th>
                <th>Description</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <section class="kt-print-bottom">
            <div class="kt-print-payment">
              <h3>Payment Method</h3>
              <div class="red-short"></div>
              <p>${escapeReceiptText(resolvedPaymentMethod)}</p>
            </div>
            <div class="kt-print-divider"></div>
            <div class="kt-print-summary">
              <div class="kt-print-summary-row"><span>SUBTOTAL</span><span>${escapeReceiptText(resolvedCurrencyLabel)} ${subtotal.toFixed(2)}</span></div>
              <div class="kt-print-summary-row"><span>TAX (${taxPercentage.toFixed(2)}%)</span><span>${escapeReceiptText(resolvedCurrencyLabel)} ${taxAmount.toFixed(2)}</span></div>
              <div class="kt-print-grand"><span>Grand Total</span><span>${escapeReceiptText(resolvedCurrencyLabel)} ${grandTotal.toFixed(2)}</span></div>
            </div>
          </section>

          <div class="kt-print-thanks">Thank you for your business!</div>
        </div>
      </main>
    `;
  };

  const persistReceipts = (receipts: SavedReceipt[]) => {
    setSavedReceipts(receipts);
    window.localStorage.setItem(SAVED_RECEIPTS_KEY, JSON.stringify(receipts));
  };

  const saveCurrentReceipt = () => {
    const receiptOrderId = selectedOrder?.id || "draft";
    const receipt: SavedReceipt = {
      id: `${receiptOrderId}:${resolvedManifestId}:${resolvedDocumentDate}:${Date.now()}`,
      orderId: receiptOrderId,
      manifestId: resolvedManifestId,
      documentDate: resolvedDocumentDate,
      customerName: resolvedBillingName,
      total: grandTotal,
      currencyLabel: resolvedCurrencyLabel,
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

  const handleDefaultRateChange = (value: string) => {
    setDefaultRate(value);
    setInvoiceItems((currentItems) => currentItems.map((item) => ({ ...item, rate: value, weightRate: value })));
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
        pricingType: "fixed",
        quantity: "1",
        unit: "U",
        rate: defaultRate,
        weight: "1",
        weightUnit: "kg",
        weightRate: defaultRate,
      },
    ]);
  };

  const removeInvoiceItem = (itemId: string) => {
    setInvoiceItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  };

  const resetBillDraft = () => {
    if (!selectedOrder) {
      setBillingName("");
      setBillingAddress("");
      setBillingPhone("");
      setBillingEmail("");
      setCurrencyLabel("Kyat");
      setPaymentMethod("Bank Transfer / Cash / Other");
      setCompanyName("KT Logistic & Trading");
      setCompanySubtitle("Kay Thi (Myawady) Trading Company Limited");
      setCompanyDetailText(companyDetails.join("\n"));
      setTaxRate("0");
      setInvoiceItems([createDraftInvoiceItem("draft-line-1", defaultRate)]);
      return;
    }

    setBillingName(selectedOrder.customerName);
    setBillingAddress(selectedOrder.customerNote || "");
    setBillingPhone("");
    setBillingEmail("");
    setCurrencyLabel("Kyat");
    setPaymentMethod("Bank Transfer / Cash / Other");
    setCompanyName("KT Logistic & Trading");
    setCompanySubtitle("Kay Thi (Myawady) Trading Company Limited");
    setCompanyDetailText(companyDetails.join("\n"));
    setTaxRate("0");
    setInvoiceItems(selectedOrder.items.map((item, index) => ({
      id: `${selectedOrder.id}-${index}-${Date.now()}`,
      name: item.name,
      subtitle: "Industrial Grade Asset",
      pricingType: "fixed",
      quantity: String(item.quantity),
      unit: item.unit || "U",
      rate: defaultRate,
      weight: String(item.quantity),
      weightUnit: "kg",
      weightRate: defaultRate,
    })));
  };

  const handleExportPdf = () => {
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
             className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-xl"
           >
             <Printer className="w-4 h-4" /> Print Receipt
           </button>
           <button 
             onClick={saveCurrentReceipt}
             className="flex items-center gap-2 bg-cyan-600 text-white px-5 py-3 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl"
           >
             <Save className="w-4 h-4" /> Save Receipt
           </button>
           <button 
             onClick={handleExportPdf}
             className="flex items-center gap-2 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white px-5 py-3 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg"
           >
             <Download className="w-4 h-4" /> Export PDF
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Billing Setup Pane */}
        <div className="lg:col-span-4 space-y-4">
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
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                      <BadgeDollarSign className="w-3.5 h-3.5 text-cyan-600" />
                      Currency
                    </label>
                    <input
                      value={currencyLabel}
                      onChange={(event) => setCurrencyLabel(event.target.value)}
                      placeholder="Kyat"
                      className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                    />
                  </div>
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

                     <div className="space-y-1.5">
                       <label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                         <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                         Billing Address
                       </label>
                       <textarea
                         value={billingAddress}
                         onChange={(event) => setBillingAddress(event.target.value)}
                         rows={3}
                         className="w-full resize-y bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold leading-relaxed"
                       />
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                         <label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                           <Phone className="w-3.5 h-3.5 text-cyan-600" />
                           Phone
                         </label>
                         <input
                           value={billingPhone}
                           onChange={(event) => setBillingPhone(event.target.value)}
                           className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                         />
                       </div>
                       <div className="space-y-1.5">
                         <label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                           <Mail className="w-3.5 h-3.5 text-cyan-600" />
                           Email
                         </label>
                         <input
                           value={billingEmail}
                           onChange={(event) => setBillingEmail(event.target.value)}
                           className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                         />
                       </div>
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

                     <div className="space-y-1.5">
                       <label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                         <CreditCard className="w-3.5 h-3.5 text-cyan-600" />
                         Payment Method
                       </label>
                       <input
                         value={paymentMethod}
                         onChange={(event) => setPaymentMethod(event.target.value)}
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
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => updateInvoiceItem(item.id, "pricingType", "fixed")}
                              type="button"
                              className={`border px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${item.pricingType === "fixed" ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-300" : "border-slate-200 text-slate-400 hover:border-slate-300 dark:border-slate-800"}`}
                            >
                              Fixed Price
                            </button>
                            <button
                              onClick={() => updateInvoiceItem(item.id, "pricingType", "weight")}
                              type="button"
                              className={`border px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${item.pricingType === "weight" ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-300" : "border-slate-200 text-slate-400 hover:border-slate-300 dark:border-slate-800"}`}
                            >
                              By Unit
                            </button>
                          </div>
                          {item.pricingType === "weight" ? (
                            <div className="grid grid-cols-[1fr_82px_1fr] gap-2">
                              <input
                                type="number"
                                min="0"
                                value={item.weight}
                                onChange={(event) => updateInvoiceItem(item.id, "weight", event.target.value)}
                                aria-label="Unit amount"
                                className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-3 py-2 text-right text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                              />
                              <select
                                value={item.weightUnit}
                                onChange={(event) => updateInvoiceItem(item.id, "weightUnit", event.target.value)}
                                aria-label="Unit label"
                                className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-2 py-2 text-center text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold uppercase"
                              >
                                {weightUnits.map((unit) => (
                                  <option key={unit} value={unit}>{unit}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min="0"
                                value={item.weightRate}
                                onChange={(event) => updateInvoiceItem(item.id, "weightRate", event.target.value)}
                                aria-label="Rate per unit"
                                className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-3 py-2 text-right text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                              />
                            </div>
                          ) : (
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
                            )}
                          <div className="flex items-center justify-between border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-zinc-900/40 px-3 py-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                              {item.pricingType === "weight" ? `Rate per ${item.weightUnit || "kg"}` : "Line Total"}
                            </span>
                            <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                              {resolvedCurrencyLabel} {getLineTotal(item).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                   </div>
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
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{receipt.documentDate} / {receipt.currencyLabel || "Kyat"} {receipt.total.toFixed(2)}</p>
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
                 <motion.div 
                   key={selectedOrder?.id || "draft-invoice"}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   id="invoice-export-document"
                   className="invoice-document bg-white p-6 md:p-10 border border-slate-200 shadow-2xl relative overflow-hidden text-slate-950"
                 >
                    <div className="absolute right-0 top-0 h-24 w-52 bg-[linear-gradient(45deg,transparent_0_38%,#071947_38%_67%,transparent_67%),linear-gradient(45deg,transparent_0_60%,#cf1126_60%)] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 h-24 w-72 bg-[linear-gradient(45deg,#071947_0_63%,transparent_63%),linear-gradient(45deg,transparent_0_70%,#cf1126_70%)] pointer-events-none" />

                    <div className="relative z-10">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 md:gap-12 items-start mb-8">
                        <div>
                          <Image src="/kt-logistic-logo.jpg" alt="KT Logistic & Trading" width={842} height={595} className="w-72 max-w-full h-auto object-contain" priority />
                          <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-[#071947]">{resolvedCompanyName}</p>
                        </div>
                        <div className="pt-6 md:pt-14">
                          <h2 className="text-5xl md:text-6xl font-black uppercase tracking-normal text-[#071947] leading-none">Invoice</h2>
                          <div className="w-16 h-1 bg-[#cf1126] my-5" />
                          <div className="grid grid-cols-[120px_1fr] gap-3 text-sm font-bold">
                            <span>Invoice Date :</span>
                            <span className="text-[#c3192d]">{displayDocumentDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr] gap-8 md:gap-10 mb-10">
                        <div>
                          <h1 className="text-xl md:text-2xl font-black uppercase text-[#c3192d] leading-tight">{resolvedCompanySubtitle}</h1>
                          <p className="mt-3 text-xs md:text-sm font-black uppercase text-[#c3192d]">Import / Export & Transportation</p>
                          <div className="w-24 h-1 bg-[#c3192d] my-5" />
                          <div className="space-y-3 text-xs md:text-sm font-semibold leading-relaxed text-slate-900">
                            {resolvedCompanyDetails.map((detail) => (
                              <p key={detail}>{detail}</p>
                            ))}
                          </div>
                        </div>

                        <div className="hidden md:block bg-slate-300" />

                        <div>
                          <div className="inline-flex min-w-44 bg-[#071947] text-white px-5 py-2 text-xs font-black uppercase relative after:absolute after:right-[-18px] after:top-0 after:border-y-[16px] after:border-l-[18px] after:border-y-transparent after:border-l-[#cf1126]">
                            Bill To:
                          </div>
                          <div className="mt-6 space-y-4 text-sm font-bold">
                            <p className="min-h-7 border-b border-dotted border-slate-400">{resolvedBillingName}</p>
                            <p className="min-h-7 border-b border-dotted border-slate-400 whitespace-pre-line">{resolvedBillingAddress}</p>
                            <p className="min-h-7 border-b border-dotted border-slate-400">Invoice No: {resolvedManifestId}</p>
                          </div>
                          <div className="mt-7 space-y-4 text-sm">
                            <div className="grid grid-cols-[70px_1fr] gap-3">
                              <span>Phone :</span>
                              <span className="border-b border-slate-400 min-h-6">{resolvedBillingPhone}</span>
                            </div>
                            <div className="grid grid-cols-[70px_1fr] gap-3">
                              <span>Email :</span>
                              <span className="border-b border-slate-400 min-h-6">{resolvedBillingEmail}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto custom-scrollbar mb-10">
                        <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-0 overflow-hidden rounded-t-lg border border-slate-200 text-sm">
                          <thead>
                            <tr>
                              <th className="w-[13%] bg-[#071947] px-4 py-4 text-center text-white font-black uppercase">Qty</th>
                              <th className="w-[36%] bg-[#071947] px-4 py-4 text-center text-white font-black uppercase">Description</th>
                              <th className="w-[17%] bg-[#071947] px-4 py-4 text-center text-white font-black uppercase">Unit</th>
                              <th className="w-[18%] bg-[#071947] px-4 py-4 text-center text-white font-black uppercase">Unit Price</th>
                              <th className="w-[16%] bg-[#cf1126] px-4 py-4 text-center text-white font-black uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoiceItems.map((item) => {
                              const lineTotal = getLineTotal(item);

                              return (
                                <tr key={item.id}>
                                  <td className="border-b border-r border-slate-200 px-4 py-7 text-center text-2xl font-black text-[#071947]">{getLineQuantityDisplay(item)}</td>
                                  <td className="border-b border-r border-slate-200 px-6 py-7">
                                    <p className="font-black text-slate-950">{item.name || "Cargo Item"}</p>
                                    {item.subtitle.trim() && (
                                      <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.subtitle}</p>
                                    )}
                                  </td>
                                  <td className="border-b border-r border-slate-200 px-4 py-7 text-center font-semibold">{getLineUnitDisplay(item)}</td>
                                  <td className="border-b border-r border-slate-200 px-4 py-7 text-center font-semibold">{resolvedCurrencyLabel} {getLineRateDisplay(item)}</td>
                                  <td className="border-b border-slate-200 px-4 py-7 text-center font-black text-[#c3192d]">{resolvedCurrencyLabel} {lineTotal.toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_330px] gap-8 border-t border-slate-300 pt-8">
                        <div>
                          <h3 className="text-sm font-black uppercase text-[#071947]">Payment Method</h3>
                          <div className="w-8 h-1 bg-[#cf1126] my-3" />
                          <p className="text-sm font-medium text-slate-900">{resolvedPaymentMethod}</p>
                        </div>
                        <div className="hidden md:block bg-slate-300" />
                        <div className="space-y-3">
                          <div className="grid grid-cols-[1fr_auto] gap-6 text-sm">
                            <span>SUBTOTAL</span>
                            <span>{resolvedCurrencyLabel} {subtotal.toFixed(2)}</span>
                          </div>
                          <div className="grid grid-cols-[1fr_auto] gap-6 border-b border-slate-300 pb-4 text-sm">
                            <span>TAX ({taxPercentage.toFixed(2)}%)</span>
                            <span>{resolvedCurrencyLabel} {taxAmount.toFixed(2)}</span>
                          </div>
                          <div className="grid grid-cols-[1fr_auto] items-center text-white">
                            <span className="bg-[#071947] px-4 py-3 text-lg font-black uppercase">Grand Total</span>
                            <span className="bg-[#cf1126] px-4 py-3 text-2xl font-black tabular-nums">{resolvedCurrencyLabel} {grandTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <p className="mt-14 mb-2 text-center text-sm font-black uppercase text-[#071947]">Thank you for your business!</p>
                    </div>

                 </motion.div>
           </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

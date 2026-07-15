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

const bankDetails = [
  {
    bankName: "KBZ Bank",
    accountName: "DAW EAIN DRAY KYAW NAING",
    accountNumber: "0066-1093-000-92929",
  },
  {
    bankName: "A Bank",
    accountName: "KAY THI (MYAWADY) CO.,LTD.",
    accountNumber: "0012-0111-0000-3483",
  },
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

const formatReceiptAmount = (amount: number, currencyLabel: string) =>
  `${amount.toLocaleString("en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} ${currencyLabel}`;

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
  @page { size: A4; margin: 0; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
  html, body { width: 210mm; min-height: 297mm; margin: 0; background: white; color: #111; font-family: Arial, sans-serif; }
  body { overflow: hidden; position: relative; }
  .kt-print-invoice {
    width: 190mm;
    min-height: 287mm;
    margin: 0 auto;
    padding: 18mm 0 0;
    background: #ffffff;
    position: relative;
    transform-origin: top left;
    display: flex;
    flex-direction: column;
  }
  .kt-print-content { flex: 1; width: 170mm; margin: 0 auto; }
  .kt-print-header {
    display: grid;
    grid-template-columns: 38mm 106mm 1fr;
    align-items: center;
    margin-bottom: 6mm;
  }
  .kt-print-logo { width: 32mm; height: auto; display: block; }
  .kt-print-company-box {
    border: 1px solid #b8b1a3;
    min-height: 25mm;
    padding: 2.4mm 5mm;
    text-align: center;
    color: #111;
  }
  .kt-print-company-box h1 { margin: 0; color: #d71920; font-size: 13px; line-height: 1; font-weight: 900; }
  .kt-print-company-box h2 { margin: 1mm 0 0.4mm; color: #3b2a63; font-size: 8px; line-height: 1; font-weight: 900; }
  .kt-print-company-box h3 { margin: 0 0 1.6mm; color: #3b2a63; font-size: 7px; line-height: 1; font-weight: 900; }
  .kt-print-company-detail {
    display: grid;
    gap: 0.7mm;
    margin: 0 auto;
    max-width: 95mm;
    text-align: left;
    color: #cf1126;
    font-size: 6.2px;
    line-height: 1.05;
    font-weight: 700;
  }
  .kt-print-company-detail div:before {
    content: "";
    display: inline-block;
    width: 1.2mm;
    height: 1.2mm;
    margin-right: 1.4mm;
    border-radius: 999px;
    background: #cf1126;
    vertical-align: middle;
  }
  .kt-print-meta {
    border: 1px solid #9f988b;
    margin-bottom: 5mm;
    padding: 2.8mm 5mm;
    display: grid;
    gap: 2.4mm;
    font-size: 8px;
    font-weight: 700;
  }
  .kt-print-meta-top { display: flex; justify-content: space-between; gap: 8mm; }
  .kt-print-meta strong { font-weight: 900; }
  .kt-print-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    border: 1px solid #9f988b;
    background: #f5f0e6;
  }
  .kt-print-table th {
    border: 1px solid #9f988b;
    color: #111;
    padding: 2.4mm 2mm;
    font-size: 8px;
    font-weight: 900;
    text-align: center;
    background: #f7f2e8;
  }
  .kt-print-table td {
    border: 1px solid #9f988b;
    padding: 3mm 2.4mm;
    font-size: 8px;
    color: #111;
    vertical-align: middle;
    background: #f5f0e6;
  }
  .kt-print-table .kt-print-no { width: 9%; text-align: center; }
  .kt-print-table .kt-print-desc { width: 37%; text-align: center; line-height: 1.15; }
  .kt-print-table .kt-print-qty { width: 24%; text-align: center; }
  .kt-print-table .kt-print-amount { width: 30%; text-align: center; }
  .kt-print-desc strong { display: block; font-weight: 400; }
  .kt-print-desc span { display: block; margin-top: 0.5mm; font-size: 6.7px; line-height: 1.08; color: #222; font-weight: 400; }
  .kt-print-center { text-align: center; }
  .kt-print-total-label { text-align: center; font-weight: 400; }
  .kt-print-total-amount { text-align: center; font-weight: 400; line-height: 1.35; }
  .kt-print-footer {
    margin-top: 72mm;
    padding-bottom: 10mm;
  }
  .kt-print-footer-box {
    border: 1px solid #9f988b;
    background: #f5f0e6;
    display: grid;
    grid-template-columns: 1fr 54mm;
    min-height: 52mm;
    width: 170mm;
    margin: 0 auto;
  }
  .kt-print-bank { padding: 5mm 4mm; }
  .kt-print-bank-section + .kt-print-bank-section { margin-top: 5mm; }
  .kt-print-bank-title {
    margin: 0 0 3mm;
    color: #d71920;
    font-size: 8px;
    font-style: italic;
    font-weight: 900;
    text-decoration: underline;
  }
  .kt-print-bank-line { margin: 0 0 2mm; font-size: 7.2px; font-weight: 700; }
  .kt-print-bank-line strong { font-weight: 900; }
  .kt-print-signatures { border-left: 1px solid #9f988b; display: grid; grid-template-rows: 18mm 1fr; }
  .kt-print-signature-cell { border-bottom: 1px solid #9f988b; padding: 3mm 2mm; text-align: center; font-size: 7.5px; overflow: hidden; }
  .kt-print-signature-cell:last-child { border-bottom: 0; }
  .kt-print-signature-title { text-align: left; margin: 0; font-size: 7.5px; font-weight: 400; }
  .kt-print-account-signature { display: block; width: 50mm; max-height: 31mm; height: auto; margin: 0 auto; object-fit: contain; mix-blend-mode: multiply; }
  .invoice-document {
    width: 190mm !important;
    max-width: 190mm !important;
    min-height: 287mm !important;
    margin: 0 !important;
    padding: 18mm 0 0 !important;
    border: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
    color: #111 !important;
  }
  @media print {
    html, body { width: 210mm; height: 297mm; overflow: hidden !important; }
    .kt-print-invoice {
      position: absolute !important;
      left: 10mm !important;
      top: 0 !important;
      margin: 0 !important;
      transform: scale(var(--kt-print-scale, 1));
    }
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
      if (stored) {
        const parsedReceipts = JSON.parse(stored) as SavedReceipt[];
        const normalizedReceipts = parsedReceipts.map((receipt) => ({
          ...receipt,
          html: normalizeReceiptHtml(receipt.html),
        }));

        setSavedReceipts(normalizedReceipts);
        if (JSON.stringify(parsedReceipts) !== JSON.stringify(normalizedReceipts)) {
          window.localStorage.setItem(SAVED_RECEIPTS_KEY, JSON.stringify(normalizedReceipts));
        }
      }
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
  const resolvedCurrencyLabel = currencyLabel.trim() || "Kyat";
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
    const rows = invoiceItems.map((item, index) => {
      const lineTotal = getLineTotal(item);

      return `
        <tr>
          <td class="kt-print-no">${index + 1}.</td>
          <td class="kt-print-desc">
            <strong>${escapeReceiptText(item.name || "Cargo Item")}</strong>
            ${item.subtitle.trim() ? `<span>${escapeReceiptText(item.subtitle)}</span>` : ""}
          </td>
          <td class="kt-print-qty">${escapeReceiptText(getLineQuantityDisplay(item))}</td>
          <td class="kt-print-amount">${escapeReceiptText(formatReceiptAmount(lineTotal, resolvedCurrencyLabel))}</td>
        </tr>
      `;
    }).join("");

    const bankRows = bankDetails.map((bank) => `
      <div class="kt-print-bank-section">
        <p class="kt-print-bank-title">Bank Name: ${escapeReceiptText(bank.bankName)}</p>
        <p class="kt-print-bank-line"><strong>Account Name:</strong> ${escapeReceiptText(bank.accountName)}</p>
        <p class="kt-print-bank-line"><strong>Account Number:</strong> ${escapeReceiptText(bank.accountNumber)}</p>
      </div>
    `).join("");

    return `
      <main class="kt-print-invoice invoice-document">
        <div class="kt-print-content">
          <section class="kt-print-header">
            <img src="/kt-logistic-logo.jpg" alt="KT Logistic & Trading" class="kt-print-logo" />
            <div class="kt-print-company-box">
              <h1>KAY THI (MYAWADY)</h1>
              <h2>TRADING COMPANY LIMITED</h2>
              <h3>EXPORT / IMPORT & TRANSPORTATION</h3>
              <div class="kt-print-company-detail">
                ${resolvedCompanyDetails.map((detail) => `<div>${escapeReceiptText(detail)}</div>`).join("")}
              </div>
            </div>
            <div></div>
          </section>

          <section class="kt-print-meta">
            <div class="kt-print-meta-top">
              <span><strong>Invoice No:</strong> ${escapeReceiptText(resolvedManifestId)}</span>
              <span><strong>Invoice Date:</strong> ${escapeReceiptText(displayDocumentDate)}</span>
            </div>
            <div><strong>Customer's Name:</strong> ${escapeReceiptText(resolvedBillingName)}</div>
            <div><strong>Address:</strong> ${escapeReceiptText(resolvedBillingAddress || "-")}</div>
            ${resolvedBillingPhone ? `<div><strong>Phone:</strong> ${escapeReceiptText(resolvedBillingPhone)}</div>` : ""}
            ${resolvedBillingEmail ? `<div><strong>Email:</strong> ${escapeReceiptText(resolvedBillingEmail)}</div>` : ""}
          </section>

          <table class="kt-print-table">
            <thead>
              <tr>
                <th class="kt-print-no">No.</th>
                <th class="kt-print-desc">Description</th>
                <th class="kt-print-qty">Quantity</th>
                <th class="kt-print-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr>
                <td class="kt-print-no"></td>
                <td class="kt-print-total-label" colspan="2">Total Amount</td>
                <td class="kt-print-total-amount">
                  ${escapeReceiptText(formatReceiptAmount(subtotal, resolvedCurrencyLabel))}
                  ${taxPercentage > 0 ? `<br />${escapeReceiptText(formatReceiptAmount(grandTotal, resolvedCurrencyLabel))}` : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <section class="kt-print-footer">
          <div class="kt-print-footer-box">
            <div class="kt-print-bank">
              ${bankRows}
            </div>
            <div class="kt-print-signatures">
              <div class="kt-print-signature-cell">
                <p class="kt-print-signature-title">CUSTOMER Signature</p>
              </div>
              <div class="kt-print-signature-cell">
                <img src="/account-signature.png" alt="Account signature" class="kt-print-account-signature" />
              </div>
            </div>
          </div>
        </section>
      </main>
    `;
  };

  const persistReceipts = (receipts: SavedReceipt[]) => {
    setSavedReceipts(receipts);
    window.localStorage.setItem(SAVED_RECEIPTS_KEY, JSON.stringify(receipts));
  };

  const normalizeReceiptHtml = (html: string) => {
    if (!html.includes("<th>Qty</th>") || !html.includes("<th>Description</th>")) return html;

    const template = document.createElement("template");
    template.innerHTML = html;

    const table = template.content.querySelector(".kt-print-table");
    const headerRow = table?.querySelector("thead tr");
    const headers = headerRow ? Array.from(headerRow.children) : [];
    const hasOldOrder =
      headers[0]?.textContent?.trim().toLowerCase() === "qty" &&
      headers[1]?.textContent?.trim().toLowerCase() === "description";

    if (!table || !headerRow || !hasOldOrder) return html;

    headerRow.insertBefore(headers[1], headers[0]);
    table.querySelectorAll("tbody tr").forEach((row) => {
      const qtyCell = row.children[0];
      const descriptionCell = row.children[1];
      if (qtyCell && descriptionCell) row.insertBefore(descriptionCell, qtyCell);
    });

    return template.innerHTML;
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
          ${normalizeReceiptHtml(html)}
          <script>
            function applyOnePageInvoiceScale() {
              var invoice = document.querySelector(".kt-print-invoice");
              if (!invoice) return;

              var probe = document.createElement("div");
              probe.style.position = "absolute";
              probe.style.visibility = "hidden";
              probe.style.pointerEvents = "none";
              probe.style.height = "277mm";
              document.body.appendChild(probe);

              invoice.style.setProperty("--kt-print-scale", "1");
              var availableHeight = probe.getBoundingClientRect().height;
              var invoiceHeight = invoice.scrollHeight;
              var scale = Math.min(1, availableHeight / Math.max(invoiceHeight, 1));
              invoice.style.setProperty("--kt-print-scale", String(Math.max(scale, 0.01)));
              probe.remove();
            }

            window.addEventListener("beforeprint", applyOnePageInvoiceScale);
            window.addEventListener("load", function () {
              window.focus();
              applyOnePageInvoiceScale();
              setTimeout(function () {
                applyOnePageInvoiceScale();
                window.print();
              }, 150);
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
    <div className="mx-auto max-w-7xl space-y-6 px-3 pb-20 sm:px-4 lg:px-0 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white outfit sm:text-4xl md:text-5xl">
            Billing <span className="text-cyan-500">Office</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] mt-2">KT Logistic invoice generation and transport billing.</p>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 md:w-auto">
           <button 
             onClick={handleExportPdf} 
             className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-xl"
           >
             <Printer className="w-4 h-4" /> Print Receipt
           </button>
           <button 
             onClick={saveCurrentReceipt}
             className="flex items-center justify-center gap-2 bg-cyan-600 text-white px-4 py-3 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl"
           >
             <Save className="w-4 h-4" /> Save Receipt
           </button>
           <button 
             onClick={handleExportPdf}
             className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white px-4 py-3 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg"
           >
             <Download className="w-4 h-4" /> Export PDF
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        
        {/* Billing Setup Pane */}
        <div className="space-y-4 lg:col-span-4">
           <div className="saas-card rounded-none border border-cyan-100 bg-cyan-50/30 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/10 sm:p-6">
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
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_82px_1fr]">
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
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_76px_1fr]">
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

           <div className="saas-card rounded-none border border-slate-100 bg-white p-4 dark:border-zinc-800 dark:bg-black sm:p-6">
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

           <div className="saas-card rounded-none border border-slate-100 bg-slate-50 p-4 text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                 <FileText className="w-5 h-5" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Legal Notice</p>
              </div>
              <p className="text-[10px] leading-relaxed font-bold">Invoices are generated for KT Logistic & Trading export, import, and transportation records.</p>
           </div>
        </div>

        {/* Invoice Preview Pane */}
        <div className="min-w-0 lg:col-span-8">
          <div className="invoice-preview-frame">
            <AnimatePresence mode="wait">
                 <motion.div 
                   key={selectedOrder?.id || "draft-invoice"}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="invoice-preview-motion"
                 >
                  <div
                    id="invoice-export-document"
                    className="invoice-document w-[190mm] bg-white border border-slate-200 shadow-2xl relative text-slate-950"
                  >
                    <div className="flex min-h-[287mm] flex-col pt-[18mm] pb-[10mm]">
                      <div className="mx-auto w-[170mm] max-w-[calc(100%-20mm)] flex-1">
                        <div className="mb-6 grid grid-cols-[38mm_106mm_1fr] items-center">
                          <Image src="/kt-logistic-logo.jpg" alt="KT Logistic & Trading" width={842} height={595} className="w-[32mm] h-auto object-contain" priority />
                          <div className="min-h-[25mm] border border-[#b8b1a3] px-5 py-2.5 text-center">
                            <h1 className="text-[13px] font-black leading-none text-[#d71920]">KAY THI (MYAWADY)</h1>
                            <h2 className="mt-1 text-[8px] font-black leading-none text-[#3b2a63]">TRADING COMPANY LIMITED</h2>
                            <h3 className="mt-0.5 text-[7px] font-black leading-none text-[#3b2a63]">EXPORT / IMPORT & TRANSPORTATION</h3>
                            <div className="mx-auto mt-2 grid max-w-[95mm] gap-0.5 text-left text-[6.2px] font-bold leading-tight text-[#cf1126]">
                              {resolvedCompanyDetails.map((detail) => (
                                <p key={detail}><span className="mr-1 text-[5px]">*</span>{detail}</p>
                              ))}
                            </div>
                          </div>
                          <div />
                        </div>

                        <div className="mb-5 grid gap-2 border border-[#9f988b] px-5 py-2.5 text-[8px] font-bold">
                          <div className="flex justify-between gap-8">
                            <span><strong className="font-black">Invoice No:</strong> {resolvedManifestId}</span>
                            <span><strong className="font-black">Invoice Date:</strong> {displayDocumentDate}</span>
                          </div>
                          <p><strong className="font-black">Customer&apos;s Name:</strong> {resolvedBillingName}</p>
                          <p><strong className="font-black">Address:</strong> {resolvedBillingAddress || "-"}</p>
                          {resolvedBillingPhone && <p><strong className="font-black">Phone:</strong> {resolvedBillingPhone}</p>}
                          {resolvedBillingEmail && <p><strong className="font-black">Email:</strong> {resolvedBillingEmail}</p>}
                        </div>

                        <table className="w-full table-fixed border-collapse border border-[#9f988b] bg-[#f5f0e6] text-[8px]">
                          <thead>
                            <tr>
                              <th className="w-[9%] border border-[#9f988b] px-2 py-2.5 text-center font-black">No.</th>
                              <th className="w-[37%] border border-[#9f988b] px-2 py-2.5 text-center font-black">Description</th>
                              <th className="w-[24%] border border-[#9f988b] px-2 py-2.5 text-center font-black">Quantity</th>
                              <th className="w-[30%] border border-[#9f988b] px-2 py-2.5 text-center font-black">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoiceItems.map((item, index) => {
                              const lineTotal = getLineTotal(item);

                              return (
                                <tr key={item.id}>
                                  <td className="border border-[#9f988b] px-2 py-3 text-center align-middle">{index + 1}.</td>
                                  <td className="border border-[#9f988b] px-2 py-3 text-center align-middle leading-tight">
                                    <p>{item.name || "Cargo Item"}</p>
                                    {item.subtitle.trim() && (
                                      <p className="mt-1 text-[6.7px] leading-tight">{item.subtitle}</p>
                                    )}
                                  </td>
                                  <td className="border border-[#9f988b] px-2 py-3 text-center align-middle">{getLineQuantityDisplay(item)}</td>
                                  <td className="border border-[#9f988b] px-2 py-3 text-center align-middle">{formatReceiptAmount(lineTotal, resolvedCurrencyLabel)}</td>
                                </tr>
                              );
                            })}
                            <tr>
                              <td className="border border-[#9f988b] px-2 py-3"></td>
                              <td className="border border-[#9f988b] px-2 py-3 text-center" colSpan={2}>Total Amount</td>
                              <td className="border border-[#9f988b] px-2 py-3 text-center leading-tight">
                                {formatReceiptAmount(subtotal, resolvedCurrencyLabel)}
                                {taxPercentage > 0 && (
                                  <>
                                    <br />
                                    {formatReceiptAmount(grandTotal, resolvedCurrencyLabel)}
                                  </>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-[72mm]">
                        <div className="mx-auto grid min-h-[52mm] w-[170mm] max-w-[calc(100%-20mm)] grid-cols-[1fr_54mm] border border-[#9f988b] bg-[#f5f0e6]">
                          <div className="px-4 py-5">
                            {bankDetails.map((bank) => (
                              <div key={bank.bankName} className="mb-5 last:mb-0">
                                <p className="mb-3 text-[8px] font-black italic text-[#d71920] underline">Bank Name: {bank.bankName}</p>
                                <p className="mb-2 text-[7.2px] font-bold"><strong className="font-black">Account Name:</strong> {bank.accountName}</p>
                                <p className="mb-2 text-[7.2px] font-bold"><strong className="font-black">Account Number:</strong> {bank.accountNumber}</p>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-rows-[18mm_1fr] border-l border-[#9f988b]">
                            <div className="overflow-hidden border-b border-[#9f988b] p-3">
                              <p className="text-left text-[7.5px]">CUSTOMER Signature</p>
                            </div>
                            <div className="overflow-hidden px-2 py-1.5 text-center">
                              <Image src="/account-signature.png" alt="Account signature" width={2140} height={1430} className="mx-auto h-auto max-h-[31mm] w-[50mm] object-contain mix-blend-multiply" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                 </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}

"use client";

import { useStore, type Incoming, type Order } from "@/lib/store";
import { CalendarDays, Download, ShoppingCart, Truck } from "lucide-react";
import { useMemo, useState } from "react";

type ReportKind = "incoming" | "orders" | "both";
type SheetRow = Record<string, string | number>;
type WorkbookSheet = {
  name: string;
  rows: SheetRow[];
  headers: string[];
};

const getLocalDateKey = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayKey = () => getLocalDateKey(new Date().toISOString());

const formatDateTime = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const formatDate = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return getLocalDateKey(dateValue);
};

const escapeXml = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const isNumericCell = (value: string | number) => typeof value === "number" && Number.isFinite(value);

const buildWorksheetXml = ({ name, rows, headers }: WorkbookSheet) => {
  const sheetRows = rows.length > 0 ? rows : [Object.fromEntries(headers.map((header) => [header, ""])) as SheetRow];
  const headerCells = headers
    .map((header) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`)
    .join("");
  const bodyRows = sheetRows
    .map((row) => {
      const cells = headers
        .map((header) => {
          const value = row[header] ?? "";
          const type = isNumericCell(value) ? "Number" : "String";
          return `<Cell><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `
    <Worksheet ss:Name="${escapeXml(name.slice(0, 31))}">
      <Table>
        <Row>${headerCells}</Row>
        ${bodyRows}
      </Table>
    </Worksheet>
  `;
};

const downloadWorkbook = (fileName: string, sheets: WorkbookSheet[]) => {
  const workbookXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  ${sheets.map(buildWorksheetXml).join("")}
</Workbook>`;

  const blob = new Blob([workbookXml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const flattenIncomingRows = (incomingList: Incoming[]): SheetRow[] => incomingList.flatMap((shipment) =>
  shipment.items.map((item, index) => ({
    "Report Type": "Incoming",
    "Arrival Date": formatDate(shipment.arrivalTime),
    "Arrival Time": formatDateTime(shipment.arrivalTime),
    "Shipment ID": shipment.id,
    "Supplier": shipment.supplierName,
    "Car Number": shipment.carNumber,
    "Main Container": shipment.containerNumber,
    "Item Container": item.containerNumber || shipment.containerNumber,
    "Header": item.inventorySectionTitle || "",
    "Product": item.name,
    "Quantity": item.quantity,
    "Unit": item.unit || "units",
    "Status": shipment.status.replaceAll("_", " "),
    "Line": index + 1,
    "Note": shipment.note || "",
  }))
);

const flattenOrderRows = (orders: Order[]): SheetRow[] => orders.flatMap((order) =>
  order.items.map((item, index) => ({
    "Report Type": "Order",
    "Order Date": formatDate(order.orderTime),
    "Order Time": formatDateTime(order.orderTime),
    "Order ID": order.id,
    "Customer": order.customerName,
    "Delivery Car": order.carNumber,
    "Product": item.name,
    "Quantity": item.quantity,
    "Unit": item.unit || "units",
    "Container": item.containerNumber || "",
    "Status": order.status.replaceAll("_", " "),
    "Target Date": formatDate(order.finalDate),
    "Line": index + 1,
    "Customer Note": order.customerNote || "",
  }))
);

const incomingHeaders = [
  "Report Type",
  "Arrival Date",
  "Arrival Time",
  "Shipment ID",
  "Supplier",
  "Car Number",
  "Main Container",
  "Item Container",
  "Header",
  "Product",
  "Quantity",
  "Unit",
  "Status",
  "Line",
  "Note",
];

const orderHeaders = [
  "Report Type",
  "Order Date",
  "Order Time",
  "Order ID",
  "Customer",
  "Delivery Car",
  "Product",
  "Quantity",
  "Unit",
  "Container",
  "Status",
  "Target Date",
  "Line",
  "Customer Note",
];

export default function ExtractPage() {
  const { incomingList, orders } = useStore();
  const [reportDate, setReportDate] = useState(getTodayKey());

  const dailyIncoming = useMemo(
    () => incomingList.filter((shipment) => getLocalDateKey(shipment.arrivalTime) === reportDate),
    [incomingList, reportDate]
  );

  const dailyOrders = useMemo(
    () => orders.filter((order) => getLocalDateKey(order.orderTime) === reportDate),
    [orders, reportDate]
  );

  const incomingRows = useMemo(() => flattenIncomingRows(dailyIncoming), [dailyIncoming]);
  const orderRows = useMemo(() => flattenOrderRows(dailyOrders), [dailyOrders]);
  const incomingQuantity = incomingRows.reduce((sum, row) => sum + Number(row.Quantity || 0), 0);
  const orderQuantity = orderRows.reduce((sum, row) => sum + Number(row.Quantity || 0), 0);

  const downloadReport = (kind: ReportKind) => {
    const summaryRows: SheetRow[] = [
      { "Metric": "Report Date", "Value": reportDate },
      { "Metric": "Incoming Shipments", "Value": dailyIncoming.length },
      { "Metric": "Incoming Item Lines", "Value": incomingRows.length },
      { "Metric": "Incoming Quantity", "Value": incomingQuantity },
      { "Metric": "Orders", "Value": dailyOrders.length },
      { "Metric": "Order Item Lines", "Value": orderRows.length },
      { "Metric": "Order Quantity", "Value": orderQuantity },
      { "Metric": "Generated At", "Value": new Date().toLocaleString() },
    ];
    const sheets: WorkbookSheet[] = [
      { name: "Summary", rows: summaryRows, headers: ["Metric", "Value"] },
    ];

    if (kind === "incoming" || kind === "both") {
      sheets.push({ name: "Incoming", rows: incomingRows, headers: incomingHeaders });
    }

    if (kind === "orders" || kind === "both") {
      sheets.push({ name: "Orders", rows: orderRows, headers: orderHeaders });
    }

    const reportLabel = kind === "both" ? "incoming-orders" : kind;
    downloadWorkbook(`kt-logistic-${reportLabel}-${reportDate}.xls`, sheets);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter outfit uppercase italic">
            Daily <span className="text-emerald-500">Extract</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] mt-2">Excel reports for incoming shipments and outgoing orders.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
          <button
            onClick={() => downloadReport("incoming")}
            className="h-[52px] min-w-40 flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-zinc-800 px-5 py-3 rounded-none font-black text-[10px] uppercase tracking-widest hover:border-rose-500 hover:text-rose-600 transition-all shadow-lg"
            type="button"
          >
            <Truck className="w-4 h-4" /> Incoming
          </button>
          <button
            onClick={() => downloadReport("orders")}
            className="h-[52px] min-w-40 flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-zinc-800 px-5 py-3 rounded-none font-black text-[10px] uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-lg"
            type="button"
          >
            <ShoppingCart className="w-4 h-4" /> Orders
          </button>
          <button
            onClick={() => downloadReport("both")}
            className="h-[52px] min-w-40 flex items-center justify-center gap-2 bg-slate-950 dark:bg-white text-white dark:text-black border-2 border-slate-950 dark:border-white px-5 py-3 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-all shadow-xl"
            type="button"
          >
            <Download className="w-4 h-4" /> Both
          </button>
        </div>
      </div>

      <section className="saas-card p-6 rounded-none border-t-4 border-t-emerald-500 bg-white dark:bg-black">
        <div className="max-w-sm space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-wider">
            <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
            Report Date
          </label>
          <input
            type="date"
            value={reportDate}
            onChange={(event) => setReportDate(event.target.value)}
            className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-none px-4 py-3 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Incoming Shipments", value: dailyIncoming.length, tone: "text-rose-600" },
          { label: "Incoming Quantity", value: incomingQuantity, tone: "text-rose-600" },
          { label: "Orders", value: dailyOrders.length, tone: "text-indigo-600" },
          { label: "Order Quantity", value: orderQuantity, tone: "text-indigo-600" },
        ].map((metric) => (
          <div key={metric.label} className="saas-card p-5 rounded-none bg-white dark:bg-black border border-slate-100 dark:border-zinc-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{metric.label}</p>
            <p className={`text-3xl font-black outfit italic mt-2 ${metric.tone}`}>{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="saas-card rounded-none bg-white dark:bg-black border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Incoming Preview</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">{incomingRows.length} lines</span>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-400">
                <tr>
                  {["Supplier", "Car", "Container", "Product", "Qty", "Status"].map((header) => (
                    <th key={header} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                {incomingRows.slice(0, 8).map((row, index) => (
                  <tr key={`${row["Shipment ID"]}-${index}`}>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-zinc-300">{row.Supplier}</td>
                    <td className="px-4 py-3 text-xs font-black text-slate-900 dark:text-white">{row["Car Number"]}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-500">{row["Item Container"]}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-zinc-300">{row.Product}</td>
                    <td className="px-4 py-3 text-xs font-black text-rose-600">{row.Quantity} {row.Unit}</td>
                    <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{row.Status}</td>
                  </tr>
                ))}
                {incomingRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-xs font-black uppercase tracking-widest text-slate-400">No incoming records for this date.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="saas-card rounded-none bg-white dark:bg-black border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Orders Preview</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{orderRows.length} lines</span>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-400">
                <tr>
                  {["Customer", "Car", "Container", "Product", "Qty", "Status"].map((header) => (
                    <th key={header} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                {orderRows.slice(0, 8).map((row, index) => (
                  <tr key={`${row["Order ID"]}-${index}`}>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-zinc-300">{row.Customer}</td>
                    <td className="px-4 py-3 text-xs font-black text-slate-900 dark:text-white">{row["Delivery Car"]}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-500">{row.Container}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-zinc-300">{row.Product}</td>
                    <td className="px-4 py-3 text-xs font-black text-indigo-600">{row.Quantity} {row.Unit}</td>
                    <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{row.Status}</td>
                  </tr>
                ))}
                {orderRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-xs font-black uppercase tracking-widest text-slate-400">No order records for this date.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

import { create } from 'zustand';
import {
  canUseSupabase,
  fetchGarageSnapshot,
  saveGarageSnapshot,
} from "@/lib/supabase/logistics";

export type IncomingStatus = "ON_THE_WAY" | "AT_BRIDGE" | "IN_GARAGE";
export type OrderStatus = "PENDING" | "PREPARING" | "ON_THE_WAY" | "DELIVERED";
export type LogType = "INCOMING" | "OUTGOING" | "MANUAL";

export interface ItemDetail {
  name: string;
  quantity: number;
  unit?: string;
  containerId?: string;
  containerNumber?: string;
  inventorySectionId?: string;
  inventorySectionTitle?: string;
}

export interface Incoming {
  id: string;
  containerNumber: string;
  carNumber: string;
  supplierName: string;
  items: ItemDetail[];
  status: IncomingStatus;
  arrivalTime: string;
  durationHours: number;
  note?: string;
}

export interface Order {
  id: string;
  customerName: string;
  carNumber: string;
  items: ItemDetail[];
  status: OrderStatus;
  orderTime: string;
  finalDate: string;
  customerNote?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  inventorySectionId: string;
  inventorySectionTitle: string;
  itemName: string;
  quantity: number;
  unit?: string;
  updatedAt: string;
}

export interface InventorySection {
  id: string;
  title: string;
  createdAt: string;
}

export interface ContainerStock {
  id: string;
  containerId: string;
  containerNumber: string;
  carNumber: string;
  supplierName: string;
  inventorySectionId: string;
  inventorySectionTitle: string;
  productName: string;
  initialQuantity: number;
  remainingQuantity: number;
  unit?: string;
  receivedAt: string;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  type: LogType;
  message: string;
  timestamp: string;
  operator?: string;
}

interface GarageState {
  isHydrated: boolean;
  isSyncing: boolean;
  syncError?: string;

  incomingList: Incoming[];
  orders: Order[];
  customers: Customer[];
  inventorySections: InventorySection[];
  inventory: InventoryItem[];
  containerStock: ContainerStock[];
  logs: LogEntry[];

  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => { ok: boolean; customer?: Customer; message?: string };
  updateCustomer: (id: string, customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => { ok: boolean; message?: string };
  deleteCustomer: (id: string) => void;
  addInventorySection: (title: string) => void;
  updateInventorySection: (id: string, title: string) => void;
  deleteInventorySection: (id: string) => void;
  addIncoming: (entry: Omit<Incoming, 'id' | 'status' | 'arrivalTime' | 'durationHours'> & { arrivalTime?: string, durationHours?: number }) => void;
  updateIncoming: (id: string, entry: Omit<Incoming, 'id' | 'status'>) => void;
  deleteIncoming: (id: string) => void;
  updateIncomingStatus: (id: string, status: IncomingStatus) => void;

  addOrder: (order: Omit<Order, 'id' | 'status' | 'orderTime' | 'finalDate'> & { orderTime?: string, finalDate?: string }) => { ok: boolean; message?: string };
  updateOrder: (id: string, order: Omit<Order, 'id' | 'status'>) => { ok: boolean; message?: string };
  deleteOrder: (id: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;

  updateInventoryManual: (itemName: string, quantity: number, difference: number, unit?: string, containerNumber?: string, inventorySectionId?: string) => void;
  updateStockRow: (id: string, updates: Pick<ContainerStock, 'containerNumber' | 'productName' | 'remainingQuantity' | 'unit' | 'inventorySectionId'>) => void;
  deleteStockRow: (id: string) => void;
  addLog: (type: LogType, message: string) => void;
  loadRemoteData: () => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_SECTION_ID = "section-general";

const initialInventorySections: InventorySection[] = [
  {
    id: "seed-section-engine",
    title: "Engine Parts",
    createdAt: "2026-05-01T08:00:00.000Z",
  },
  {
    id: "seed-section-tires",
    title: "Tires And Wheels",
    createdAt: "2026-05-01T08:05:00.000Z",
  },
  {
    id: "seed-section-oils",
    title: "Oils And Fluids",
    createdAt: "2026-05-01T08:10:00.000Z",
  },
];

const resolveSection = (sectionId: string | undefined, sections: InventorySection[]) => {
  return sections.find((section) => section.id === sectionId) || sections[0] || {
    id: DEFAULT_SECTION_ID,
    title: "General Stock",
    createdAt: new Date().toISOString(),
  };
};

const recalculateInventory = (stock: ContainerStock[], sections: InventorySection[] = initialInventorySections): InventoryItem[] => {
  const grouped = new Map<string, InventoryItem>();

  stock.forEach((row) => {
    const section = resolveSection(row.inventorySectionId, sections);
    const key = `${section.id}:${row.productName.toLowerCase()}`;
    const existing = grouped.get(key);

    if (existing) {
      grouped.set(key, {
        ...existing,
        quantity: existing.quantity + row.remainingQuantity,
        unit: existing.unit || row.unit,
        updatedAt: row.updatedAt > existing.updatedAt ? row.updatedAt : existing.updatedAt,
      });
      return;
    }

    grouped.set(key, {
      id: `inv-${key.replace(/[^a-z0-9]+/g, '-') || generateId()}`,
      inventorySectionId: section.id,
      inventorySectionTitle: section.title,
      itemName: row.productName,
      quantity: row.remainingQuantity,
      unit: row.unit,
      updatedAt: row.updatedAt,
    });
  });

  return Array.from(grouped.values()).sort((a, b) =>
    a.inventorySectionTitle.localeCompare(b.inventorySectionTitle) || a.itemName.localeCompare(b.itemName)
  );
};

const createStockRows = (
  incoming: Incoming,
  existingRows: ContainerStock[] = [],
  sections: InventorySection[] = initialInventorySections
): ContainerStock[] => {
  const alreadyStocked = existingRows.some((row) => row.containerId === incoming.id);
  if (alreadyStocked) return existingRows;

  const timestamp = new Date().toISOString();
  const stockRows = incoming.items.map((item, index) => {
    const section = resolveSection(item.inventorySectionId, sections);

    return {
      id: `stock-${incoming.id}-${index + 1}`,
      containerId: incoming.id,
      containerNumber: item.containerNumber || incoming.containerNumber || "NO-CONTAINER",
      carNumber: incoming.carNumber,
      supplierName: incoming.supplierName,
      inventorySectionId: section.id,
      inventorySectionTitle: section.title,
      productName: item.name,
      initialQuantity: item.quantity,
      remainingQuantity: item.quantity,
      unit: item.unit,
      receivedAt: incoming.arrivalTime,
      updatedAt: timestamp,
    };
  });

  return [...stockRows, ...existingRows];
};

type SnapshotState = Pick<
  GarageState,
  "incomingList" |
  "orders" |
  "customers" |
  "inventorySections" |
  "inventory" |
  "containerStock" |
  "logs"
>;

type SetGarageState = (partial: Partial<GarageState> | ((state: GarageState) => Partial<GarageState>)) => void;
type SyncScope = "all" | "incoming" | "inventory" | "orders" | "customers" | "logs";

const getSnapshot = (state: GarageState): SnapshotState => ({
  incomingList: state.incomingList,
  orders: state.orders,
  customers: state.customers,
  inventorySections: state.inventorySections,
  inventory: state.inventory,
  containerStock: state.containerStock,
  logs: state.logs,
});

const prototypeIds = {
  incoming: new Set(["cnt-1", "cnt-2", "cnt-3", "cnt-4", "cnt-5", "cnt-6"]),
  orders: new Set(["101", "102", "103", "104"]),
  customers: new Set(["cust-1", "cust-2", "cust-3", "cust-4"]),
  sections: new Set(["section-engine", "section-service", "section-wheels", "section-electrical", "section-body", DEFAULT_SECTION_ID]),
  logs: new Set(["log-1", "log-2", "log-3", "log-4"]),
};

const removePrototypeData = (snapshot: SnapshotState) => {
  const inventorySections = snapshot.inventorySections.filter((section) => !prototypeIds.sections.has(section.id));
  const containerStock = snapshot.containerStock.filter((row) => !row.id.startsWith("stock-cnt-"));
  const cleanedSnapshot: SnapshotState = {
    incomingList: snapshot.incomingList.filter((incoming) => !prototypeIds.incoming.has(incoming.id)),
    orders: snapshot.orders.filter((order) => !prototypeIds.orders.has(order.id)),
    customers: snapshot.customers.filter((customer) => !prototypeIds.customers.has(customer.id)),
    inventorySections,
    containerStock,
    inventory: recalculateInventory(containerStock, inventorySections),
    logs: snapshot.logs.filter((log) => !prototypeIds.logs.has(log.id)),
  };

  const removedCount =
    snapshot.incomingList.length - cleanedSnapshot.incomingList.length +
    snapshot.orders.length - cleanedSnapshot.orders.length +
    snapshot.customers.length - cleanedSnapshot.customers.length +
    snapshot.inventorySections.length - cleanedSnapshot.inventorySections.length +
    snapshot.containerStock.length - cleanedSnapshot.containerStock.length +
    snapshot.logs.length - cleanedSnapshot.logs.length;

  return { snapshot: cleanedSnapshot, removedCount };
};

let syncQueue = Promise.resolve();

const queueRemoteSync = (state: GarageState, set: SetGarageState, scope: SyncScope = "all") => {
  if (!canUseSupabase()) return;

  const snapshot = getSnapshot(state);
  set({ isSyncing: true, syncError: undefined });

  syncQueue = syncQueue
    .then(() => saveGarageSnapshot(snapshot, scope))
    .then(() => set({ isSyncing: false }))
    .catch((error) => {
      set({
        isSyncing: false,
        syncError: error instanceof Error ? error.message : "Could not sync with Supabase.",
      });
    });
};

const initialIncomingList: Incoming[] = [
  {
    id: "seed-incoming-1",
    containerNumber: "CNT-2401",
    carNumber: "YGN-4582",
    supplierName: "Bangkok Auto Supply",
    status: "IN_GARAGE",
    arrivalTime: "2026-05-09T03:30:00.000Z",
    durationHours: 24,
    note: "Priority shipment for retail orders.",
    items: [
      {
        name: "Oil Filter",
        quantity: 120,
        unit: "pcs",
        containerNumber: "CNT-2401",
        inventorySectionId: "seed-section-engine",
        inventorySectionTitle: "Engine Parts",
      },
      {
        name: "Synthetic Engine Oil",
        quantity: 80,
        unit: "bottles",
        containerNumber: "CNT-2401",
        inventorySectionId: "seed-section-oils",
        inventorySectionTitle: "Oils And Fluids",
      },
    ],
  },
  {
    id: "seed-incoming-2",
    containerNumber: "CNT-2402",
    carNumber: "MDY-9921",
    supplierName: "Mandalar Tire Depot",
    status: "AT_BRIDGE",
    arrivalTime: "2026-05-11T02:00:00.000Z",
    durationHours: 36,
    note: "Check tire size labels before unloading.",
    items: [
      {
        name: "All Terrain Tire 17",
        quantity: 64,
        unit: "pcs",
        containerNumber: "CNT-2402",
        inventorySectionId: "seed-section-tires",
        inventorySectionTitle: "Tires And Wheels",
      },
    ],
  },
];

const initialContainerStock: ContainerStock[] = [
  {
    id: "seed-stock-1",
    containerId: "seed-incoming-1",
    containerNumber: "CNT-2401",
    carNumber: "YGN-4582",
    supplierName: "Bangkok Auto Supply",
    inventorySectionId: "seed-section-engine",
    inventorySectionTitle: "Engine Parts",
    productName: "Oil Filter",
    initialQuantity: 120,
    remainingQuantity: 105,
    unit: "pcs",
    receivedAt: "2026-05-09T03:30:00.000Z",
    updatedAt: "2026-05-10T04:15:00.000Z",
  },
  {
    id: "seed-stock-2",
    containerId: "seed-incoming-1",
    containerNumber: "CNT-2401",
    carNumber: "YGN-4582",
    supplierName: "Bangkok Auto Supply",
    inventorySectionId: "seed-section-oils",
    inventorySectionTitle: "Oils And Fluids",
    productName: "Synthetic Engine Oil",
    initialQuantity: 80,
    remainingQuantity: 72,
    unit: "bottles",
    receivedAt: "2026-05-09T03:30:00.000Z",
    updatedAt: "2026-05-10T04:15:00.000Z",
  },
  {
    id: "seed-stock-3",
    containerId: "manual-seed",
    containerNumber: "MANUAL-01",
    carNumber: "Manual Entry",
    supplierName: "Manual Adjustment",
    inventorySectionId: "seed-section-tires",
    inventorySectionTitle: "Tires And Wheels",
    productName: "Wheel Nut Set",
    initialQuantity: 200,
    remainingQuantity: 200,
    unit: "sets",
    receivedAt: "2026-05-08T09:00:00.000Z",
    updatedAt: "2026-05-08T09:00:00.000Z",
  },
];

const initialCustomers: Customer[] = [
  {
    id: "seed-customer-1",
    name: "Aung Auto Service",
    phone: "09-421-555-010",
    address: "Thingangyun, Yangon",
    note: "Prefers morning delivery.",
    createdAt: "2026-05-07T08:00:00.000Z",
    updatedAt: "2026-05-07T08:00:00.000Z",
  },
  {
    id: "seed-customer-2",
    name: "Mandalay Fleet Care",
    phone: "09-777-220-330",
    address: "Chan Aye Tharzan, Mandalay",
    note: "Call before loading.",
    createdAt: "2026-05-08T08:00:00.000Z",
    updatedAt: "2026-05-08T08:00:00.000Z",
  },
];

const initialOrders: Order[] = [
  {
    id: "seed-order-1",
    customerName: "Aung Auto Service",
    carNumber: "YGN-7721",
    status: "PREPARING",
    orderTime: "2026-05-10T04:15:00.000Z",
    finalDate: "2026-05-13T04:15:00.000Z",
    customerNote: "Pack filters separately.",
    items: [
      {
        name: "Oil Filter",
        quantity: 15,
        unit: "pcs",
        containerId: "seed-stock-1",
        containerNumber: "CNT-2401",
      },
      {
        name: "Synthetic Engine Oil",
        quantity: 8,
        unit: "bottles",
        containerId: "seed-stock-2",
        containerNumber: "CNT-2401",
      },
    ],
  },
  {
    id: "seed-order-2",
    customerName: "Mandalay Fleet Care",
    carNumber: "MDY-3388",
    status: "PENDING",
    orderTime: "2026-05-11T06:45:00.000Z",
    finalDate: "2026-05-14T06:45:00.000Z",
    customerNote: "Hold until payment confirmation.",
    items: [
      {
        name: "Wheel Nut Set",
        quantity: 12,
        unit: "sets",
        containerId: "seed-stock-3",
        containerNumber: "MANUAL-01",
      },
    ],
  },
];

const initialLogs: LogEntry[] = [
  {
    id: "seed-log-1",
    type: "INCOMING",
    message: "CNT-2401 reached garage and products are ready for orders",
    timestamp: "2026-05-09T05:00:00.000Z",
    operator: "Seed Admin",
  },
  {
    id: "seed-log-2",
    type: "OUTGOING",
    message: "Order created for Aung Auto Service",
    timestamp: "2026-05-10T04:15:00.000Z",
    operator: "Seed Admin",
  },
  {
    id: "seed-log-3",
    type: "MANUAL",
    message: "Wheel Nut Set added under Tires And Wheels",
    timestamp: "2026-05-08T09:00:00.000Z",
    operator: "Seed Admin",
  },
];

export const useStore = create<GarageState>((set, get) => ({
  isHydrated: false,
  isSyncing: false,
  syncError: undefined,
  incomingList: initialIncomingList,
  inventorySections: initialInventorySections,
  customers: initialCustomers,
  orders: initialOrders,
  containerStock: initialContainerStock,
  inventory: recalculateInventory(initialContainerStock, initialInventorySections),
  logs: initialLogs,

  loadRemoteData: async () => {
    if (!canUseSupabase()) {
      set({ isHydrated: true });
      return;
    }

    set({ isSyncing: true, syncError: undefined });

    try {
      const snapshot = await fetchGarageSnapshot();
      const hasRemoteData =
        snapshot.inventorySections.length > 0 ||
        snapshot.incomingList.length > 0 ||
        snapshot.orders.length > 0 ||
        snapshot.customers.length > 0 ||
        snapshot.containerStock.length > 0 ||
        snapshot.logs.length > 0;

      if (hasRemoteData) {
        const cleanedRemoteData = removePrototypeData(snapshot);
        if (cleanedRemoteData.removedCount > 0) {
          await saveGarageSnapshot(cleanedRemoteData.snapshot);
        }

        set({
          ...cleanedRemoteData.snapshot,
          isHydrated: true,
          isSyncing: false,
          syncError: undefined,
        });
        return;
      }

      set({ isHydrated: true, isSyncing: false, syncError: undefined });
    } catch (error) {
      set({
        isHydrated: true,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : "Could not load Supabase data.",
      });
    }
  },

  addInventorySection: (title) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    set((state) => {
      const existing = state.inventorySections.find((section) => section.title.toLowerCase() === trimmedTitle.toLowerCase());
      if (existing) return state;

      const section = {
        id: `section-${generateId()}`,
        title: trimmedTitle,
        createdAt: new Date().toISOString(),
      };

      return {
        inventorySections: [...state.inventorySections, section],
        inventory: recalculateInventory(state.containerStock, [...state.inventorySections, section]),
      };
    });
    queueRemoteSync(get(), set, "inventory");
  },

  updateInventorySection: (id, title) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    set((state) => {
      const section = state.inventorySections.find((item) => item.id === id);
      if (!section) return state;

      const inventorySections = state.inventorySections.map((item) =>
        item.id === id ? { ...item, title: trimmedTitle } : item
      );
      const containerStock = state.containerStock.map((row) =>
        row.inventorySectionId === id ? { ...row, inventorySectionTitle: trimmedTitle, updatedAt: new Date().toISOString() } : row
      );

      return {
        inventorySections,
        containerStock,
        inventory: recalculateInventory(containerStock, inventorySections),
      };
    });
    queueRemoteSync(get(), set, "all");
    get().addLog('MANUAL', `Inventory header renamed to ${trimmedTitle}`);
  },

  deleteInventorySection: (id) => {
    const section = get().inventorySections.find((item) => item.id === id);
    if (!section) return;

    set((state) => {
      const inventorySections = state.inventorySections.filter((item) => item.id !== id);
      const containerStock = state.containerStock.filter((row) => row.inventorySectionId !== id);

      return {
        inventorySections,
        containerStock,
        inventory: recalculateInventory(containerStock, inventorySections),
      };
    });
    queueRemoteSync(get(), set, "all");
    get().addLog('MANUAL', `Inventory header deleted: ${section.title}`);
  },

  addLog: (type, message) => {
    set((state) => ({
      logs: [{ id: generateId(), type, message, timestamp: new Date().toISOString(), operator: "Master Admin" }, ...state.logs],
    }));
    queueRemoteSync(get(), set, "logs");
  },

  addCustomer: (customer) => {
    const name = customer.name.trim();
    if (!name) return { ok: false, message: "Customer name is required." };

    const existing = get().customers.find((item) => item.name.toLowerCase() === name.toLowerCase());
    if (existing) return { ok: true, customer: existing };

    const now = new Date().toISOString();
    const newCustomer: Customer = {
      ...customer,
      id: `cust-${generateId()}`,
      name,
      phone: customer.phone?.trim() || undefined,
      address: customer.address?.trim() || undefined,
      note: customer.note?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({ customers: [newCustomer, ...state.customers] }));
    queueRemoteSync(get(), set, "customers");
    get().addLog('MANUAL', `Customer profile created for ${newCustomer.name}`);
    return { ok: true, customer: newCustomer };
  },

  updateCustomer: (id, customer) => {
    const name = customer.name.trim();
    if (!name) return { ok: false, message: "Customer name is required." };

    const existing = get().customers.find((item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase());
    if (existing) return { ok: false, message: "Another customer already uses this name." };

    const previous = get().customers.find((item) => item.id === id);
    if (!previous) return { ok: false, message: "Customer not found." };

    set((state) => ({
      customers: state.customers.map((item) => item.id === id ? {
        ...item,
        name,
        phone: customer.phone?.trim() || undefined,
        address: customer.address?.trim() || undefined,
        note: customer.note?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      } : item),
      orders: state.orders.map((order) =>
        order.customerName.toLowerCase() === previous.name.toLowerCase()
          ? { ...order, customerName: name }
          : order
      ),
    }));
    queueRemoteSync(get(), set, "all");
    get().addLog('MANUAL', `Customer profile updated for ${name}`);
    return { ok: true };
  },

  deleteCustomer: (id) => {
    const customer = get().customers.find((item) => item.id === id);
    if (!customer) return;

    set((state) => ({
      customers: state.customers.filter((item) => item.id !== id),
    }));
    queueRemoteSync(get(), set, "all");
    get().addLog('MANUAL', `Customer profile deleted for ${customer.name}`);
  },

  addIncoming: (entry) => {
    const newIncoming: Incoming = {
      ...entry,
      id: generateId(),
      containerNumber: entry.containerNumber || `CNT-${Date.now().toString().slice(-5)}`,
      status: 'ON_THE_WAY',
      arrivalTime: entry.arrivalTime || new Date().toISOString(),
      durationHours: entry.durationHours || 24,
    };
    set((state) => ({ incomingList: [newIncoming, ...state.incomingList] }));
    get().addLog('INCOMING', `Expected ${newIncoming.containerNumber} from ${entry.supplierName} on car ${entry.carNumber}`);
    queueRemoteSync(get(), set, "incoming");
  },

  updateIncoming: (id, entry) => {
    const carNumber = entry.carNumber.trim();
    const supplierName = entry.supplierName.trim();
    const items = entry.items.map((item) => ({
      ...item,
      name: item.name.trim(),
      containerNumber: item.containerNumber?.trim() || entry.containerNumber,
      quantity: Math.max(0, item.quantity),
      unit: item.unit?.trim() || undefined,
    }));
    const firstContainerNumber = items[0]?.containerNumber || entry.containerNumber.trim();
    if (!carNumber || !supplierName || !firstContainerNumber || items.some((item) => !item.name || !item.quantity || !item.inventorySectionId)) return;

    set((state) => {
      const existing = state.incomingList.find((incoming) => incoming.id === id);
      if (!existing) return state;

      const nextIncoming: Incoming = {
        ...existing,
        containerNumber: firstContainerNumber,
        carNumber,
        supplierName,
        items,
        arrivalTime: entry.arrivalTime,
        durationHours: entry.durationHours || 24,
        note: entry.note?.trim() || undefined,
      };
      const incomingList = state.incomingList.map((incoming) => incoming.id === id ? {
        ...nextIncoming,
      } : incoming);

      const otherStock = state.containerStock.filter((row) => row.containerId !== id);
      const containerStock = existing.status === "IN_GARAGE"
        ? createStockRows(nextIncoming, otherStock, state.inventorySections)
        : state.containerStock.map((row) => row.containerId === id ? {
          ...row,
          carNumber,
          supplierName,
          updatedAt: new Date().toISOString(),
        } : row);

      return {
        incomingList,
        containerStock,
        inventory: recalculateInventory(containerStock, state.inventorySections),
      };
    });
    queueRemoteSync(get(), set, "all");
    get().addLog('INCOMING', `Incoming shipment updated for car ${carNumber}`);
  },

  deleteIncoming: (id) => {
    const incoming = get().incomingList.find((item) => item.id === id);
    if (!incoming) return;

    set((state) => {
      const containerStock = state.containerStock.filter((row) => row.containerId !== id);

      return {
        incomingList: state.incomingList.filter((item) => item.id !== id),
        containerStock,
        inventory: recalculateInventory(containerStock, state.inventorySections),
      };
    });
    queueRemoteSync(get(), set, "all");
    get().addLog('INCOMING', `Incoming shipment deleted for ${incoming.containerNumber}`);
  },

  updateIncomingStatus: (id, status) => {
    set((state) => {
      const incoming = state.incomingList.find((i) => i.id === id);
      if (!incoming) return state;

      const incomingList = state.incomingList.map((i) => i.id === id ? { ...i, status } : i);

      if (status === 'IN_GARAGE' && incoming.status !== 'IN_GARAGE') {
        const containerStock = createStockRows({ ...incoming, status }, state.containerStock, state.inventorySections);
        setTimeout(() => get().addLog('INCOMING', `${incoming.containerNumber} reached garage and products are now available by container`), 0);
        return {
          incomingList,
          containerStock,
          inventory: recalculateInventory(containerStock, state.inventorySections),
        };
      }

      if (status === 'AT_BRIDGE' && incoming.status === 'ON_THE_WAY') {
        setTimeout(() => get().addLog('INCOMING', `${incoming.containerNumber} on car ${incoming.carNumber} arrived at the bridge`), 0);
      }

      return { incomingList };
    });
    queueRemoteSync(get(), set, "incoming");
  },

  addOrder: (order) => {
    const customerName = order.customerName.trim();
    const requestedItems = order.items.map((item) => ({
      ...item,
      quantity: Math.max(0, item.quantity),
    }));

    const stock = get().containerStock;
    for (const item of requestedItems) {
      const stockRow = stock.find((row) => row.id === item.containerId);
      if (!stockRow) {
        return { ok: false, message: `Choose a container for ${item.name}.` };
      }
      if (stockRow.remainingQuantity < item.quantity) {
        return {
          ok: false,
          message: `${stockRow.containerNumber} only has ${stockRow.remainingQuantity} ${stockRow.unit || 'units'} of ${stockRow.productName} left.`,
        };
      }
    }

    const existingCustomer = get().customers.find((customer) => customer.name.toLowerCase() === customerName.toLowerCase());
    if (!existingCustomer) {
      const customerResult = get().addCustomer({
        name: customerName,
        note: order.customerNote,
      });
      if (!customerResult.ok) return { ok: false, message: customerResult.message };
    }

    const now = new Date().toISOString();
    const newOrder: Order = {
      ...order,
      customerName,
      items: requestedItems,
      id: generateId(),
      status: 'PENDING',
      orderTime: order.orderTime || now,
      finalDate: order.finalDate || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    };

    set((state) => {
      const containerStock = state.containerStock.map((row) => {
        const orderedQuantity = requestedItems
          .filter((item) => item.containerId === row.id)
          .reduce((sum, item) => sum + item.quantity, 0);

        if (!orderedQuantity) return row;

        return {
          ...row,
          remainingQuantity: Math.max(0, row.remainingQuantity - orderedQuantity),
          updatedAt: now,
        };
      });

        return {
          orders: [newOrder, ...state.orders],
          containerStock,
          inventory: recalculateInventory(containerStock, state.inventorySections),
        };
      });

    get().addLog('OUTGOING', `Order created for ${order.customerName}; stock deducted from selected containers`);
    queueRemoteSync(get(), set, "orders");
    return { ok: true };
  },

  updateOrder: (id, order) => {
    const customerName = order.customerName.trim();
    const carNumber = order.carNumber.trim();
    if (!customerName || !carNumber) return { ok: false, message: "Customer and vehicle are required." };

    const existingOrder = get().orders.find((item) => item.id === id);
    if (!existingOrder) return { ok: false, message: "Order not found." };

    const requestedItems = order.items.map((item) => ({
      ...item,
      quantity: Math.max(0, item.quantity),
    }));

    const stockWithReturnedItems = get().containerStock.map((row) => {
      const returnedQuantity = existingOrder.items
        .filter((item) => item.containerId === row.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      if (!returnedQuantity) return row;
      return {
        ...row,
        remainingQuantity: Math.min(row.initialQuantity, row.remainingQuantity + returnedQuantity),
      };
    });

    for (const item of requestedItems) {
      const stockRow = stockWithReturnedItems.find((row) => row.id === item.containerId);
      if (!stockRow) {
        return { ok: false, message: `Choose a container for ${item.name}.` };
      }
      if (stockRow.remainingQuantity < item.quantity) {
        return {
          ok: false,
          message: `${stockRow.containerNumber} only has ${stockRow.remainingQuantity} ${stockRow.unit || 'units'} of ${stockRow.productName} left.`,
        };
      }
    }

    const existingCustomer = get().customers.find((customer) => customer.name.toLowerCase() === customerName.toLowerCase());
    if (!existingCustomer) {
      const customerResult = get().addCustomer({
        name: customerName,
        note: order.customerNote,
      });
      if (!customerResult.ok) return { ok: false, message: customerResult.message };
    }

    set((state) => {
      const now = new Date().toISOString();
      const returnedStock = state.containerStock.map((row) => {
        const returnedQuantity = existingOrder.items
          .filter((item) => item.containerId === row.id)
          .reduce((sum, item) => sum + item.quantity, 0);

        if (!returnedQuantity) return row;
        return {
          ...row,
          remainingQuantity: Math.min(row.initialQuantity, row.remainingQuantity + returnedQuantity),
          updatedAt: now,
        };
      });

      const containerStock = returnedStock.map((row) => {
        const orderedQuantity = requestedItems
          .filter((item) => item.containerId === row.id)
          .reduce((sum, item) => sum + item.quantity, 0);

        if (!orderedQuantity) return row;
        return {
          ...row,
          remainingQuantity: Math.max(0, row.remainingQuantity - orderedQuantity),
          updatedAt: now,
        };
      });

      return {
        orders: state.orders.map((item) => item.id === id ? {
          ...item,
          customerName,
          carNumber,
          items: requestedItems,
          orderTime: order.orderTime,
          finalDate: order.finalDate,
          customerNote: order.customerNote?.trim() || undefined,
        } : item),
        containerStock,
        inventory: recalculateInventory(containerStock, state.inventorySections),
      };
    });
    queueRemoteSync(get(), set, "orders");
    get().addLog('OUTGOING', `Order updated for ${customerName}`);
    return { ok: true };
  },

  deleteOrder: (id) => {
    const order = get().orders.find((item) => item.id === id);
    if (!order) return;

    set((state) => {
      const containerStock = state.containerStock.map((row) => {
        const returnedQuantity = order.items
          .filter((item) => item.containerId === row.id)
          .reduce((sum, item) => sum + item.quantity, 0);

        if (!returnedQuantity) return row;

        return {
          ...row,
          remainingQuantity: Math.min(row.initialQuantity, row.remainingQuantity + returnedQuantity),
          updatedAt: new Date().toISOString(),
        };
      });

      return {
        orders: state.orders.filter((item) => item.id !== id),
        containerStock,
        inventory: recalculateInventory(containerStock, state.inventorySections),
      };
    });
    queueRemoteSync(get(), set, "all");
    get().addLog('OUTGOING', `Order deleted for ${order.customerName}; stock was returned`);
  },

  updateOrderStatus: (id, status) => {
    set((state) => {
      const order = state.orders.find((o) => o.id === id);
      if (!order) return state;

      if (status === 'PREPARING') {
        setTimeout(() => get().addLog('OUTGOING', `Order for ${order.customerName} is preparing`), 0);
      }

      if (status === 'ON_THE_WAY') {
        setTimeout(() => get().addLog('OUTGOING', `Order for ${order.customerName} is on the way`), 0);
      }

      if (status === 'DELIVERED') {
        setTimeout(() => get().addLog('OUTGOING', `Order for ${order.customerName} delivered on ${order.carNumber}`), 0);
      }

      return { orders: state.orders.map((o) => o.id === id ? { ...o, status } : o) };
    });
    queueRemoteSync(get(), set, "orders");
  },

  updateInventoryManual: (itemName, quantity, difference, unit, containerNumber = 'MANUAL', inventorySectionId) => {
    set((state) => {
      const now = new Date().toISOString();
      const section = resolveSection(inventorySectionId, state.inventorySections);
      const resolvedContainerNumber = containerNumber?.trim() || "MANUAL";
      const stockRowIndex = state.containerStock.findIndex((row) =>
        row.containerNumber.toLowerCase() === resolvedContainerNumber.toLowerCase() &&
        row.inventorySectionId === section.id &&
        row.productName.toLowerCase() === itemName.toLowerCase()
      );

      const containerStock = [...state.containerStock];
      if (stockRowIndex >= 0) {
        const existing = containerStock[stockRowIndex];
        containerStock[stockRowIndex] = {
          ...existing,
          initialQuantity: Math.max(existing.initialQuantity, quantity),
          remainingQuantity: quantity,
          unit: unit || existing.unit,
          inventorySectionId: section.id,
          inventorySectionTitle: section.title,
          updatedAt: now,
        };
      } else {
        containerStock.push({
          id: generateId(),
          containerId: `manual-${resolvedContainerNumber.toLowerCase()}-${section.id}`,
          containerNumber: resolvedContainerNumber,
          carNumber: 'Manual Entry',
          supplierName: 'Manual Adjustment',
          inventorySectionId: section.id,
          inventorySectionTitle: section.title,
          productName: itemName,
          initialQuantity: quantity,
          remainingQuantity: quantity,
          unit,
          receivedAt: now,
          updatedAt: now,
        });
      }

      setTimeout(() => get().addLog('MANUAL', `Adjusted ${itemName} under ${section.title} in ${resolvedContainerNumber} by ${difference > 0 ? '+' + difference : difference}`), 0);
      return {
        containerStock,
        inventory: recalculateInventory(containerStock, state.inventorySections),
      };
    });
    queueRemoteSync(get(), set, "inventory");
  },

  updateStockRow: (id, updates) => {
    const productName = updates.productName.trim();
    const containerNumber = updates.containerNumber.trim();
    if (!productName || !containerNumber) return;

    set((state) => {
      const section = resolveSection(updates.inventorySectionId, state.inventorySections);
      const containerStock = state.containerStock.map((row) => row.id === id ? {
        ...row,
        containerNumber,
        productName,
        inventorySectionId: section.id,
        inventorySectionTitle: section.title,
        remainingQuantity: Math.max(0, updates.remainingQuantity),
        initialQuantity: Math.max(row.initialQuantity, updates.remainingQuantity),
        unit: updates.unit?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      } : row);

      return {
        containerStock,
        inventory: recalculateInventory(containerStock, state.inventorySections),
      };
    });
    queueRemoteSync(get(), set, "inventory");
    get().addLog('MANUAL', `Inventory stock row updated for ${productName}`);
  },

  deleteStockRow: (id) => {
    const row = get().containerStock.find((item) => item.id === id);
    if (!row) return;

    set((state) => {
      const containerStock = state.containerStock.filter((item) => item.id !== id);

      return {
        containerStock,
        inventory: recalculateInventory(containerStock, state.inventorySections),
      };
    });
    queueRemoteSync(get(), set, "all");
    get().addLog('MANUAL', `Inventory stock row deleted for ${row.productName}`);
  },
}));

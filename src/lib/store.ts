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
  updateInventorySection: (id: string, title: string) => { ok: boolean; message?: string };
  deleteInventorySection: (id: string) => void;
  addIncoming: (entry: Omit<Incoming, 'id' | 'status' | 'arrivalTime' | 'durationHours'> & { arrivalTime?: string, durationHours?: number }) => void;
  updateIncoming: (id: string, entry: Omit<Incoming, 'id'>) => void;
  deleteIncoming: (id: string) => void;
  updateIncomingStatus: (id: string, status: IncomingStatus) => void;

  addOrder: (order: Omit<Order, 'id' | 'status' | 'orderTime' | 'finalDate'> & { orderTime?: string, finalDate?: string }) => { ok: boolean; message?: string };
  updateOrder: (id: string, order: Omit<Order, 'id'>) => { ok: boolean; message?: string };
  deleteOrder: (id: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;

  updateInventoryManual: (itemName: string, quantity: number, difference: number, unit?: string, containerNumber?: string, inventorySectionId?: string) => void;
  updateStockRow: (id: string, row: Omit<ContainerStock, 'id' | 'receivedAt' | 'updatedAt'> & { receivedAt?: string }) => void;
  deleteStockRow: (id: string) => void;
  addLog: (type: LogType, message: string) => void;
  loadRemoteData: () => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_SECTION_ID = "section-general";

const initialInventorySections: InventorySection[] = [];

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

const createStockRowsForIncoming = (
  incoming: Incoming,
  sections: InventorySection[] = initialInventorySections,
  previousRows: ContainerStock[] = []
): ContainerStock[] => {
  const timestamp = new Date().toISOString();

  return incoming.items.map((item, index) => {
    const section = resolveSection(item.inventorySectionId, sections);
    const previousRow = previousRows.find((row) => row.id === `stock-${incoming.id}-${index + 1}`);
    const previouslyAllocated = previousRow
      ? Math.max(0, previousRow.initialQuantity - previousRow.remainingQuantity)
      : 0;
    const quantity = Math.max(0, item.quantity);

    return {
      id: `stock-${incoming.id}-${index + 1}`,
      containerId: incoming.id,
      containerNumber: item.containerNumber || incoming.containerNumber || "NO-CONTAINER",
      carNumber: incoming.carNumber,
      supplierName: incoming.supplierName,
      inventorySectionId: section.id,
      inventorySectionTitle: section.title,
      productName: item.name,
      initialQuantity: quantity,
      remainingQuantity: Math.max(0, quantity - previouslyAllocated),
      unit: item.unit,
      receivedAt: incoming.arrivalTime,
      updatedAt: timestamp,
    };
  });
};

const restoreOrderStock = (stock: ContainerStock[], order: Order, timestamp: string) => {
  return stock.map((row) => {
    const orderedQuantity = order.items
      .filter((item) => item.containerId === row.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (!orderedQuantity) return row;

    return {
      ...row,
      remainingQuantity: row.remainingQuantity + orderedQuantity,
      updatedAt: timestamp,
    };
  });
};

const deductOrderStock = (stock: ContainerStock[], items: ItemDetail[], timestamp: string) => {
  return stock.map((row) => {
    const orderedQuantity = items
      .filter((item) => item.containerId === row.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (!orderedQuantity) return row;

    return {
      ...row,
      remainingQuantity: Math.max(0, row.remainingQuantity - orderedQuantity),
      updatedAt: timestamp,
    };
  });
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

const initialIncomingList: Incoming[] = [];
const initialContainerStock: ContainerStock[] = [];
const initialCustomers: Customer[] = [];

export const useStore = create<GarageState>((set, get) => ({
  isHydrated: false,
  isSyncing: false,
  syncError: undefined,
  incomingList: initialIncomingList,
  inventorySections: initialInventorySections,
  customers: initialCustomers,
  orders: [],
  containerStock: initialContainerStock,
  inventory: recalculateInventory(initialContainerStock, initialInventorySections),
  logs: [],

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
    if (!trimmedTitle) return { ok: false, message: "Header name is required." };

    const existing = get().inventorySections.find((section) => section.id !== id && section.title.toLowerCase() === trimmedTitle.toLowerCase());
    if (existing) return { ok: false, message: "Another header already uses this name." };

    const current = get().inventorySections.find((section) => section.id === id);
    if (!current) return { ok: false, message: "Header not found." };

    set((state) => {
      const inventorySections = state.inventorySections.map((section) => section.id === id ? {
        ...section,
        title: trimmedTitle,
      } : section);
      const containerStock = state.containerStock.map((row) => row.inventorySectionId === id ? {
        ...row,
        inventorySectionTitle: trimmedTitle,
        updatedAt: new Date().toISOString(),
      } : row);
      const incomingList = state.incomingList.map((incoming) => ({
        ...incoming,
        items: incoming.items.map((item) => item.inventorySectionId === id ? {
          ...item,
          inventorySectionTitle: trimmedTitle,
        } : item),
      }));

      return {
        inventorySections,
        incomingList,
        containerStock,
        inventory: recalculateInventory(containerStock, inventorySections),
      };
    });

    queueRemoteSync(get(), set, "all");
    get().addLog('MANUAL', `Inventory header renamed from ${current.title} to ${trimmedTitle}`);
    return { ok: true };
  },

  deleteInventorySection: (id) => {
    const section = get().inventorySections.find((item) => item.id === id);
    if (!section) return;

    set((state) => {
      const inventorySections = state.inventorySections.filter((item) => item.id !== id);
      const containerStock = state.containerStock.filter((row) => row.inventorySectionId !== id);
      const incomingList = state.incomingList.map((incoming) => ({
        ...incoming,
        items: incoming.items.map((item) => item.inventorySectionId === id ? {
          ...item,
          inventorySectionId: undefined,
          inventorySectionTitle: undefined,
        } : item),
      }));

      return {
        inventorySections,
        incomingList,
        containerStock,
        inventory: recalculateInventory(containerStock, inventorySections),
      };
    });

    queueRemoteSync(get(), set, "all");
    get().addLog('MANUAL', `Inventory header ${section.title} was deleted`);
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

    const existingWithName = get().customers.find((item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase());
    if (existingWithName) return { ok: false, message: "Another customer already uses this name." };

    const current = get().customers.find((item) => item.id === id);
    if (!current) return { ok: false, message: "Customer not found." };

    const now = new Date().toISOString();
    set((state) => ({
      customers: state.customers.map((item) => item.id === id ? {
        ...item,
        name,
        phone: customer.phone?.trim() || undefined,
        address: customer.address?.trim() || undefined,
        note: customer.note?.trim() || undefined,
        updatedAt: now,
      } : item),
      orders: state.orders.map((order) => order.customerName.toLowerCase() === current.name.toLowerCase()
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
    set((state) => {
      const current = state.incomingList.find((incoming) => incoming.id === id);
      if (!current) return state;

      const updatedIncoming: Incoming = {
        ...entry,
        id,
        containerNumber: entry.containerNumber || entry.items[0]?.containerNumber || current.containerNumber,
        items: entry.items.map((item) => {
          const section = resolveSection(item.inventorySectionId, state.inventorySections);
          return {
            ...item,
            quantity: Math.max(0, item.quantity),
            inventorySectionId: section.id,
            inventorySectionTitle: section.title,
          };
        }),
      };

      const incomingList = state.incomingList.map((incoming) => incoming.id === id ? updatedIncoming : incoming);
      const otherStockRows = state.containerStock.filter((row) => row.containerId !== id);
      const previousRows = state.containerStock.filter((row) => row.containerId === id);
      const containerStock = updatedIncoming.status === 'IN_GARAGE'
        ? [...createStockRowsForIncoming(updatedIncoming, state.inventorySections, previousRows), ...otherStockRows]
        : otherStockRows;

      return {
        incomingList,
        containerStock,
        inventory: recalculateInventory(containerStock, state.inventorySections),
      };
    });

    queueRemoteSync(get(), set, "incoming");
    get().addLog('INCOMING', `Incoming shipment ${entry.containerNumber} was updated`);
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
    get().addLog('INCOMING', `Incoming shipment ${incoming.containerNumber} was deleted`);
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
    const current = get().orders.find((item) => item.id === id);
    if (!current) return { ok: false, message: "Order not found." };

    const customerName = order.customerName.trim();
    if (!customerName) return { ok: false, message: "Customer name is required." };

    const requestedItems = order.items.map((item) => ({
      ...item,
      quantity: Math.max(0, item.quantity),
    }));

    const now = new Date().toISOString();
    const restoredStock = restoreOrderStock(get().containerStock, current, now);
    for (const item of requestedItems) {
      const stockRow = restoredStock.find((row) => row.id === item.containerId);
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
      const restored = restoreOrderStock(state.containerStock, current, now);
      const containerStock = deductOrderStock(restored, requestedItems, now);
      return {
        orders: state.orders.map((item) => item.id === id ? {
          ...order,
          id,
          customerName,
          items: requestedItems,
        } : item),
        containerStock,
        inventory: recalculateInventory(containerStock, state.inventorySections),
      };
    });

    queueRemoteSync(get(), set, "orders");
    get().addLog('OUTGOING', `Order for ${customerName} was updated`);
    return { ok: true };
  },

  deleteOrder: (id) => {
    const order = get().orders.find((item) => item.id === id);
    if (!order) return;

    const now = new Date().toISOString();
    set((state) => {
      const containerStock = restoreOrderStock(state.containerStock, order, now);
      return {
        orders: state.orders.filter((item) => item.id !== id),
        containerStock,
        inventory: recalculateInventory(containerStock, state.inventorySections),
      };
    });

    queueRemoteSync(get(), set, "all");
    get().addLog('OUTGOING', `Order for ${order.customerName} was deleted and stock was returned`);
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

  updateStockRow: (id, row) => {
    set((state) => {
      const now = new Date().toISOString();
      const section = resolveSection(row.inventorySectionId, state.inventorySections);
      const quantity = Math.max(0, row.remainingQuantity);
      const containerStock = state.containerStock.map((stockRow) => stockRow.id === id ? {
        ...stockRow,
        ...row,
        containerNumber: row.containerNumber.trim() || stockRow.containerNumber,
        carNumber: row.carNumber.trim() || stockRow.carNumber,
        supplierName: row.supplierName.trim() || stockRow.supplierName,
        inventorySectionId: section.id,
        inventorySectionTitle: section.title,
        productName: row.productName.trim() || stockRow.productName,
        initialQuantity: Math.max(quantity, row.initialQuantity),
        remainingQuantity: quantity,
        unit: row.unit?.trim() || undefined,
        receivedAt: row.receivedAt || stockRow.receivedAt,
        updatedAt: now,
      } : stockRow);

      return {
        containerStock,
        inventory: recalculateInventory(containerStock, state.inventorySections),
      };
    });

    queueRemoteSync(get(), set, "inventory");
    get().addLog('MANUAL', `Inventory row ${row.productName} in ${row.containerNumber} was updated`);
  },

  deleteStockRow: (id) => {
    const stockRow = get().containerStock.find((row) => row.id === id);
    if (!stockRow) return;

    set((state) => {
      const containerStock = state.containerStock.filter((row) => row.id !== id);
      return {
        containerStock,
        inventory: recalculateInventory(containerStock, state.inventorySections),
      };
    });

    queueRemoteSync(get(), set, "all");
    get().addLog('MANUAL', `Inventory row ${stockRow.productName} in ${stockRow.containerNumber} was deleted`);
  },
}));

import { create } from 'zustand';

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
  incomingList: Incoming[];
  orders: Order[];
  customers: Customer[];
  inventorySections: InventorySection[];
  inventory: InventoryItem[];
  containerStock: ContainerStock[];
  logs: LogEntry[];

  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => { ok: boolean; customer?: Customer; message?: string };
  addInventorySection: (title: string) => void;
  addIncoming: (entry: Omit<Incoming, 'id' | 'status' | 'arrivalTime' | 'durationHours'> & { arrivalTime?: string, durationHours?: number }) => void;
  updateIncomingStatus: (id: string, status: IncomingStatus) => void;

  addOrder: (order: Omit<Order, 'id' | 'status' | 'orderTime' | 'finalDate'> & { orderTime?: string, finalDate?: string }) => { ok: boolean; message?: string };
  updateOrderStatus: (id: string, status: OrderStatus) => void;

  updateInventoryManual: (itemName: string, quantity: number, difference: number, unit?: string, containerNumber?: string, inventorySectionId?: string) => void;
  addLog: (type: LogType, message: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const FIXED_NOW = "2026-04-05T15:00:00.000Z";
const FIXED_HOUR_AGO = "2026-04-05T14:00:00.000Z";
const FIXED_TWO_HOURS_AGO = "2026-04-05T13:00:00.000Z";
const DEFAULT_SECTION_ID = "section-general";

const initialInventorySections: InventorySection[] = [
  { id: "section-engine", title: "Engine & Fluids", createdAt: FIXED_NOW },
  { id: "section-service", title: "Service Parts", createdAt: FIXED_NOW },
  { id: "section-wheels", title: "Wheels & Tires", createdAt: FIXED_NOW },
  { id: DEFAULT_SECTION_ID, title: "General Stock", createdAt: FIXED_NOW },
];

const resolveSection = (sectionId: string | undefined, sections: InventorySection[]) => {
  return sections.find((section) => section.id === sectionId) || sections[0] || {
    id: DEFAULT_SECTION_ID,
    title: "General Stock",
    createdAt: FIXED_NOW,
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
  const stockRows = incoming.items.map((item) => {
    const section = resolveSection(item.inventorySectionId, sections);

    return {
      id: generateId(),
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

const initialIncomingList: Incoming[] = [
  {
    id: 'cnt-1',
    containerNumber: 'CNT-001',
    carNumber: 'ABC-123',
    supplierName: 'TechParts Inc',
    items: [
      { name: 'Engine Oil', quantity: 200, unit: 'Liters', inventorySectionId: 'section-engine', inventorySectionTitle: 'Engine & Fluids', containerNumber: 'CNT-001' },
      { name: 'Brake Pads', quantity: 45, unit: 'Sets', inventorySectionId: 'section-service', inventorySectionTitle: 'Service Parts', containerNumber: 'CNT-001' },
    ],
    status: 'IN_GARAGE',
    arrivalTime: FIXED_NOW,
    durationHours: 48,
    note: 'Container already received in garage',
  },
  {
    id: 'cnt-2',
    containerNumber: 'CNT-002',
    carNumber: 'XYZ-987',
    supplierName: 'TireCorp',
    items: [{ name: 'Tires', quantity: 120, unit: 'Pcs', inventorySectionId: 'section-wheels', inventorySectionTitle: 'Wheels & Tires', containerNumber: 'CNT-002' }],
    status: 'IN_GARAGE',
    arrivalTime: FIXED_HOUR_AGO,
    durationHours: 12,
  },
  {
    id: 'cnt-3',
    containerNumber: 'CNT-003',
    carNumber: 'MDY-448',
    supplierName: 'Future Freight',
    items: [
      { name: 'Engine Oil', quantity: 80, unit: 'Liters', inventorySectionId: 'section-engine', inventorySectionTitle: 'Engine & Fluids', containerNumber: 'CNT-003' },
      { name: 'Air Filter', quantity: 60, unit: 'Pcs', inventorySectionId: 'section-service', inventorySectionTitle: 'Service Parts', containerNumber: 'CNT-003' },
    ],
    status: 'AT_BRIDGE',
    arrivalTime: FIXED_TWO_HOURS_AGO,
    durationHours: 24,
  },
];

const initialContainerStock = createStockRows(
  initialIncomingList[1],
  createStockRows(initialIncomingList[0], [])
).map((row) => {
  if (row.containerNumber === 'CNT-002' && row.productName === 'Tires') {
    return { ...row, remainingQuantity: 116, updatedAt: FIXED_NOW };
  }
  return { ...row, updatedAt: FIXED_NOW };
});

const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'John Doe',
    phone: '09-555-0101',
    address: 'Yangon service route',
    note: 'Call before arrival',
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
  },
];

export const useStore = create<GarageState>((set, get) => ({
  incomingList: initialIncomingList,
  inventorySections: initialInventorySections,
  customers: initialCustomers,
  orders: [
    {
      id: '101',
      customerName: 'John Doe',
      carNumber: 'JHN-001',
      items: [{ name: 'Tires', quantity: 4, unit: 'Pcs', containerId: 'cnt-2', containerNumber: 'CNT-002' }],
      status: 'PENDING',
      orderTime: FIXED_TWO_HOURS_AGO,
      finalDate: FIXED_NOW,
      customerNote: 'Call before arrival',
    },
  ],
  containerStock: initialContainerStock,
  inventory: recalculateInventory(initialContainerStock, initialInventorySections),
  logs: [
    { id: 'log-1', type: 'MANUAL', message: 'System initialized with container stock tracking', timestamp: FIXED_NOW },
  ],

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
  },

  addLog: (type, message) => set((state) => ({
    logs: [{ id: generateId(), type, message, timestamp: new Date().toISOString(), operator: "Master Admin" }, ...state.logs],
  })),

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
    get().addLog('MANUAL', `Customer profile created for ${newCustomer.name}`);
    return { ok: true, customer: newCustomer };
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
    return { ok: true };
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
  },
}));

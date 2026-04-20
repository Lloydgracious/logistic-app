import { create } from 'zustand';

export type IncomingStatus = "ON_THE_WAY" | "AT_BRIDGE" | "IN_GARAGE";
export type OrderStatus = "PENDING" | "PREPARING" | "ON_THE_WAY" | "DELIVERED";
export type LogType = "INCOMING" | "OUTGOING" | "MANUAL";

export interface ItemDetail {
  name: string;
  quantity: number;
  unit?: string;
}

export interface Incoming {
  id: string;
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

export interface InventoryItem {
  id: string;
  itemName: string;
  quantity: number;
  unit?: string;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  type: LogType;
  message: string;
  timestamp: string;
}

interface GarageState {
  incomingList: Incoming[];
  orders: Order[];
  inventory: InventoryItem[];
  logs: LogEntry[];

  addIncoming: (entry: Omit<Incoming, 'id' | 'status' | 'arrivalTime' | 'durationHours'> & { arrivalTime?: string, durationHours?: number }) => void;
  updateIncomingStatus: (id: string, status: IncomingStatus) => void;

  addOrder: (order: Omit<Order, 'id' | 'status' | 'orderTime' | 'finalDate'> & { orderTime?: string, finalDate?: string }) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;

  updateInventoryManual: (itemName: string, quantity: number, difference: number, unit?: string) => void;
  addLog: (type: LogType, message: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// Use fixed dates for initial mock data to prevent hydration mismatches
const FIXED_NOW = "2026-04-05T15:00:00.000Z";
const FIXED_HOUR_AGO = "2026-04-05T14:00:00.000Z";
const FIXED_TWO_HOURS_AGO = "2026-04-05T13:00:00.000Z";

export const useStore = create<GarageState>((set, get) => ({
  incomingList: [
    { id: '1', carNumber: 'ABC-123', supplierName: 'TechParts Inc', items: [{ name: 'Engine Oil', quantity: 50, unit: 'Liters' }], status: 'ON_THE_WAY', arrivalTime: FIXED_NOW, durationHours: 48, note: 'Urgent delivery' },
    { id: '2', carNumber: 'XYZ-987', supplierName: 'TireCorp', items: [{ name: 'Tires', quantity: 100, unit: 'Pcs' }], status: 'AT_BRIDGE', arrivalTime: FIXED_HOUR_AGO, durationHours: 12 },
  ],
  orders: [
    { id: '101', customerName: 'John Doe', carNumber: 'JHN-001', items: [{ name: 'Tires', quantity: 4, unit: 'Pcs' }], status: 'PENDING', orderTime: FIXED_TWO_HOURS_AGO, finalDate: FIXED_NOW, customerNote: 'Call before arrival' }
  ],
  inventory: [
    { id: 'inv-1', itemName: 'Engine Oil', quantity: 200, unit: 'Liters', updatedAt: FIXED_NOW },
    { id: 'inv-2', itemName: 'Tires', quantity: 120, unit: 'Pcs', updatedAt: FIXED_NOW },
    { id: 'inv-3', itemName: 'Brake Pads', quantity: 45, unit: 'Sets', updatedAt: FIXED_NOW },
  ],
  logs: [
    { id: 'log-1', type: 'MANUAL', message: 'System initialized', timestamp: FIXED_NOW }
  ],

  addLog: (type, message) => set((state) => ({
    logs: [{ id: generateId(), type, message, timestamp: new Date().toISOString() }, ...state.logs]
  })),

  addIncoming: (entry) => {
    const newIncoming: Incoming = { 
      ...entry, 
      id: generateId(), 
      status: 'ON_THE_WAY', 
      arrivalTime: entry.arrivalTime || new Date().toISOString(),
      durationHours: entry.durationHours || 24 
    };
    set((state) => ({ incomingList: [newIncoming, ...state.incomingList] }));
    get().addLog('INCOMING', `Expected incoming from ${entry.supplierName} (Car: ${entry.carNumber})`);
  },

  updateIncomingStatus: (id, status) => {
    set((state) => {
      const incoming = state.incomingList.find(i => i.id === id);
      if (!incoming) return state;

      if (status === 'IN_GARAGE' && incoming.status !== 'IN_GARAGE') {
        const newInventory = [...state.inventory];
        incoming.items.forEach(item => {
          const invItem = newInventory.find(i => i.itemName.toLowerCase() === item.name.toLowerCase());
          if (invItem) {
            invItem.quantity += item.quantity;
            invItem.unit = item.unit || invItem.unit;
            invItem.updatedAt = new Date().toISOString();
          } else {
            newInventory.push({
              id: generateId(),
              itemName: item.name,
              quantity: item.quantity,
              unit: item.unit,
              updatedAt: new Date().toISOString()
            });
          }
        });
        
        setTimeout(() => get().addLog('INCOMING', `Car ${incoming.carNumber} reached garage and items added to inventory`), 0);
        
        return { 
          incomingList: state.incomingList.map(i => i.id === id ? { ...i, status } : i),
          inventory: newInventory
        };
      }
      
      if (status === 'AT_BRIDGE' && incoming.status === 'ON_THE_WAY') {
        setTimeout(() => get().addLog('INCOMING', `Car ${incoming.carNumber} arrived at the bridge`), 0);
      }

      return { incomingList: state.incomingList.map(i => i.id === id ? { ...i, status } : i) };
    });
  },

  addOrder: (order) => {
    const newOrder: Order = { 
      ...order, 
      id: generateId(), 
      status: 'PENDING', 
      orderTime: order.orderTime || new Date().toISOString(),
      finalDate: order.finalDate || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    };
    set((state) => ({ orders: [newOrder, ...state.orders] }));
    get().addLog('OUTGOING', `New order created for ${order.customerName}`);
  },

  updateOrderStatus: (id, status) => {
    set((state) => {
      const order = state.orders.find(o => o.id === id);
      if (!order) return state;

      if (status === 'PREPARING' && order.status === 'PENDING') {
        const newInventory = [...state.inventory];
        order.items.forEach(item => {
          const invItem = newInventory.find(i => i.itemName.toLowerCase() === item.name.toLowerCase());
          if (invItem) {
            invItem.quantity = Math.max(0, invItem.quantity - item.quantity);
            invItem.updatedAt = new Date().toISOString();
          }
        });
        setTimeout(() => get().addLog('OUTGOING', `Order for ${order.customerName} is preparing, inventory deducted`), 0);
        return {
          orders: state.orders.map(o => o.id === id ? { ...o, status } : o),
          inventory: newInventory
        };
      }

      if (status === 'ON_THE_WAY') {
        setTimeout(() => get().addLog('OUTGOING', `Order for ${order.customerName} is on the way`), 0);
      }

      if (status === 'DELIVERED') {
        setTimeout(() => get().addLog('OUTGOING', `Order for ${order.customerName} delivered (${order.carNumber})`), 0);
      }

      return { orders: state.orders.map(o => o.id === id ? { ...o, status } : o) };
    });
  },

  updateInventoryManual: (itemName, quantity, difference, unit) => {
    set((state) => {
      const newInventory = [...state.inventory];
      const invItemIndex = newInventory.findIndex(i => i.itemName.toLowerCase() === itemName.toLowerCase());
      
      if (invItemIndex >= 0) {
        newInventory[invItemIndex] = {
          ...newInventory[invItemIndex],
          quantity,
          unit: unit || newInventory[invItemIndex].unit,
          updatedAt: new Date().toISOString()
        };
      } else {
        newInventory.push({
          id: generateId(),
          itemName,
          quantity,
          unit,
          updatedAt: new Date().toISOString()
        });
      }
      setTimeout(() => get().addLog('MANUAL', `Manually adjusted ${itemName} by ${difference > 0 ? '+'+difference : difference}`), 0);
      return { inventory: newInventory };
    });
  }
}));

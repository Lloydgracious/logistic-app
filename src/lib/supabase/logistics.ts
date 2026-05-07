import type {
  ContainerStock,
  Customer,
  Incoming,
  InventoryItem,
  InventorySection,
  LogEntry,
  Order,
} from "@/lib/store";

import { createClient, isSupabaseConfigured } from "./client";

type GarageSnapshot = {
  incomingList: Incoming[];
  orders: Order[];
  customers: Customer[];
  inventorySections: InventorySection[];
  inventory: InventoryItem[];
  containerStock: ContainerStock[];
  logs: LogEntry[];
};

type TableName =
  | "activity_logs"
  | "container_stock"
  | "customers"
  | "incoming_items"
  | "incoming_shipments"
  | "inventory_sections"
  | "order_items"
  | "orders";

const DEFAULT_SECTION_ID = "section-general";

const resolveSection = (sectionId: string | undefined | null, sections: InventorySection[]) => {
  return sections.find((section) => section.id === sectionId) || sections[0] || {
    id: DEFAULT_SECTION_ID,
    title: "General Stock",
    createdAt: new Date().toISOString(),
  };
};

const recalculateInventory = (
  stock: ContainerStock[],
  sections: InventorySection[],
): InventoryItem[] => {
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
      id: `inv-${key.replace(/[^a-z0-9]+/g, "-")}`,
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

const requireClient = () => {
  const supabase = createClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }
  return supabase;
};

const throwIfError = (error: { message: string } | null) => {
  if (error) {
    throw new Error(error.message);
  }
};

export const canUseSupabase = isSupabaseConfigured;

export async function fetchGarageSnapshot(): Promise<GarageSnapshot> {
  const supabase = requireClient();

  const [
    sectionsResult,
    customersResult,
    incomingResult,
    incomingItemsResult,
    stockResult,
    ordersResult,
    orderItemsResult,
    logsResult,
  ] = await Promise.all([
    supabase.from("inventory_sections").select("*").order("created_at", { ascending: true }),
    supabase.from("customers").select("*").order("name", { ascending: true }),
    supabase.from("incoming_shipments").select("*").order("arrival_time", { ascending: false }),
    supabase.from("incoming_items").select("*"),
    supabase.from("container_stock").select("*").order("updated_at", { ascending: false }),
    supabase.from("orders").select("*").order("order_time", { ascending: false }),
    supabase.from("order_items").select("*"),
    supabase.from("activity_logs").select("*").order("timestamp", { ascending: false }),
  ]);

  [
    sectionsResult,
    customersResult,
    incomingResult,
    incomingItemsResult,
    stockResult,
    ordersResult,
    orderItemsResult,
    logsResult,
  ].forEach((result) => throwIfError(result.error));

  const inventorySections: InventorySection[] = (sectionsResult.data || []).map((section) => ({
    id: section.id,
    title: section.title,
    createdAt: section.created_at,
  }));

  const sectionTitleById = new Map(inventorySections.map((section) => [section.id, section.title]));

  const incomingItems = incomingItemsResult.data || [];
  const incomingList: Incoming[] = (incomingResult.data || []).map((incoming) => ({
    id: incoming.id,
    containerNumber: incoming.container_number,
    carNumber: incoming.car_number,
    supplierName: incoming.supplier_name,
    status: incoming.status,
    arrivalTime: incoming.arrival_time,
    durationHours: incoming.duration_hours,
    note: incoming.note || undefined,
    items: incomingItems
      .filter((item) => item.incoming_id === incoming.id)
      .map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit || undefined,
        containerNumber: item.container_number || undefined,
        inventorySectionId: item.inventory_section_id || undefined,
        inventorySectionTitle: item.inventory_section_id ? sectionTitleById.get(item.inventory_section_id) : undefined,
      })),
  }));

  const containerStock: ContainerStock[] = (stockResult.data || []).map((row) => {
    const section = resolveSection(row.inventory_section_id, inventorySections);

    return {
      id: row.id,
      containerId: row.container_id,
      containerNumber: row.container_number,
      carNumber: row.car_number,
      supplierName: row.supplier_name,
      inventorySectionId: section.id,
      inventorySectionTitle: section.title,
      productName: row.product_name,
      initialQuantity: row.initial_quantity,
      remainingQuantity: row.remaining_quantity,
      unit: row.unit || undefined,
      receivedAt: row.received_at,
      updatedAt: row.updated_at,
    };
  });

  const orderItems = orderItemsResult.data || [];
  const orders: Order[] = (ordersResult.data || []).map((order) => ({
    id: order.id,
    customerName: order.customer_name,
    carNumber: order.car_number,
    status: order.status,
    orderTime: order.order_time,
    finalDate: order.final_date,
    customerNote: order.customer_note || undefined,
    items: orderItems
      .filter((item) => item.order_id === order.id)
      .map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit || undefined,
        containerId: item.container_id || undefined,
        containerNumber: item.container_number || undefined,
      })),
  }));

  const customers: Customer[] = (customersResult.data || []).map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone || undefined,
    address: customer.address || undefined,
    note: customer.note || undefined,
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
  }));

  const logs: LogEntry[] = (logsResult.data || []).map((log) => ({
    id: log.id,
    type: log.type,
    message: log.message,
    timestamp: log.timestamp,
    operator: log.operator || undefined,
  }));

  return {
    incomingList,
    orders,
    customers,
    inventorySections,
    inventory: recalculateInventory(containerStock, inventorySections),
    containerStock,
    logs,
  };
}

async function deleteAll(tableName: TableName) {
  const supabase = requireClient();
  const { error } = await supabase.from(tableName).delete().not("id", "is", null);
  throwIfError(error);
}

async function upsertRows<TableInsert>(tableName: TableName, rows: TableInsert[]) {
  if (rows.length === 0) return;

  const supabase = requireClient();
  const { error } = await supabase.from(tableName).upsert(rows as never);
  throwIfError(error);
}

export async function saveGarageSnapshot(snapshot: GarageSnapshot) {
  if (!isSupabaseConfigured()) return;

  await Promise.all([
    deleteAll("incoming_items"),
    deleteAll("order_items"),
  ]);

  await Promise.all([
    deleteAll("container_stock"),
    deleteAll("activity_logs"),
    deleteAll("orders"),
    deleteAll("incoming_shipments"),
    deleteAll("customers"),
  ]);

  await deleteAll("inventory_sections");

  await upsertRows("inventory_sections", snapshot.inventorySections.map((section) => ({
    id: section.id,
    title: section.title,
    created_at: section.createdAt,
  })));

  await upsertRows("customers", snapshot.customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone || null,
    address: customer.address || null,
    note: customer.note || null,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt,
  })));

  await upsertRows("incoming_shipments", snapshot.incomingList.map((incoming) => ({
    id: incoming.id,
    container_number: incoming.containerNumber,
    car_number: incoming.carNumber,
    supplier_name: incoming.supplierName,
    status: incoming.status,
    arrival_time: incoming.arrivalTime,
    duration_hours: incoming.durationHours,
    note: incoming.note || null,
  })));

  await upsertRows("incoming_items", snapshot.incomingList.flatMap((incoming) =>
    incoming.items.map((item) => ({
      incoming_id: incoming.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || null,
      container_number: item.containerNumber || incoming.containerNumber || null,
      inventory_section_id: item.inventorySectionId || null,
    }))
  ));

  await upsertRows("container_stock", snapshot.containerStock.map((row) => ({
    id: row.id,
    container_id: row.containerId,
    container_number: row.containerNumber,
    car_number: row.carNumber,
    supplier_name: row.supplierName,
    inventory_section_id: row.inventorySectionId || null,
    product_name: row.productName,
    initial_quantity: row.initialQuantity,
    remaining_quantity: row.remainingQuantity,
    unit: row.unit || null,
    received_at: row.receivedAt,
    updated_at: row.updatedAt,
  })));

  await upsertRows("orders", snapshot.orders.map((order) => ({
    id: order.id,
    customer_name: order.customerName,
    car_number: order.carNumber,
    status: order.status,
    order_time: order.orderTime,
    final_date: order.finalDate,
    customer_note: order.customerNote || null,
  })));

  await upsertRows("order_items", snapshot.orders.flatMap((order) =>
    order.items.map((item) => ({
      order_id: order.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || null,
      container_id: item.containerId || null,
      container_number: item.containerNumber || null,
    }))
  ));

  await upsertRows("activity_logs", snapshot.logs.map((log) => ({
    id: log.id,
    type: log.type,
    message: log.message,
    timestamp: log.timestamp,
    operator: log.operator || null,
  })));
}

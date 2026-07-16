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

type SyncScope =
  | "all"
  | "incoming"
  | "inventory"
  | "orders"
  | "customers"
  | "logs";

const DEFAULT_SECTION_ID = "section-general";
const OPTIONAL_ARCHIVE_COLUMNS = new Set(["is_bookmarked", "completed_at", "archived_at"]);

const isMissingOptionalArchiveColumnError = (message: string) => {
  const lowerMessage = message.toLowerCase();
  return Array.from(OPTIONAL_ARCHIVE_COLUMNS).some((column) => lowerMessage.includes(column)) &&
    (
      lowerMessage.includes("schema cache") ||
      lowerMessage.includes("could not find") ||
      lowerMessage.includes("does not exist") ||
      lowerMessage.includes("column")
    );
};

const stripOptionalArchiveColumns = <TableInsert extends Record<string, unknown>>(rows: TableInsert[]) => rows.map((row) =>
  Object.fromEntries(
    Object.entries(row).filter(([key]) => !OPTIONAL_ARCHIVE_COLUMNS.has(key))
  ) as TableInsert
);

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
    isBookmarked: incoming.is_bookmarked || false,
    completedAt: incoming.completed_at || undefined,
    archivedAt: incoming.archived_at || undefined,
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
    isBookmarked: order.is_bookmarked || false,
    completedAt: order.completed_at || undefined,
    archivedAt: order.archived_at || undefined,
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

async function deleteWhereIn(tableName: TableName, columnName: string, values: string[]) {
  const filteredValues = values.filter(Boolean);
  if (filteredValues.length === 0) return;

  const supabase = requireClient();
  const { error } = await supabase.from(tableName).delete().in(columnName, filteredValues);
  throwIfError(error);
}

async function deleteWhereEquals(tableName: TableName, columnName: string, value: string) {
  if (!value) return;

  const supabase = requireClient();
  const { error } = await supabase.from(tableName).delete().eq(columnName, value);
  throwIfError(error);
}

async function upsertRows<TableInsert extends Record<string, unknown>>(tableName: TableName, rows: TableInsert[]) {
  if (rows.length === 0) return;

  const supabase = requireClient();
  const { error } = await supabase.from(tableName).upsert(rows as never);
  if (!error) return;

  if ((tableName === "incoming_shipments" || tableName === "orders") && isMissingOptionalArchiveColumnError(error.message)) {
    const retryRows = stripOptionalArchiveColumns(rows);
    const { error: retryError } = await supabase.from(tableName).upsert(retryRows as never);
    throwIfError(retryError);
    return;
  }

  throwIfError(error);
}

export async function deleteCustomerRecord(id: string) {
  if (!isSupabaseConfigured()) return;
  await deleteWhereEquals("customers", "id", id);
}

export async function deleteIncomingRecord(id: string) {
  if (!isSupabaseConfigured()) return;
  await deleteWhereEquals("incoming_shipments", "id", id);
  await deleteWhereEquals("container_stock", "container_id", id);
}

export async function deleteOrderRecord(id: string) {
  if (!isSupabaseConfigured()) return;
  await deleteWhereEquals("orders", "id", id);
}

export async function deleteInventorySectionRecord(id: string) {
  if (!isSupabaseConfigured()) return;
  await deleteWhereEquals("container_stock", "inventory_section_id", id);
  await deleteWhereEquals("inventory_sections", "id", id);
}

export async function deleteStockRecord(id: string) {
  if (!isSupabaseConfigured()) return;
  await deleteWhereEquals("container_stock", "id", id);
}

export async function saveGarageSnapshot(snapshot: GarageSnapshot, scope: SyncScope = "all") {
  if (!isSupabaseConfigured()) return;

  if (scope === "customers") {
    await upsertRows("customers", snapshot.customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || null,
      address: customer.address || null,
      note: customer.note || null,
      created_at: customer.createdAt,
      updated_at: customer.updatedAt,
    })));
    return;
  }

  if (scope === "logs") {
    await upsertRows("activity_logs", snapshot.logs.map((log) => ({
      id: log.id,
      type: log.type,
      message: log.message,
      timestamp: log.timestamp,
      operator: log.operator || null,
    })));
    return;
  }

  if (scope === "inventory") {
    await upsertRows("inventory_sections", snapshot.inventorySections.map((section) => ({
      id: section.id,
      title: section.title,
      created_at: section.createdAt,
    })));

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
    return;
  }

  if (scope === "incoming") {
    await deleteWhereIn("incoming_items", "incoming_id", snapshot.incomingList.map((incoming) => incoming.id));

    await upsertRows("inventory_sections", snapshot.inventorySections.map((section) => ({
      id: section.id,
      title: section.title,
      created_at: section.createdAt,
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
      is_bookmarked: incoming.isBookmarked || false,
      completed_at: incoming.completedAt || null,
      archived_at: incoming.archivedAt || null,
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
    return;
  }

  if (scope === "orders") {
    await deleteWhereIn("order_items", "order_id", snapshot.orders.map((order) => order.id));

    await upsertRows("customers", snapshot.customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || null,
      address: customer.address || null,
      note: customer.note || null,
      created_at: customer.createdAt,
      updated_at: customer.updatedAt,
    })));

    await upsertRows("orders", snapshot.orders.map((order) => ({
      id: order.id,
      customer_name: order.customerName,
      car_number: order.carNumber,
      status: order.status,
      order_time: order.orderTime,
      final_date: order.finalDate,
      customer_note: order.customerNote || null,
      is_bookmarked: order.isBookmarked || false,
      completed_at: order.completedAt || null,
      archived_at: order.archivedAt || null,
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
    return;
  }

  await Promise.all([
    deleteWhereIn("incoming_items", "incoming_id", snapshot.incomingList.map((incoming) => incoming.id)),
    deleteWhereIn("order_items", "order_id", snapshot.orders.map((order) => order.id)),
  ]);

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
    is_bookmarked: incoming.isBookmarked || false,
    completed_at: incoming.completedAt || null,
    archived_at: incoming.archivedAt || null,
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
    is_bookmarked: order.isBookmarked || false,
    completed_at: order.completedAt || null,
    archived_at: order.archivedAt || null,
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

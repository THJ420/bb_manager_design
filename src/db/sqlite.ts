import * as SQLite from 'expo-sqlite';
import { Order, MenuItem, OutboxAction } from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('bb_manager_local.db');
    await initSchema(dbInstance);
  }
  return dbInstance;
}

async function initSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS cached_orders (
      id TEXT PRIMARY KEY NOT NULL,
      branch_id TEXT NOT NULL,
      order_number TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      status TEXT NOT NULL,
      items_json TEXT NOT NULL,
      total_amount REAL NOT NULL,
      created_at TEXT NOT NULL,
      pickup_code TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS cached_menu (
      id TEXT PRIMARY KEY NOT NULL,
      branch_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      currency TEXT NOT NULL,
      in_stock INTEGER NOT NULL,
      is_visible INTEGER NOT NULL DEFAULT 1,
      image_url TEXT,
      prep_minutes INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS outbox_queue (
      id TEXT PRIMARY KEY NOT NULL,
      action_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      retry_count INTEGER DEFAULT 0,
      synced INTEGER DEFAULT 0
    );
  `);
}

// Caching operations for orders
export async function cacheOrders(orders: Order[]): Promise<void> {
  const db = await getDatabase();
  for (const o of orders) {
    await db.runAsync(
      `INSERT OR REPLACE INTO cached_orders 
       (id, branch_id, order_number, customer_name, customer_phone, status, items_json, total_amount, created_at, pickup_code, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      o.id,
      o.branchId,
      o.orderNumber,
      o.customerName,
      o.customerPhone,
      o.status,
      JSON.stringify(o.items),
      o.totalAmount,
      o.createdAt,
      o.pickupCode,
      o.notes || ''
    );
  }
}

export async function getCachedOrders(branchId: string): Promise<Order[]> {
  const db = await getDatabase();
  const rows: any[] = await db.getAllAsync(
    `SELECT * FROM cached_orders WHERE branch_id = ? ORDER BY created_at DESC`,
    branchId
  );
  return rows.map((r) => ({
    id: r.id,
    branchId: r.branch_id,
    orderNumber: r.order_number,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    status: r.status,
    items: JSON.parse(r.items_json || '[]'),
    totalAmount: r.total_amount,
    createdAt: r.created_at,
    pickupCode: r.pickup_code,
    notes: r.notes,
  }));
}

// Caching operations for menu items
export async function cacheMenuItems(items: MenuItem[]): Promise<void> {
  const db = await getDatabase();
  for (const m of items) {
    await db.runAsync(
      `INSERT OR REPLACE INTO cached_menu
       (id, branch_id, name, category, description, price, currency, in_stock, is_visible, image_url, prep_minutes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      m.id,
      m.branchId,
      m.name,
      m.category,
      m.description,
      m.price,
      m.currency,
      m.inStock ? 1 : 0,
      m.isVisible !== false ? 1 : 0,
      m.imageUrl || '',
      m.preparationMinutes,
      m.updatedAt
    );
  }
}

export async function getCachedMenu(branchId: string): Promise<MenuItem[]> {
  const db = await getDatabase();
  const rows: any[] = await db.getAllAsync(
    `SELECT * FROM cached_menu WHERE branch_id = ? ORDER BY category ASC, name ASC`,
    branchId
  );
  return rows.map((r) => ({
    id: r.id,
    branchId: r.branch_id,
    name: r.name,
    category: r.category,
    description: r.description,
    price: r.price,
    currency: r.currency,
    inStock: r.in_stock === 1,
    isVisible: r.is_visible !== 0,
    imageUrl: r.image_url || undefined,
    preparationMinutes: r.prep_minutes,
    updatedAt: r.updated_at,
  }));
}

// Outbox Queue for Offline Synchronization
export async function enqueueOutboxAction(
  actionType: OutboxAction['actionType'],
  payload: Record<string, any>
): Promise<string> {
  const db = await getDatabase();
  const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await db.runAsync(
    `INSERT INTO outbox_queue (id, action_type, payload, created_at, retry_count, synced)
     VALUES (?, ?, ?, ?, 0, 0)`,
    id,
    actionType,
    JSON.stringify(payload),
    Date.now()
  );
  return id;
}

export async function getPendingOutboxActions(): Promise<OutboxAction[]> {
  const db = await getDatabase();
  const rows: any[] = await db.getAllAsync(
    `SELECT * FROM outbox_queue WHERE synced = 0 ORDER BY created_at ASC`
  );
  return rows.map((r) => ({
    id: r.id,
    actionType: r.action_type,
    payload: r.payload,
    createdAt: r.created_at,
    retryCount: r.retry_count,
    synced: r.synced === 1,
  }));
}

export async function markOutboxActionSynced(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE outbox_queue SET synced = 1 WHERE id = ?`, id);
}

export async function incrementOutboxRetry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE outbox_queue SET retry_count = retry_count + 1 WHERE id = ?`, id);
}

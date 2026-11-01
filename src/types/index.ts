export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  branchId: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  estimatedPickupAt?: string;
  pickupCode: string;
  notes?: string;
}

export interface MenuItem {
  id: string;
  branchId: string;
  name: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  inStock: boolean;
  isVisible: boolean;
  preparationMinutes: number;
  imageUrl?: string;
  modifiers?: string[];
  updatedAt: string;
}

export interface DiningTable {
  id: string;
  branchId: string;
  tableNumber: string;
  name: string;
  capacity: number;
  isAvailable: boolean;
  currentGuests?: number;
  zone?: string; // e.g. "Main Dining", "Patio", "Bar"
}

export type ReservationStatus = 'upcoming' | 'arrived' | 'seated' | 'completed' | 'cancelled';

export interface Reservation {
  id: string;
  branchId: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  reservationTime: string; // ISO or formatted e.g. "7:30 PM"
  tableNumber?: string;
  status: ReservationStatus;
  specialRequests?: string;
}

export interface DaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface StoreOperationsConfig {
  isOpenForOrders: boolean;
  openingTime: string; // "10:00 AM"
  closingTime: string; // "10:30 PM"
  slotIntervalMinutes: number; // 15, 30, 45, 60
  acceptingPickups: boolean;
  acceptingReservations: boolean;
  maxActiveTickets: number;
  weeklySchedule?: DaySchedule[];
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: 'manager' | 'kitchen_lead' | 'floor_staff';
  branchId: string;
  branchName: string;
}

export type ConnectionStatus = 'live' | 'polling' | 'offline';

export interface OutboxAction {
  id: string;
  actionType:
    | 'UPDATE_ORDER_STATUS'
    | 'UPDATE_MENU_STOCK'
    | 'UPDATE_MENU_PRICE'
    | 'CREATE_MENU_ITEM'
    | 'UPDATE_MENU_ITEM'
    | 'CREATE_TABLE'
    | 'UPDATE_TABLE'
    | 'UPDATE_RESERVATION_STATUS'
    | 'UPDATE_STORE_HOURS';
  payload: string; // JSON string
  createdAt: number;
  retryCount: number;
  synced: boolean;
}

export interface PeakHourBucket {
  timeSlot: string;
  orderCount: number;
  revenue: number;
  percentage: number;
  isPeak?: boolean;
}

export interface AnalyticsSummary {
  dailyRevenue: number;
  completedOrdersCount: number;
  averagePrepMinutes: number;
  activeTicketsCount: number;
  statusBreakdown: {
    newCount: number;
    preparingCount: number;
    readyCount: number;
    completedCount: number;
    cancelledCount: number;
  };
  peakHours: PeakHourBucket[];
  cancellationRate: number;
  averageRevenuePerTicket: number;
  tableTurnoverRate: number;
  staffShiftEfficiencyScore: number;
}


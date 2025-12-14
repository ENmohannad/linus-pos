
export type Language = 'ar' | 'en';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  barcode: string;
  image?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  date: string; // ISO String
  items: CartItem[];
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  currency: string;
  cashier: string;
  customerName?: string;
  paymentMethod?: 'Cash' | 'Electronic' | 'Credit';
  status?: string;
  paymentDetails?: string;
}

export interface HeldInvoice {
  id: string;
  date: string;
  items: CartItem[];
}

export interface UserPermissions {
  canManageInventory: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
}

export interface User {
  username: string;
  password?: string;
  role: 'admin' | 'staff'; // Kept for legacy compatibility
  name: string;
  permissions: UserPermissions;
  isActive?: boolean; // New field to control account status
}

export interface SystemSettings {
  currency: string;
  lowStockThreshold: number;
  storeName: string;
  taxRate: number;
}

export enum Currency {
  SAR = 'SAR',
  USD = 'USD',
  YER = 'YER'
}

export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  POS = 'POS',
  INVENTORY = 'INVENTORY',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS'
}

export interface ReportStats {
  totalRevenue: number;
  totalSales: number;
  topSellingProduct: string;
  lowStockCount: number;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'warning' | 'info';
  read: boolean;
}

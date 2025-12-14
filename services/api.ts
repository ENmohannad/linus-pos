
import { Product, Sale, User, CartItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper for fetch
const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${endpoint}`, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// --- Products ---
export const getProducts = async (): Promise<Product[]> => {
  return apiCall('/products');
};

export const saveProducts = async (products: Product[]) => {
  // In SQL version, this is usually just adding/updating items
  // But for compatibility with the frontend logic that sends the whole array sometimes:
  // We'll assume the frontend logic is refactored to send individual updates or we handle bulk
  return apiCall('/products', 'POST', products);
};

export const clearProducts = async () => {
  return apiCall('/products', 'DELETE');
};

// --- Sales ---
export const getSales = async (): Promise<Sale[]> => {
  return apiCall('/sales');
};

export const saveSale = async (saleData: Omit<Sale, 'cashier'>, cashierName: string) => {
  const sale = { ...saleData, cashier: cashierName };
  return apiCall('/sales', 'POST', sale);
};

// --- Users ---
export const getUsers = async (): Promise<User[]> => {
  return apiCall('/users');
};

export const addUser = async (user: User) => {
  return apiCall('/users', 'POST', user);
};

export const toggleUserStatus = async (username: string) => {
  return apiCall(`/users/${username}/toggle`, 'PUT');
};

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  try {
    return await apiCall('/login', 'POST', { username, password });
  } catch (e) {
    return null;
  }
};

// --- Local Functions (Still needed locally) ---
// PDF Export functions remain client-side (can be imported from storage.ts or moved to a shared utils file)
// For now, we assume PDF logic stays in client.

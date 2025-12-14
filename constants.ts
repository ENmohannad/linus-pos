
import { Product, Currency } from './types';

export const INITIAL_PRODUCTS: Product[] = [];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.SAR]: 'ر.س',
  [Currency.USD]: '$',
  [Currency.YER]: 'ر.ي',
};

export const TAX_RATE = 0.15; // 15% Tax

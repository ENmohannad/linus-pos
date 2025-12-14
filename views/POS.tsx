
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, CartItem, Currency, User, HeldInvoice } from '../types';
import { CURRENCY_SYMBOLS, TAX_RATE } from '../constants';
import { GlassCard } from '../components/GlassCard';
import { Search, Trash2, Plus, Minus, CreditCard, Printer, Save, ScanLine, Filter, LayoutGrid, Clock, RefreshCcw, X, ChevronRight, Layers } from 'lucide-react';
import { saveSale, getProducts, printReceipt, saveHeldInvoice, getHeldInvoices, deleteHeldInvoice } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';

interface POSProps {
  currency: Currency;
  lowStockThreshold: number;
  currentUser: User | null;
}

const PRODUCT_DISPLAY_THRESHOLD = 20;

export const POS: React.FC<POSProps> = ({ currency, lowStockThreshold, currentUser }) => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Checkout State
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Electronic' | 'Credit'>('Cash');

  // Held Invoices State
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [heldInvoices, setHeldInvoices] = useState<HeldInvoice[]>([]);

  useEffect(() => {
    const load = () => setProducts(getProducts());
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  // Extract Categories
  const categories = useMemo(() =>
    ['All', ...Array.from(new Set(products.map(p => p.category))).filter(Boolean)],
    [products]);

  // Filtered Products for Grid/Search
  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return searchTerm ? matchesSearch : matchesCategory;
  }), [products, searchTerm, selectedCategory]);

  // Group Products for Large Inventory View
  const productsByCategory = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach(p => {
      const cat = p.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [products]);

  // Determine View Mode
  const showCategoryRows = !searchTerm && selectedCategory === 'All' && products.length > PRODUCT_DISPLAY_THRESHOLD;

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(t('outOfStock'));
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        const product = products.find(p => p.id === id);
        if (product && newQty > product.stock) {
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: cart,
      subtotal,
      tax,
      discount: 0,
      total,
      currency
    };

    const cashierName = currentUser?.name || 'Unknown';
    saveSale(sale, cashierName);
    setCart([]);
    setProducts(getProducts());
    alert(t('saleSuccess'));
  };

  const handlePrint = () => {
    if (cart.length === 0) return;
    printReceipt({
      items: cart,
      subtotal,
      tax,
      total,
      currency: currencySymbol
    });
  };

  const handleSuspend = () => {
    if (cart.length === 0) return;
    saveHeldInvoice(cart);
    setCart([]);
    alert(t('suspendSuccess'));
  };

  const handleOpenHeldInvoices = () => {
    setHeldInvoices(getHeldInvoices());
    setIsHeldModalOpen(true);
  };

  const handleRestoreInvoice = (invoice: HeldInvoice) => {
    if (cart.length > 0) {
      if (!confirm('Current cart is not empty. Override?')) {
        return;
      }
    }
    setCart(invoice.items);
    deleteHeldInvoice(invoice.id);
    setHeldInvoices(getHeldInvoices());
    setIsHeldModalOpen(false);
  };

  const handleDeleteHeldInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this held invoice?')) {
      deleteHeldInvoice(id);
      setHeldInvoices(getHeldInvoices());
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const product = products.find(p => p.barcode === searchTerm);
      if (product) {
        addToCart(product);
        setSearchTerm('');
      }
    }
  };

  // --- Render Helpers ---
  const renderProductCard = (product: Product, isCarousel = false) => (
    <GlassCard
      key={product.id}
      hoverEffect={true}
      onClick={() => addToCart(product)}
      className={`relative overflow-hidden group ${product.stock === 0 ? 'opacity-60 grayscale cursor-not-allowed' : ''} ${isCarousel ? 'w-[240px] flex-shrink-0 snap-start' : ''}`}
    >
      {product.stock < lowStockThreshold && product.stock > 0 && (
        <span className="absolute top-2 right-2 bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full z-10">
          {t('lowStock')}
        </span>
      )}
      {product.stock === 0 && (
        <div className="absolute inset-0 bg-slate-900/10 z-10 flex items-center justify-center">
          <span className="bg-slate-800 text-white px-3 py-1 rounded-md font-bold transform -rotate-12">{t('outOfStock')}</span>
        </div>
      )}

      <div className={`${isCarousel ? 'h-48' : 'h-32'} w-full mb-3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 relative`}>
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-300 dark:text-slate-600">
            <ScanLine size={isCarousel ? 48 : 40} />
          </div>
        )}
      </div>
      <h3 className="font-bold text-slate-800 dark:text-white truncate text-start">{product.name}</h3>
      <div className="flex justify-between items-end mt-2">
        <span className="text-primary-600 dark:text-primary-400 font-bold text-lg">
          {product.price} <span className="text-xs">{currencySymbol}</span>
        </span>
        <span className="text-xs text-slate-400">{t('stock')}: {product.stock}</span>
      </div>
    </GlassCard>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      <div className="flex-1 flex flex-col gap-4 h-full overflow-hidden">

        {/* Top Bar: Search & Categories */}
        <div className="flex flex-col gap-4">
          <div className="glass rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center sticky top-0 z-20">
            <div className="relative w-full">
              <Search className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('searchPlaceholder')}
                className="w-full pr-10 pl-10 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
            </div>
          </div>

          {/* Categories Carousel */}
          {(!showCategoryRows || searchTerm) && !searchTerm && (
            <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar select-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    whitespace-nowrap px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 border
                    ${selectedCategory === cat
                      ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/30 scale-105'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:text-primary-600'}
                  `}
                >
                  {cat === 'All' ? t('allCategories') : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Area */}
        <div className="flex-1 overflow-y-auto p-1 scroll-smooth">
          {showCategoryRows ? (
            // Carousel View for Large Inventories
            <div className="space-y-8 pb-20">
              {Object.entries(productsByCategory).map(([category, catProducts]: [string, Product[]]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-1.5 h-6 bg-primary-500 rounded-full"></div>
                    <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">{category}</h3>
                    <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full">
                      {catProducts.length}
                    </span>
                  </div>
                  <div className="flex overflow-x-auto gap-4 px-1 pb-4 snap-x scrollbar-hide">
                    {catProducts.map(product => renderProductCard(product, true))}
                    <div className="w-2 flex-shrink-0"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Standard Grid View
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
              {filteredProducts.map(product => renderProductCard(product))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex flex-col h-[80vh] lg:h-auto sticky top-4 overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
          <h2 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <div className="w-2 h-8 bg-primary-500 rounded-full"></div>
            {t('currentBill')}
          </h2>
          <button
            onClick={handleOpenHeldInvoices}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            title={t('heldInvoices')}
          >
            <Clock size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 opacity-60">
              <ShoppingBagIcon />
              <p className="mt-4">{t('emptyCart')}</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-700 overflow-hidden flex-shrink-0">
                  {item.image && <img src={item.image} className="w-full h-full object-cover" alt="" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate max-w-[120px] text-start">{item.name}</h4>
                  <p className="text-primary-600 dark:text-primary-400 text-sm font-bold text-start">{item.price * item.quantity} {currencySymbol}</p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-700 rounded-lg p-1 shadow-sm">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300"><Minus size={14} /></button>
                  <span className="w-6 text-center font-bold text-sm dark:text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded text-primary-600 dark:text-primary-400"><Plus size={14} /></button>
                </div>

                <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 mb-4">
          {/* Customer Name Input */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">{t('customerName')}</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder={t('customerNamePlaceholder')}
              className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border-none text-sm dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">{t('paymentMethod')}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'Electronic', 'Credit'] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`
                       py-2 rounded-lg text-xs font-bold transition-all
                       ${paymentMethod === method
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-primary-400'}
                     `}
                >
                  {t(method.toLowerCase())}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between text-slate-500 dark:text-slate-400 mt-2 text-sm">
            <span>{t('subtotal')}</span>
            <span>{subtotal.toFixed(2)} {currencySymbol}</span>
          </div>
          <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
            <span>{t('tax')} ({(TAX_RATE * 100).toFixed(0)}%)</span>
            <span>{tax.toFixed(2)} {currencySymbol}</span>
          </div>
          <div className="flex justify-between font-bold text-xl text-slate-800 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
            <span>{t('total')}</span>
            <span className="text-primary-600 dark:text-primary-400">{total.toFixed(2)} {currencySymbol}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            className={`col-span-2 flex items-center justify-center gap-2 py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${cart.length === 0 ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/30'}`}
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            <CreditCard size={20} />
            {t('checkout')}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
          >
            <Printer size={18} />
            {t('printDraft')}
          </button>
          <button
            onClick={handleSuspend}
            className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
          >
            <Save size={18} />
            {t('suspendSale')}
          </button>
        </div>
      </div>
      {/* Held Invoices Modal */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-float">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Clock size={20} className="text-primary-500" />
                {t('heldInvoices')}
              </h3>
              <button onClick={() => setIsHeldModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
              {heldInvoices.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <Clock size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No held invoices</p>
                </div>
              ) : (
                heldInvoices.map(inv => {
                  const itemsCount = inv.items.reduce((acc, i) => acc + i.quantity, 0);
                  const invTotal = inv.items.reduce((acc, i) => acc + (i.price * i.quantity), 0) * (1 + TAX_RATE);

                  return (
                    <div key={inv.id} className="p-3 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-700/30 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(inv.date).toLocaleTimeString()}
                        </div>
                        <div className="font-bold text-slate-800 dark:text-white text-sm mt-1">{itemsCount} Products</div>
                        <div className="text-primary-600 dark:text-primary-400 font-bold text-sm">{invTotal.toFixed(2)} {currencySymbol}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestoreInvoice(inv)}
                          className="p-2 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/40 transition-colors"
                          title={t('restore')}
                        >
                          <RefreshCcw size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteHeldInvoice(inv.id)}
                          className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                          title={t('delete')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShoppingBagIcon = () => (
  <svg className="w-24 h-24 text-slate-200 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

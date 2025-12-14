
import React, { useState, useEffect } from 'react';
import { Product, Currency, User } from '../types';
import { getProducts, saveProducts, exportInventoryCSV, exportInventoryPDF, clearProducts } from '../services/storage';
import { CURRENCY_SYMBOLS } from '../constants';
import { Plus, Edit3, Trash2, X, Save, AlertTriangle, Download, FileText, Search, Filter, Trash, PackageOpen } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface InventoryProps {
  currency: Currency;
  lowStockThreshold: number;
  user: User | null;
}

export const Inventory: React.FC<InventoryProps> = ({ currency, lowStockThreshold, user }) => {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const canEdit = user?.permissions?.canManageInventory ?? false;
  const [formData, setFormData] = useState<Partial<Product>>({});

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (product?: Product) => {
    if (!canEdit) return;
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: 'General',
        price: 0,
        stock: 0,
        barcode: '',
        image: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!canEdit) return;
    if (confirm(t('deleteConfirm'))) {
      const newProducts = products.filter(p => p.id !== id);
      setProducts(newProducts);
      saveProducts(newProducts);
    }
  };

  const handleClearAll = () => {
    if (!canEdit) return;
    if (confirm(t('clearWarning'))) {
      clearProducts();
      setProducts([]);
    }
  }

  const handleSave = () => {
    if (!canEdit) return;
    if (!formData.name || formData.price === undefined || !formData.barcode) {
      alert('Please fill required fields');
      return;
    }

    let newProducts = [...products];

    if (editingProduct) {
      newProducts = newProducts.map(p => 
        p.id === editingProduct.id ? { ...p, ...formData } as Product : p
      );
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        ...formData as Product
      };
      newProducts.push(newProduct);
    }

    setProducts(newProducts);
    saveProducts(newProducts);
    setIsModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Top Header Area */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <PackageOpen className="text-primary-500" size={28} />
            {t('manageInventory')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t('inventorySubtitle')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
           {/* Exports Group */}
           <div className="flex gap-2">
              <button 
                onClick={exportInventoryCSV}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-sm shadow-sm"
              >
                <Download size={16} />
                <span>CSV</span>
              </button>
              <button 
                onClick={() => exportInventoryPDF(language)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-sm shadow-sm"
              >
                <FileText size={16} />
                <span>PDF</span>
              </button>
           </div>
          
          {/* Actions Group */}
          {canEdit && (
            <div className="flex gap-2 border-e-0 sm:border-e border-slate-200 dark:border-slate-700 sm:pe-4">
              <button 
                onClick={handleClearAll}
                className="flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-bold text-sm border border-red-100 dark:border-red-900/30"
              >
                <Trash size={16} />
                <span className="hidden sm:inline">{t('clearAll')}</span>
              </button>
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 font-bold text-sm"
              >
                <Plus size={18} />
                <span>{t('addProduct')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            className="w-full px-10 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative w-full md:w-64">
          <Filter className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <select 
            className="w-full px-10 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 appearance-none dark:text-white transition-all"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">{t('allCategories')}</option>
            {categories.filter(c => c !== 'All').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden flex-1 shadow-sm">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-start">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300 text-start">#</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300 text-start">{t('productName')}</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300 text-start">{t('category')}</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300 text-start">{t('barcode')}</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300 text-start">{t('stock')}</th>
                <th className="p-4 font-bold text-slate-600 dark:text-slate-300 text-start">{t('price')}</th>
                {canEdit && <th className="p-4 font-bold text-slate-600 dark:text-slate-300 text-start">{t('actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="opacity-20" />
                      <p>No products found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isLowStock = product.stock < lowStockThreshold;
                  return (
                    <tr 
                      key={product.id} 
                      className={`
                        transition-colors
                        ${isLowStock 
                          ? 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20' 
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}
                      `}
                    >
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          {product.image && <img src={product.image} alt="" className="w-full h-full object-cover" />}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                        {product.name}
                        {isLowStock && (
                          <span title={t('lowStock')}>
                            <AlertTriangle size={16} className="text-red-500" />
                          </span>
                        )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-xs">{product.category}</span>
                      </td>
                      <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{product.barcode}</td>
                      <td className="p-4">
                        <span className={`font-bold px-2 py-1 rounded-lg ${isLowStock ? 'text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-primary-600 dark:text-primary-400">
                        {product.price} {CURRENCY_SYMBOLS[currency]}
                      </td>
                      {canEdit && (
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => handleOpenModal(product)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title={t('edit')}>
                              <Edit3 size={18} />
                            </button>
                            <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title={t('delete')}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-float dark:border dark:border-slate-700" style={{animation: 'none'}}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {editingProduct ? <Edit3 size={20} className="text-primary-500" /> : <Plus size={20} className="text-primary-500" />}
                {editingProduct ? t('edit') : t('addProduct')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('productName')} <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('price')} <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('initialStock')}</label>
                    <input 
                      type="number" 
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      value={formData.stock}
                      onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                    />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('category')}</label>
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      list="category-list"
                    />
                    <datalist id="category-list">
                       {categories.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
                    </datalist>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('barcode')} <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      value={formData.barcode}
                      onChange={e => setFormData({...formData, barcode: e.target.value})}
                    />
                 </div>
              </div>
               <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('image')}</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  value={formData.image}
                  onChange={e => setFormData({...formData, image: e.target.value})}
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex gap-3 justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors">{t('cancel')}</button>
              <button onClick={handleSave} className="px-6 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-bold shadow-lg shadow-primary-500/20 flex items-center gap-2 transition-colors transform active:scale-95">
                <Save size={18} />
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

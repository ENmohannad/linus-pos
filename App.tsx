
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AppView, Currency, User, SystemSettings, AppNotification } from './types';
import { POS } from './views/POS';
import { Inventory } from './views/Inventory';
import { Reports } from './views/Reports';
import { Dashboard } from './views/Dashboard';
import { Login } from './views/Login';
import { getSettings, saveSettings, getProducts } from './services/storage';
import { Globe, Bell, Moon, Sun, AlertTriangle } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const AppContent: React.FC = () => {
  // State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.POS);
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const { t, language, setLanguage, dir } = useLanguage();

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Update HTML direction
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  useEffect(() => {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('linus_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    // Notification Check Loop (Low Stock)
    const checkNotifications = () => {
      if (!isAuthenticated) return;
      const products = getProducts();
      const lowStockItems = products.filter(p => p.stock <= settings.lowStockThreshold);
      
      const newNotifications: AppNotification[] = lowStockItems.map(p => ({
        id: `low_stock_${p.id}`,
        message: `${t('lowStock')}: ${p.name} (${t('stock')}: ${p.stock})`,
        type: 'warning',
        read: false
      }));

      setNotifications(newNotifications);
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated, settings.lowStockThreshold, t]);

  // Apply dark mode class to html/body
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('linus_theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('linus_theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentView(AppView.POS);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView(AppView.LOGIN);
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated);
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleLanguage = () => setLanguage(language === 'ar' ? 'en' : 'ar');

  // View Renderer
  const renderView = () => {
    switch (currentView) {
      case AppView.POS:
        return <POS currency={settings.currency as Currency} lowStockThreshold={settings.lowStockThreshold} currentUser={user} />;
      case AppView.INVENTORY:
        return <Inventory currency={settings.currency as Currency} lowStockThreshold={settings.lowStockThreshold} user={user} />;
      case AppView.REPORTS:
        return <Reports currency={settings.currency as Currency} />;
      case AppView.DASHBOARD:
        return <Dashboard />;
      case AppView.SETTINGS:
        return (
          <div className="p-8 max-w-2xl mx-auto glass rounded-2xl mt-10">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{t('settings')}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('storeName')}</label>
                <input 
                  type="text"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  value={settings.storeName}
                  onChange={(e) => updateSettings({ storeName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('lowStockThreshold')}</label>
                <input 
                  type="number"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  value={settings.lowStockThreshold}
                  onChange={(e) => updateSettings({ lowStockThreshold: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('systemCurrency')}</label>
                <div className="grid grid-cols-3 gap-4">
                  {[Currency.SAR, Currency.USD, Currency.YER].map((cur) => (
                    <button
                      key={cur}
                      onClick={() => updateSettings({ currency: cur })}
                      className={`p-4 rounded-xl border-2 font-bold transition-all ${
                        settings.currency === cur 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                 <h3 className="font-bold mb-2 text-slate-800 dark:text-white">System Info</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm">Linus POS v1.3.0</p>
              </div>
            </div>
          </div>
        );
      default:
        return <POS currency={settings.currency as Currency} lowStockThreshold={settings.lowStockThreshold} currentUser={user} />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-primary-200 selection:text-primary-900 transition-colors duration-300">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout} user={user} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 transition-colors">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              {currentView === AppView.POS && t('pos')}
              {currentView === AppView.INVENTORY && t('inventory')}
              {currentView === AppView.REPORTS && t('reports')}
              {currentView === AppView.SETTINGS && t('settings')}
              {currentView === AppView.DASHBOARD && t('dashboard')}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
               onClick={toggleLanguage}
               className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-center transition-all"
             >
               {language === 'ar' ? 'EN' : 'ع'}
             </button>

             <button 
               onClick={toggleTheme}
               className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
             >
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>

             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300">
                <Globe size={16} />
                <span>{settings.currency}</span>
             </div>
             
             {/* Notifications Bell */}
             <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-colors relative"
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800 animate-pulse"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute top-12 left-0 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden dir-rtl">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="font-bold text-sm">Notifications</h3>
                      <span className="text-xs text-slate-500">{notifications.length} new</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">No new notifications</div>
                      ) : (
                        notifications.map(note => (
                          <div key={note.id} className="p-3 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex gap-3 items-start">
                             <AlertTriangle size={16} className="text-red-500 mt-1 shrink-0" />
                             <p className="text-sm text-slate-700 dark:text-slate-300">{note.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
             </div>

             <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-emerald-300 text-white flex items-center justify-center font-bold shadow-lg shadow-primary-500/20">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm font-bold text-slate-700 dark:text-slate-200">
                  {user?.name}
                </span>
             </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8 relative">
          {/* Background Decorative Blobs */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
          
          <div className="relative h-full z-10">
             {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);

export default App;

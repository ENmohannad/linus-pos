
import React from 'react';
import { ShoppingCart, Package, BarChart3, Settings, LogOut, Home } from 'lucide-react';
import { AppView, User } from '../types';
import { Logo } from './Logo';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onLogout: () => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, user }) => {
  const { t } = useLanguage();

  const menuItems = [
    { id: AppView.DASHBOARD, label: t('dashboard'), icon: Home, visible: user?.permissions?.canManageUsers },
    { id: AppView.POS, label: t('pos'), icon: ShoppingCart, visible: true },
    { id: AppView.INVENTORY, label: t('inventory'), icon: Package, visible: true }, 
    { id: AppView.REPORTS, label: t('reports'), icon: BarChart3, visible: user?.permissions?.canViewReports },
    { id: AppView.SETTINGS, label: t('settings'), icon: Settings, visible: user?.permissions?.canManageSettings },
  ];

  return (
    <aside className="w-20 lg:w-64 h-screen bg-white dark:bg-slate-900 border-e border-slate-100 dark:border-slate-800 flex flex-col justify-between sticky top-0 z-50 transition-all duration-300 shadow-xl lg:shadow-none">
      <div className="p-4 lg:p-6 flex flex-col items-center lg:items-start">
        <div className="flex items-center gap-3 mb-10 justify-center w-full lg:justify-start">
          <Logo size={48} />
          <span className="hidden lg:block font-bold text-2xl text-slate-800 dark:text-white tracking-tight">Linus</span>
        </div>

        <nav className="w-full space-y-2">
          {menuItems.map((item) => {
            if (!item.visible) return null;
            
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`
                  w-full flex items-center justify-center lg:justify-start gap-4 p-3 rounded-xl transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
                `}
              >
                <Icon size={24} className={isActive ? 'stroke-primary-600 dark:stroke-primary-400' : 'stroke-slate-400 dark:stroke-slate-500 group-hover:stroke-slate-900 dark:group-hover:stroke-white'} />
                <span className="hidden lg:block text-base">{item.label}</span>
                {isActive && <div className="absolute right-0 lg:left-auto lg:right-0 w-1 lg:w-1 h-8 bg-primary-500 rounded-s-full" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 lg:p-6">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center lg:justify-start gap-4 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors group"
        >
          <LogOut size={24} className="group-hover:stroke-red-600" />
          <span className="hidden lg:block font-medium">{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
};

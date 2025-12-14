
import React, { useState, useEffect } from 'react';
import { User, Sale } from '../types';
import { getUsers, addUser, getSales, exportDailyReportCSV, exportDailyReportPDF, toggleUserStatus } from '../services/storage';
import { UserPlus, Download, Users, Shield, FileText, CheckSquare, Square, ToggleRight, ToggleLeft, ShoppingCart, BarChart3, Settings, Crown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'staff', 
  });

  const [permissions, setPermissions] = useState({
    canManageInventory: false,
    canViewReports: false,
    canManageSettings: false,
    canManageUsers: false,
  });

  useEffect(() => {
    setUsers(getUsers());
    setSales(getSales());
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newUser.password) {
        alert('Password required');
        return;
      }

      const userToAdd: User = { 
        ...newUser, 
        role: newUser.role as 'admin' | 'staff',
        permissions: permissions
      };
      
      addUser(userToAdd);
      setUsers(getUsers());
      setIsAddUserOpen(false);
      
      setNewUser({ username: '', password: '', name: '', role: 'staff' });
      setPermissions({
        canManageInventory: false,
        canViewReports: false,
        canManageSettings: false,
        canManageUsers: false,
      });
      
      alert('User added successfully');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error');
    }
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleUserStatus = (username: string) => {
    if (username === 'admin') {
      alert('Cannot disable main admin');
      return;
    }
    toggleUserStatus(username);
    setUsers(getUsers());
  };

  const handleExportReportCSV = () => {
    exportDailyReportCSV(sales);
  };

  const handleExportReportPDF = () => {
    exportDailyReportPDF(sales, language);
  };

  return (
    <div className="space-y-8 h-full overflow-y-auto pb-10">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('dashboard')}</h2>
           <p className="text-slate-500 dark:text-slate-400">{t('userManagement')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add User Card */}
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                  <UserPlus size={20} />
               </div>
               <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t('userManagement')}</h3>
             </div>
             <button 
               onClick={() => setIsAddUserOpen(!isAddUserOpen)}
               className="text-primary-600 font-bold text-sm hover:underline"
             >
               {isAddUserOpen ? t('close') : t('addUser')}
             </button>
          </div>

          {isAddUserOpen ? (
            <form onSubmit={handleAddUser} className="space-y-4 animate-float" style={{animation: 'none'}}>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  placeholder={t('username')}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-white"
                  value={newUser.username}
                  onChange={e => setNewUser({...newUser, username: e.target.value})}
                  required
                />
                <input 
                  type="password"
                  placeholder={t('password')}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-white"
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <input 
                placeholder={t('fullName')}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-white"
                value={newUser.name}
                onChange={e => setNewUser({...newUser, name: e.target.value})}
                required
              />
              
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">{t('permissions')}:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => togglePermission('canManageInventory')}>
                     {permissions.canManageInventory ? <CheckSquare size={20} className="text-primary-500" /> : <Square size={20} className="text-slate-400" />}
                     <span className="text-sm text-slate-700 dark:text-slate-300">{t('permInventory')}</span>
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => togglePermission('canViewReports')}>
                     {permissions.canViewReports ? <CheckSquare size={20} className="text-primary-500" /> : <Square size={20} className="text-slate-400" />}
                     <span className="text-sm text-slate-700 dark:text-slate-300">{t('permReports')}</span>
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => togglePermission('canManageSettings')}>
                     {permissions.canManageSettings ? <CheckSquare size={20} className="text-primary-500" /> : <Square size={20} className="text-slate-400" />}
                     <span className="text-sm text-slate-700 dark:text-slate-300">{t('permSettings')}</span>
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => togglePermission('canManageUsers')}>
                     {permissions.canManageUsers ? <CheckSquare size={20} className="text-primary-500" /> : <Square size={20} className="text-slate-400" />}
                     <span className="text-sm text-slate-700 dark:text-slate-300">{t('permUsers')}</span>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20">
                {t('save')}
              </button>
            </form>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {users.map((u, idx) => {
                const isAdmin = u.username === 'admin';
                return (
                  <div 
                    key={idx} 
                    className={`
                      flex items-center justify-between p-3 rounded-xl transition-colors
                      ${u.isActive ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-red-50 dark:bg-red-900/10 opacity-75'}
                      ${isAdmin ? 'border border-yellow-200 dark:border-yellow-900/30' : 'border border-transparent'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                         {isAdmin ? <Crown size={16} /> : <Users size={14} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1">
                          {u.name}
                          {isAdmin && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 rounded-full">Admin</span>}
                        </p>
                        <p className="text-xs text-slate-500">@{u.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        {u.permissions?.canManageInventory && <span title={t('permInventory')}><ShoppingCart size={14} className="text-blue-500" /></span>}
                        {u.permissions?.canViewReports && <span title={t('permReports')}><BarChart3 size={14} className="text-green-500" /></span>}
                        {u.permissions?.canManageSettings && <span title={t('permSettings')}><Settings size={14} className="text-orange-500" /></span>}
                        {u.permissions?.canManageUsers && <span title={t('permUsers')}><Users size={14} className="text-purple-500" /></span>}
                      </div>
                      
                      {!isAdmin && (
                        <button 
                          onClick={() => handleToggleUserStatus(u.username)}
                          title={u.isActive ? t('active') : t('inactive')}
                          className={`transition-colors ${u.isActive ? 'text-slate-400 hover:text-green-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {u.isActive ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} className="text-slate-300" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass p-6 rounded-2xl h-fit">
           <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center">
                  <Download size={20} />
               </div>
               <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t('quickReports')}</h3>
           </div>
           <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t('salesAnalysis')}</p>
           
           <div className="space-y-3">
            <button 
              onClick={handleExportReportCSV}
              className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 text-slate-600 dark:text-slate-300 rounded-xl transition-all flex items-center justify-center gap-2 font-bold"
            >
              <Download size={18} />
              {t('exportCSV')}
            </button>
            <button 
              onClick={handleExportReportPDF}
              className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary-500/20"
            >
              <FileText size={18} />
              {t('exportPDF')}
            </button>
           </div>
        </div>
      </div>
    </div>
  );
};

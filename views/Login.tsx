
import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { User } from '../types';
import { authenticateUser } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = authenticateUser(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError(t('loginError'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-10 left-10 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
         <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
      </div>

      <div className="glass p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10 mx-4">
        <div className="flex flex-col items-center mb-8">
          <Logo size={64} />
          <h1 className="text-3xl font-bold mt-4 text-slate-800 dark:text-white">Linus POS</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('loginTitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('username')}</label>
            <input
              type="text"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('password')}</label>
            <input
              type="password"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all transform active:scale-95"
          >
            {t('loginBtn')}
          </button>
        </form>
        
        <p className="text-center mt-6 text-slate-400 text-xs">
          v1.3.0 • All Rights Reserved
        </p>
      </div>
    </div>
  );
};

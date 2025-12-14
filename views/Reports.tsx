
import React, { useEffect, useState, useMemo } from 'react';
import { Sale, Currency, Product } from '../types';
import { getSales, getProducts, exportPeriodReportCSV, exportPeriodReportPDF } from '../services/storage';
import { CURRENCY_SYMBOLS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, DollarSign, AlertTriangle, Download, FileText, Calendar } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Reports: React.FC<{ currency: Currency }> = ({ currency }) => {
  const { t, language } = useLanguage();
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setAllSales(getSales());
    setProducts(getProducts());
  }, []);

  const filteredSales = useMemo(() => {
    return allSales.filter(s => {
      const date = s.date.split('T')[0];
      return date >= startDate && date <= endDate;
    });
  }, [allSales, startDate, endDate]);

  const stats = useMemo(() => {
    const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const productCounts: Record<string, number> = {};
    filteredSales.forEach(s => {
      s.items.forEach(i => {
        productCounts[i.name] = (productCounts[i.name] || 0) + i.quantity;
      });
    });
    const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    const lowStock = products.filter(p => p.stock < 5).length;

    return {
      revenue,
      count: filteredSales.length,
      lowStock,
      topProduct
    };
  }, [filteredSales, products]);

  const handleExportCSV = () => {
    exportPeriodReportCSV(filteredSales, startDate, endDate);
  };

  const handleExportPDF = () => {
    exportPeriodReportPDF(filteredSales, startDate, endDate, language);
  };

  const salesByDay = filteredSales.reduce((acc, sale) => {
    const date = new Date(sale.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
    acc[date] = (acc[date] || 0) + sale.total;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(salesByDay).map(([date, total]) => ({
    name: date,
    total
  }));

  const pieData = [
    { name: 'Beverages', value: 400 },
    { name: 'Food', value: 300 },
    { name: 'Desserts', value: 300 },
    { name: 'Others', value: 200 },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('reportDashboard')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('salesAnalysis')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 p-2 rounded-xl border border-slate-200 dark:border-slate-600">
            <Calendar size={16} className="text-slate-400 ms-1" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent outline-none text-slate-600 dark:text-slate-200 text-sm w-28"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent outline-none text-slate-600 dark:text-slate-200 text-sm w-28"
            />
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
          >
            <Download size={18} />
            {t('exportCSV')}
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 text-sm font-bold"
          >
            <FileText size={18} />
            {t('exportPDF')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('totalRevenue')}
          value={`${stats.revenue.toFixed(2)} ${CURRENCY_SYMBOLS[currency]}`}
          icon={<DollarSign className="text-green-600" />}
          bg="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          title={t('salesCount')}
          value={stats.count.toString()}
          icon={<TrendingUp className="text-blue-600" />}
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          title={t('topSelling')}
          value={stats.topProduct}
          icon={<Package className="text-purple-600" />}
          bg="bg-purple-50 dark:bg-purple-900/20"
        />
        <StatCard
          title={t('stockAlerts')}
          value={stats.lowStock.toString()}
          icon={<AlertTriangle className="text-red-600" />}
          bg="bg-red-50 dark:bg-red-900/20"
          isAlert={stats.lowStock > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-6 text-slate-700 dark:text-slate-200">{t('salesPeriod')}</h3>
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.9)' }}
                    cursor={{ fill: 'rgba(241, 245, 249, 0.1)' }}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Calendar size={48} className="mb-2 opacity-50" />
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-6 text-slate-700 dark:text-slate-200">{t('distribution')}</h3>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 flex-wrap mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t('recentTransactions')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-700/50 uppercase text-xs font-bold text-slate-500 dark:text-slate-300">
              <tr>
                <th className="px-6 py-4">{t('date')}</th>
                <th className="px-6 py-4">{t('customer')}</th>
                <th className="px-6 py-4">{t('type')}</th>
                <th className="px-6 py-4">{t('items')}</th>
                <th className="px-6 py-4">{t('total')}</th>
                <th className="px-6 py-4">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium dark:text-slate-200">
                    {new Date(sale.date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </td>
                  <td className="px-6 py-4 dark:text-slate-300">
                    {sale.customerName || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${sale.paymentMethod === 'Credit' ? 'bg-orange-100 text-orange-600' :
                      sale.paymentMethod === 'Electronic' ? 'bg-blue-100 text-blue-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                      {t(sale.paymentMethod?.toLowerCase() || 'cash')}
                    </span>
                  </td>
                  <td className="px-6 py-4 dark:text-slate-300">
                    {sale.items.length}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                    {sale.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${sale.status === 'Pending' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                      {t(sale.status?.toLowerCase() || 'completed')}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div >
    </div >
  );
};

const StatCard = ({ title, value, icon, bg, isAlert = false }: any) => (
  <div className={`p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 ${isAlert ? 'ring-2 ring-red-100 dark:ring-red-900' : ''}`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">{title}</p>
      <h4 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{value}</h4>
    </div>
  </div>
);

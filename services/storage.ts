
import { Product, Sale, Currency, User, SystemSettings, CartItem, UserPermissions, HeldInvoice, Language } from '../types';
import { INITIAL_PRODUCTS, TAX_RATE } from '../constants';

const STORAGE_KEYS = {
  PRODUCTS: 'linus_products',
  SALES: 'linus_sales',
  SETTINGS: 'linus_settings',
  USERS: 'linus_users',
  HELD_INVOICES: 'linus_held_invoices'
};

const DEFAULT_SETTINGS: SystemSettings = {
  currency: Currency.SAR,
  lowStockThreshold: 5,
  storeName: 'Linus POS',
  taxRate: TAX_RATE
};

const DEFAULT_PERMISSIONS: Record<string, UserPermissions> = {
  admin: { canManageInventory: true, canViewReports: true, canManageSettings: true, canManageUsers: true },
  staff: { canManageInventory: false, canViewReports: false, canManageSettings: false, canManageUsers: false }
};

// --- Settings ---
export const getSettings = (): SystemSettings => {
  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: SystemSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

// --- Products ---
export const getProducts = (): Product[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(stored);
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
};

export const clearProducts = () => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
};

// --- Sales ---
export const getSales = (): Sale[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.SALES);
  return stored ? JSON.parse(stored) : [];
};

export const saveSale = (saleData: Omit<Sale, 'cashier'>, cashierName: string) => {
  const sales = getSales();
  const sale: Sale = { ...saleData, cashier: cashierName };
  sales.push(sale);
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  
  // Update stock
  const products = getProducts();
  sale.items.forEach(item => {
    const productIndex = products.findIndex(p => p.id === item.id);
    if (productIndex > -1) {
      products[productIndex].stock = Math.max(0, products[productIndex].stock - item.quantity);
    }
  });
  saveProducts(products);
};

// --- Held Invoices ---
export const getHeldInvoices = (): HeldInvoice[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.HELD_INVOICES);
  return stored ? JSON.parse(stored) : [];
};

export const saveHeldInvoice = (items: CartItem[]) => {
  const invoices = getHeldInvoices();
  const invoice: HeldInvoice = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    items
  };
  invoices.push(invoice);
  localStorage.setItem(STORAGE_KEYS.HELD_INVOICES, JSON.stringify(invoices));
};

export const deleteHeldInvoice = (id: string) => {
  const invoices = getHeldInvoices();
  const updated = invoices.filter(inv => inv.id !== id);
  localStorage.setItem(STORAGE_KEYS.HELD_INVOICES, JSON.stringify(updated));
};

// --- Auth & Users ---
export const getUsers = (): User[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!stored) {
    // Default admin user if none exists
    const defaultAdmin: User = { 
      username: 'admin', 
      password: '123', 
      role: 'admin', 
      name: 'Admin',
      permissions: DEFAULT_PERMISSIONS.admin,
      isActive: true
    };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([defaultAdmin]));
    return [defaultAdmin];
  }
  
  // Migration for existing users without permissions or isActive
  const users = JSON.parse(stored);
  return users.map((u: any) => ({
    ...u,
    permissions: u.permissions || (u.role === 'admin' ? DEFAULT_PERMISSIONS.admin : DEFAULT_PERMISSIONS.staff),
    isActive: u.isActive !== undefined ? u.isActive : true
  }));
};

export const addUser = (user: User) => {
  const users = getUsers();
  if (users.find(u => u.username === user.username)) {
    throw new Error('Username already exists');
  }
  users.push({ ...user, isActive: true });
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const toggleUserStatus = (username: string) => {
  const users = getUsers();
  const updatedUsers = users.map(u => {
    if (u.username === username) {
      if (u.username === 'admin') return u;
      return { ...u, isActive: !u.isActive };
    }
    return u;
  });
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
};

export const authenticateUser = (username: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user && user.isActive === false) {
    throw new Error('Account Disabled');
  }

  return user || null;
};

// --- Printing ---
export const printReceipt = (sale: Sale | { items: CartItem[], subtotal: number, tax: number, total: number, currency: string }) => {
  const settings = getSettings();
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return;

  const date = 'date' in sale ? new Date(sale.date).toLocaleString() : new Date().toLocaleString();
  const id = 'id' in sale ? sale.id.slice(-6) : 'DRAFT';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${settings.storeName}</title>
      <style>
        body { font-family: 'Courier New', Courier, monospace; padding: 20px; width: 300px; margin: 0 auto; color: #000; }
        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
        .store-name { font-size: 1.2rem; font-weight: bold; margin: 0; }
        .meta { font-size: 0.8rem; margin-bottom: 10px; }
        table { width: 100%; font-size: 0.8rem; border-collapse: collapse; }
        th { text-align: left; border-bottom: 1px solid #000; }
        td { padding: 4px 0; }
        .totals { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
        .row { display: flex; justify-content: space-between; font-size: 0.9rem; }
        .total-row { font-weight: bold; font-size: 1.1rem; margin-top: 5px; }
        .footer { text-align: center; margin-top: 20px; font-size: 0.8rem; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="store-name">${settings.storeName}</h1>
        <p>Sales Receipt</p>
      </div>
      <div class="meta">
        <div>Invoice: #${id}</div>
        <div>Date: ${date}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="totals">
        <div class="row"><span>Subtotal:</span><span>${sale.subtotal.toFixed(2)}</span></div>
        <div class="row"><span>Tax:</span><span>${sale.tax.toFixed(2)}</span></div>
        <div class="row total-row"><span>Total:</span><span>${sale.total.toFixed(2)} ${sale.currency}</span></div>
      </div>
      <div class="footer">
        <p>Thank you for shopping with us</p>
      </div>
      <script>
        window.onload = () => { window.print(); window.close(); };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// --- Exports ---
export const exportInventoryCSV = () => {
  const products = getProducts();
  const headers = ['Product', 'Category', 'Price', 'Stock', 'Barcode'];
  
  const rows = products.map(p => [
    p.name,
    p.category,
    p.price,
    p.stock,
    `'${p.barcode}`
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportInventoryPDF = (lang: Language = 'ar') => {
  const products = getProducts();
  const settings = getSettings();
  const todayDate = new Date();
  const isRTL = lang === 'ar';
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const logoSvg = `
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 4v16h16" />
    </svg>
  `;

  const labels = isRTL ? {
    title: 'تقرير جرد المخزون الشامل',
    date: 'تاريخ الإصدار',
    product: 'المنتج',
    cat: 'الفئة',
    barcode: 'الباركود',
    price: 'السعر',
    stock: 'المخزون',
    total: 'القيمة الإجمالية',
    rights: 'جميع الحقوق محفوظة'
  } : {
    title: 'Inventory Report',
    date: 'Issue Date',
    product: 'Product',
    cat: 'Category',
    barcode: 'Barcode',
    price: 'Price',
    stock: 'Stock',
    total: 'Total Value',
    rights: 'All Rights Reserved'
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${lang}" dir="${isRTL ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <title>Inventory - ${settings.storeName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Cairo', sans-serif; padding: 40px; margin: 0 auto; max-width: 210mm; color: #334155; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
        .brand-logo { margin-bottom: 10px; color: #0f766e; }
        .brand-name { font-size: 24px; font-weight: bold; color: #0f766e; margin: 5px 0; }
        .report-title { font-size: 18px; color: #64748b; margin: 0; }
        .meta { font-size: 12px; color: #94a3b8; margin-top: 10px; }
        
        table { width: 100%; border-collapse: collapse; font-size: 12px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        thead { background: #0f766e; color: white; }
        th { padding: 12px 15px; text-align: ${isRTL ? 'right' : 'left'}; font-weight: 600; }
        td { padding: 10px 15px; border-bottom: 1px solid #f1f5f9; text-align: ${isRTL ? 'right' : 'left'}; }
        tr:nth-child(even) { background: #f8fafc; }
        tr:last-child td { border-bottom: none; }
        
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #cbd5e1; border-top: 1px solid #f1f5f9; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand-logo" style="display: flex; justify-content: center;">${logoSvg}</div>
        <h1 class="brand-name">${settings.storeName}</h1>
        <h2 class="report-title">${labels.title}</h2>
        <div class="meta">${labels.date}: ${todayDate.toLocaleString(lang)}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>${labels.product}</th>
            <th>${labels.cat}</th>
            <th>${labels.barcode}</th>
            <th>${labels.price}</th>
            <th>${labels.stock}</th>
            <th>${labels.total}</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(p => `
            <tr>
              <td>${p.name}</td>
              <td>${p.category}</td>
              <td style="font-family: monospace; color: #64748b">${p.barcode}</td>
              <td style="font-weight: bold">${p.price}</td>
              <td><span style="padding: 2px 6px; border-radius: 4px; background: ${p.stock < 5 ? '#fee2e2' : '#dcfce7'}; color: ${p.stock < 5 ? '#b91c1c' : '#15803d'}">${p.stock}</span></td>
              <td>${(p.price * p.stock).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        Linus POS - ${labels.rights} &copy; ${todayDate.getFullYear()}
      </div>
      <script>window.onload = () => { setTimeout(() => window.print(), 500); };</script>
    </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const exportPeriodReportCSV = (sales: Sale[], startDate?: string, endDate?: string) => {
  const headers = ['ID', 'Date', 'Cashier', 'Total', 'Currency'];
  const fileName = `sales_report.csv`;

  const rows = sales.map(s => [
    s.id,
    new Date(s.date).toLocaleString(),
    s.cashier || '-',
    s.total.toFixed(2),
    s.currency
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportDailyReportCSV = (sales: Sale[]) => {
  const today = new Date().toISOString().split('T')[0];
  const todaysSales = sales.filter(s => s.date.startsWith(today));
  exportPeriodReportCSV(todaysSales, today, today);
};

export const exportPeriodReportPDF = (sales: Sale[], startDate: string, endDate: string, lang: Language = 'ar') => {
  const todayDate = new Date();
  const isRTL = lang === 'ar';
  
  if (sales.length === 0) {
    alert('No sales found for period');
    return;
  }

  const settings = getSettings();
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const transactionCount = sales.length;
  const averageTicket = totalRevenue / transactionCount;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const logoSvg = `
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 4v16h16" />
    </svg>
  `;

  const labels = isRTL ? {
    title: 'تقرير المبيعات الدوري',
    period: 'من',
    to: 'إلى',
    issueDate: 'تاريخ الإصدار',
    totalRev: 'إجمالي الإيرادات',
    count: 'عدد العمليات',
    avg: 'متوسط السلة',
    id: 'رقم الفاتورة',
    time: 'التاريخ والوقت',
    cashier: 'الموظف',
    items: 'العدد',
    status: 'الحالة',
    total: 'الإجمالي',
    completed: 'مكتمل'
  } : {
    title: 'Periodic Sales Report',
    period: 'From',
    to: 'To',
    issueDate: 'Issue Date',
    totalRev: 'Total Revenue',
    count: 'Sales Count',
    avg: 'Avg Ticket',
    id: 'Invoice #',
    time: 'Date & Time',
    cashier: 'Cashier',
    items: 'Items',
    status: 'Status',
    total: 'Total',
    completed: 'Completed'
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${lang}" dir="${isRTL ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <title>Sales - ${settings.storeName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --primary: #0f766e;
          --primary-light: #f0fdfa;
          --text: #1e293b;
          --border: #e2e8f0;
        }
        body { 
          font-family: 'Cairo', sans-serif; 
          padding: 0; 
          margin: 0;
          color: var(--text);
          background: white;
        }
        .page {
          padding: 50px;
          max-width: 210mm;
          margin: 0 auto;
        }
        .header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 3px double var(--primary);
        }
        .logo-container {
          margin-bottom: 15px;
          color: var(--primary);
        }
        h1 { margin: 0; font-size: 28px; color: var(--primary); letter-spacing: -0.5px; }
        h2 { margin: 5px 0 0 0; font-size: 16px; color: #64748b; font-weight: normal; }
        .period-label { font-size: 14px; background: #f1f5f9; padding: 4px 12px; border-radius: 20px; margin-top: 10px; color: #334155; font-weight: 600; }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .summary-box {
          background: white;
          border: 1px solid var(--border);
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .summary-label {
          font-size: 12px;
          color: #64748b;
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: var(--primary);
        }
        
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        thead th { 
          background-color: var(--primary); 
          color: white;
          padding: 12px;
          text-align: ${isRTL ? 'right' : 'left'};
          font-weight: 600;
        }
        thead th:first-child { border-top-right-radius: 8px; }
        thead th:last-child { border-top-left-radius: 8px; }
        
        td { 
          padding: 10px 12px; 
          border-bottom: 1px solid var(--border); 
          text-align: ${isRTL ? 'right' : 'left'};
        }
        tr:nth-child(even) { background-color: var(--primary-light); }
        
        .footer {
          margin-top: 60px;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid var(--border);
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="logo-container">${logoSvg}</div>
          <h1>${settings.storeName}</h1>
          <h2>${labels.title}</h2>
          <div class="period-label">${labels.period} ${startDate} ${labels.to} ${endDate}</div>
          <div style="margin-top: 10px; font-size: 12px; color: #94a3b8;">
            ${labels.issueDate}: ${todayDate.toLocaleString(lang)}
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-box">
            <span class="summary-label">${labels.totalRev}</span>
            <span class="summary-value">${totalRevenue.toFixed(2)} ${settings.currency}</span>
          </div>
          <div class="summary-box">
            <span class="summary-label">${labels.count}</span>
            <span class="summary-value">${transactionCount}</span>
          </div>
          <div class="summary-box">
            <span class="summary-label">${labels.avg}</span>
            <span class="summary-value">${averageTicket.toFixed(2)} ${settings.currency}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="15%">${labels.id}</th>
              <th width="20%">${labels.time}</th>
              <th width="20%">${labels.cashier}</th>
              <th width="10%">${labels.items}</th>
              <th width="15%">${labels.status}</th>
              <th width="20%">${labels.total}</th>
            </tr>
          </thead>
          <tbody>
            ${sales.map(s => `
              <tr>
                <td style="font-family: monospace; font-weight: bold;">#${s.id.slice(-6)}</td>
                <td>${new Date(s.date).toLocaleString(lang)}</td>
                <td>${s.cashier || '-'}</td>
                <td>${s.items.reduce((acc, i) => acc + i.quantity, 0)}</td>
                <td><span style="color:#15803d; font-weight:bold;">${labels.completed}</span></td>
                <td style="font-weight:bold; color:#0f766e;">${s.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>${settings.storeName} - Linus POS</p>
        </div>
      </div>

      <script>
        window.onload = () => { setTimeout(() => window.print(), 500); };
      </script>
    </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const exportDailyReportPDF = (sales: Sale[], lang: Language = 'ar') => {
  const today = new Date().toISOString().split('T')[0];
  const todaysSales = sales.filter(s => s.date.startsWith(today));
  exportPeriodReportPDF(todaysSales, today, today, lang);
};

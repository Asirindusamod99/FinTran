
/**
 * FinTran — Personal Budget Management App
 * Core Data Engine (app.js)
 */
const FinTran = {

  // ─── CATEGORIES ────────────────────────────────────────────────
  defaultCategories() {
    return [
      { id: 'salary',      name: 'Salary',          type: 'income',  icon: 'fa-briefcase',       color: '#16a34a' },
      { id: 'freelance',   name: 'Freelance',        type: 'income',  icon: 'fa-laptop-code',     color: '#0d9488' },
      { id: 'investment',  name: 'Investment',       type: 'income',  icon: 'fa-chart-line',      color: '#0891b2' },
      { id: 'business',    name: 'Business',         type: 'income',  icon: 'fa-store',           color: '#7c3aed' },
      { id: 'gift_in',     name: 'Gift Received',    type: 'income',  icon: 'fa-gift',            color: '#d97706' },
      { id: 'other_in',    name: 'Other Income',     type: 'income',  icon: 'fa-circle-plus',     color: '#4f46e5' },
      { id: 'food',        name: 'Food & Dining',    type: 'expense', icon: 'fa-utensils',        color: '#dc2626' },
      { id: 'transport',   name: 'Transport',        type: 'expense', icon: 'fa-car',             color: '#ea580c' },
      { id: 'shopping',    name: 'Shopping',         type: 'expense', icon: 'fa-bag-shopping',    color: '#db2777' },
      { id: 'bills',       name: 'Bills & Utilities',type: 'expense', icon: 'fa-bolt',            color: '#b45309' },
      { id: 'health',      name: 'Health & Medical', type: 'expense', icon: 'fa-heart-pulse',     color: '#0f766e' },
      { id: 'entertain',   name: 'Entertainment',    type: 'expense', icon: 'fa-film',            color: '#7c3aed' },
      { id: 'education',   name: 'Education',        type: 'expense', icon: 'fa-graduation-cap',  color: '#1d4ed8' },
      { id: 'rent',        name: 'Rent & Housing',   type: 'expense', icon: 'fa-house',           color: '#475569' },
      { id: 'savings',     name: 'Savings',          type: 'expense', icon: 'fa-piggy-bank',      color: '#0369a1' },
      { id: 'other_ex',    name: 'Other Expense',    type: 'expense', icon: 'fa-ellipsis',        color: '#64748b' },
    ];
  },

  getCategories() {
    const stored = localStorage.getItem('ft_categories');
    if (stored) return JSON.parse(stored);
    const cats = this.defaultCategories();
    localStorage.setItem('ft_categories', JSON.stringify(cats));
    return cats;
  },

  // ─── API HELPER ──────────────
  apiUrl: '/api',

  async apiCall(endpoint, method = 'GET', body = null) {
    const user = this.getUser();
    const headers = { 'Content-Type': 'application/json' };
    if (user && user.token) headers['Authorization'] = 'Bearer ' + user.token;
    try {
      const res = await fetch(this.apiUrl + endpoint, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    } catch (e) {
      console.warn("API Error:", endpoint, e.message);
      throw e;
    }
  },

  async syncDataFromServer() {
    const u = this.getUser();
    if (!u || !u.token) return;
    try {
      const [txns, budgets, savings] = await Promise.all([
        this.apiCall('/transactions'),
        this.apiCall('/budgets'),
        this.apiCall('/savings_goals')
      ]);
      localStorage.setItem('ft_transactions_' + u.id, JSON.stringify(txns));
      localStorage.setItem('ft_budgets_' + u.id, JSON.stringify(budgets));
      localStorage.setItem('ft_savings_goals_' + u.id, JSON.stringify(savings));
    } catch (e) {
      console.error('Failed to sync from server', e);
    }
  },

  getCategoryById(id) {
    return this.getCategories().find(c => c.id === id) || { name: id, icon: 'fa-circle', color: '#94a3b8' };
  },

  // ─── TRANSACTIONS ───────────────────────────────────────────────
  getTransactions() {
    const u = this.getUser();
    if (!u) return [];
    return JSON.parse(localStorage.getItem('ft_transactions_' + u.id) || '[]');
  },

  setTransactions(txns) {
    const u = this.getUser();
    if (u) localStorage.setItem('ft_transactions_' + u.id, JSON.stringify(txns));
  },

  addTransaction(txn) {
    const txns = this.getTransactions();
    txn.id = 'txn_' + Date.now();
    txn.createdAt = new Date().toISOString();
    txns.unshift(txn);
    this.setTransactions(txns);
    // Background API Sync
    this.apiCall('/transactions', 'POST', txn).catch(() => {});
    return txn;
  },

  updateTransaction(id, updates) {
    const txns = this.getTransactions();
    const idx = txns.findIndex(t => t.id === id);
    if (idx !== -1) {
      txns[idx] = { ...txns[idx], ...updates };
      this.setTransactions(txns);
      this.apiCall('/transactions/' + id, 'PUT', updates).catch(() => {});
    }
  },

  deleteTransaction(id) {
    const txns = this.getTransactions().filter(t => t.id !== id);
    this.setTransactions(txns);
    this.apiCall('/transactions/' + id, 'DELETE').catch(() => {});
  },

  // ─── BUDGETS ────────────────────────────────────────────────────
  getBudgets() {
    const u = this.getUser();
    if (!u) return [];
    return JSON.parse(localStorage.getItem('ft_budgets_' + u.id) || '[]');
  },

  setBudgets(budgets) {
    const u = this.getUser();
    if (u) localStorage.setItem('ft_budgets_' + u.id, JSON.stringify(budgets));
  },

  saveBudget(budget) {
    const budgets = this.getBudgets();
    const idx = budgets.findIndex(b => b.categoryId === budget.categoryId);
    if (idx >= 0) budgets[idx] = { ...budgets[idx], ...budget };
    else budgets.push(budget);
    this.setBudgets(budgets);
    this.apiCall('/budgets', 'POST', budget).catch(() => {});
  },

  deleteBudget(categoryId) {
    const budgets = this.getBudgets().filter(b => b.categoryId !== categoryId);
    this.setBudgets(budgets);
    this.apiCall('/budgets/' + categoryId, 'DELETE').catch(() => {});
  },

  // ─── SAVINGS GOALS ─────────────────────────────────────────────
  getSavingsGoals() {
    const u = this.getUser();
    if (!u) return [];
    return JSON.parse(localStorage.getItem('ft_savings_goals_' + u.id) || '[]');
  },

  setSavingsGoals(goals) {
    const u = this.getUser();
    if (u) localStorage.setItem('ft_savings_goals_' + u.id, JSON.stringify(goals));
  },

  addSavingsGoal(goal) {
    const goals = this.getSavingsGoals();
    goal.id = 'sg_' + Date.now();
    goal.createdAt = new Date().toISOString();
    goal.deposits = goal.deposits || [];
    goals.push(goal);
    this.setSavingsGoals(goals);
    this.apiCall('/savings_goals', 'POST', goal).catch(() => {});
    return goal;
  },

  updateSavingsGoal(id, updates) {
    const goals = this.getSavingsGoals();
    const idx = goals.findIndex(g => g.id === id);
    if (idx !== -1) {
      goals[idx] = { ...goals[idx], ...updates };
      this.setSavingsGoals(goals);
      this.apiCall('/savings_goals/' + id, 'PUT', updates).catch(() => {});
    }
  },

  deleteSavingsGoal(id) {
    const goals = this.getSavingsGoals().filter(g => g.id !== id);
    this.setSavingsGoals(goals);
    this.apiCall('/savings_goals/' + id, 'DELETE').catch(() => {});
  },

  addSavingsDeposit(goalId, amount, note) {
    const goals = this.getSavingsGoals();
    const idx = goals.findIndex(g => g.id === goalId);
    if (idx !== -1) {
      if (!goals[idx].deposits) goals[idx].deposits = [];
      const deposit = {
        id: 'dep_' + Date.now(),
        amount: Number(amount),
        note: note || '',
        date: new Date().toISOString(),
      };
      goals[idx].deposits.push(deposit);
      goals[idx].saved = (goals[idx].saved || 0) + Number(amount);
      this.setSavingsGoals(goals);
      this.apiCall(`/savings_goals/${goalId}/deposit`, 'POST', deposit).catch(() => {});
    }
  },

  // ─── STATS ──────────────────────────────────────────────────────
  getMonthStats(year, month) {
    const txns = this.getTransactions().filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const income   = txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    return { income, expenses, balance: income - expenses, transactions: txns };
  },

  getLast6MonthsData() {
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const stat = this.getMonthStats(d.getFullYear(), d.getMonth());
      result.push({
        label: d.toLocaleDateString('en', { month: 'short' }),
        income: stat.income,
        expenses: stat.expenses,
        balance: stat.balance,
      });
    }
    return result;
  },

  getCategoryBreakdown(type, year, month) {
    const txns = (year !== undefined)
      ? this.getTransactions().filter(t => {
          const d = new Date(t.date);
          return t.type === type && d.getFullYear() === year && d.getMonth() === month;
        })
      : this.getTransactions().filter(t => t.type === type);

    const map = {};
    txns.forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + Number(t.amount);
    });
    return Object.entries(map).map(([catId, total]) => ({
      category: this.getCategoryById(catId),
      total,
    })).sort((a, b) => b.total - a.total);
  },

  getBudgetProgress(year, month) {
    const budgets = this.getBudgets();
    const txns = this.getTransactions().filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getFullYear() === year && d.getMonth() === month;
    });
    return budgets.map(b => {
      const spent = txns.filter(t => t.categoryId === b.categoryId).reduce((s, t) => s + Number(t.amount), 0);
      const pct   = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
      const cat   = this.getCategoryById(b.categoryId);
      return { ...b, spent, pct, category: cat, overBudget: spent > b.amount };
    });
  },

  // ─── FORMATTING ─────────────────────────────────────────────────
  formatCurrency(amount) {
    if (amount >= 1000000) return 'Rs. ' + (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return 'Rs. ' + (amount / 1000).toFixed(1) + 'K';
    return 'Rs. ' + Math.abs(Number(amount)).toLocaleString('en-LK');
  },

  formatCurrencyFull(amount) {
    return 'Rs. ' + Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  getMonthName(month, year) {
    return new Date(year, month, 1).toLocaleDateString('en', { month: 'long', year: 'numeric' });
  },

  // ─── CAT ICON STYLE HELPER ───────────────────────────────────────
  // Returns inline style string for a category icon box:
  // solid color background, white icon text — always readable
  catIconStyle(color, size) {
    const s = size || '36px';
    return `width:${s};height:${s};border-radius:8px;display:flex;align-items:center;justify-content:center;background:${color};color:#fff;font-size:15px;flex-shrink:0;`;
  },

  // ─── AUTH ────────────────────────────────────────────────────────
  async hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  getUser() {
    return JSON.parse(localStorage.getItem('ft_user') || 'null');
  },

  requireAuth() {
    const user = this.getUser();
    if (!user) { window.location.href = 'login.html'; return null; }
    return user;
  },

  logout() {
    localStorage.removeItem('ft_user');
    window.location.href = 'login.html';
  },

  // ─── SEED DEMO USERS (auto on first load) ───────────────────────
  seedDemoUsers() {
    if (JSON.parse(localStorage.getItem('ft_users') || '[]').length > 0) return;
    const demo = [
      { id:'usr_d1', name:'Amara Perera',     email:'amara@demo.lk',    password:'0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d', avatar:'A', currency:'LKR', createdAt: new Date().toISOString() },
      { id:'usr_d2', name:'Kamal Silva',      email:'kamal@demo.lk',    password:'0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d', avatar:'K', currency:'LKR', createdAt: new Date().toISOString() },
      { id:'usr_d3', name:'Nisha Fernando',   email:'nisha@demo.lk',    password:'0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d', avatar:'N', currency:'LKR', createdAt: new Date().toISOString() },
      { id:'usr_d4', name:'Dinesh Bandara',   email:'dinesh@demo.lk',   password:'0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d', avatar:'D', currency:'LKR', createdAt: new Date().toISOString() },
      { id:'usr_d5', name:'Sithumi Rajapaksa',email:'sithumi@demo.lk',  password:'0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d', avatar:'S', currency:'LKR', createdAt: new Date().toISOString() },
    ];
    localStorage.setItem('ft_users', JSON.stringify(demo));
  },

  // ─── SEED DATA ──────────────────────────────────────────────────
  seedSampleData() {
    if (this.getTransactions().length > 0) return;
    const now  = new Date();
    const txns = [];
    let   n    = 1;
    const mk = (type, amt, catId, desc, daysAgo) => {
      const d = new Date(now); d.setDate(d.getDate() - daysAgo);
      return { id: 'seed_' + (n++), type, amount: amt, categoryId: catId,
               description: desc, date: d.toISOString().split('T')[0], createdAt: d.toISOString() };
    };
    // ══ THIS MONTH — 20 days ══
    txns.push(mk('income',  85000, 'salary',    'Monthly Salary',               0));
    txns.push(mk('income',  22000, 'freelance', 'Web Design – Client A',        2));
    txns.push(mk('income',   8500, 'freelance', 'Social Media Branding',        9));
    txns.push(mk('income',  15000, 'business',  'Online Store Revenue',        14));
    txns.push(mk('income',   4000, 'gift_in',   'Birthday Gift – Amali',       18));
    txns.push(mk('expense', 28000, 'rent',      'Apartment Rent',               1));
    txns.push(mk('expense',  3800, 'food',      'Keells Supermarket',           1));
    txns.push(mk('expense',  1200, 'food',      'Lunch – Office Canteen',       2));
    txns.push(mk('expense',  2600, 'transport', 'Uber Rides (weekly)',          3));
    txns.push(mk('expense',   850, 'food',      'Kopi & Short Eats',            4));
    txns.push(mk('expense',  4200, 'bills',     'Electricity + Water Bill',     5));
    txns.push(mk('expense',  1800, 'entertain', 'Netflix + Spotify',            5));
    txns.push(mk('expense',  6500, 'health',    'Doctor Visit + Pharmacy',      6));
    txns.push(mk('expense',  1500, 'food',      'Dinner – Green Cabin',         7));
    txns.push(mk('expense',  2200, 'transport', 'Fuel – Octane 95',             8));
    txns.push(mk('expense',  5800, 'shopping',  'Clothing – Odel Fashion',      9));
    txns.push(mk('expense',   750, 'food',      'Tea & Snacks',                10));
    txns.push(mk('expense',  3200, 'bills',     'SLT Broadband',               10));
    txns.push(mk('expense',  1300, 'food',      'Kottu – Pilawoos',            11));
    txns.push(mk('expense',  9500, 'education', 'Udemy Annual Plan',           12));
    txns.push(mk('expense',  2800, 'shopping',  'Books & Stationery',          13));
    txns.push(mk('expense',  1600, 'transport', 'Bus Pass – Monthly',          14));
    txns.push(mk('expense',  4400, 'entertain', 'Cinema + Dinner – Date Night',15));
    txns.push(mk('expense',  2100, 'food',      'Grocery – Laugfs Fresh',      16));
    txns.push(mk('expense',  1150, 'food',      'Smoothie Bar',                17));
    txns.push(mk('expense',  3700, 'health',    'Gym Membership',              18));
    txns.push(mk('expense',  5200, 'savings',   'Fixed Deposit Transfer',      19));
    txns.push(mk('expense',  1800, 'other_ex',  'Miscellaneous',               20));
    // ══ LAST MONTH ══
    txns.push(mk('income',  85000, 'salary',    'Monthly Salary – February',   32));
    txns.push(mk('income',  18000, 'freelance', 'App UI Design',               35));
    txns.push(mk('income',   6000, 'investment','Dividend – CSE Shares',       40));
    txns.push(mk('expense', 28000, 'rent',      'Apartment Rent – February',   33));
    txns.push(mk('expense',  9800, 'food',      'Monthly Groceries',           34));
    txns.push(mk('expense',  6800, 'shopping',  'Clothing – Odel',             38));
    txns.push(mk('expense',  3800, 'transport', 'Fuel & Uber',                 36));
    txns.push(mk('expense',  2800, 'bills',     'Utilities',                   37));
    txns.push(mk('expense',  3200, 'entertain', 'Streaming + Events',          42));
    txns.push(mk('expense',  4500, 'health',    'Dental Checkup',              45));
    txns.push(mk('expense',  7200, 'education', 'Photography Course',          48));
    // ══ 2 MONTHS AGO ══
    txns.push(mk('income',  85000, 'salary',    'Monthly Salary – January',    62));
    txns.push(mk('income',  12000, 'investment','Stock Dividends',              65));
    txns.push(mk('income',  25000, 'business',  'Freelance Business Income',   70));
    txns.push(mk('expense', 28000, 'rent',      'Apartment Rent – January',    63));
    txns.push(mk('expense', 11200, 'food',      'Groceries + Dining',          64));
    txns.push(mk('expense',  4000, 'transport', 'Fuel',                        66));
    txns.push(mk('expense',  8500, 'education', 'AWS Certification Course',    68));
    txns.push(mk('expense',  3000, 'bills',     'Utilities',                   67));
    txns.push(mk('expense',  5500, 'health',    'Annual Checkup',              72));
    txns.push(mk('expense',  6200, 'shopping',  'Electronics – Abans',         75));
    // ══ 3 MONTHS AGO ══
    txns.push(mk('income',  85000, 'salary',    'Monthly Salary – December',   92));
    txns.push(mk('income',  30000, 'freelance', 'Year-End Freelance Bonus',    95));
    txns.push(mk('expense', 28000, 'rent',      'Apartment Rent – December',   93));
    txns.push(mk('expense', 15000, 'shopping',  'Christmas Shopping',          97));
    txns.push(mk('expense',  8000, 'entertain', 'New Year Party',              98));
    txns.push(mk('expense',  4500, 'food',      'Family Dinner – Xmas',       100));
    txns.push(mk('expense',  3800, 'transport', 'Travel – Kandy Trip',        102));
    this.setTransactions(txns);
    // Also add to global fallback for admin
    const all = JSON.parse(localStorage.getItem('ft_transactions') || '[]');
    txns.forEach(t => all.push({ type: t.type, amount: t.amount, categoryId: t.categoryId }));
    localStorage.setItem('ft_transactions', JSON.stringify(all));

    // Seed budgets
    const now2 = new Date();
    const budgets = [
      { categoryId: 'food',      amount: 18000, month: now2.getMonth(), year: now2.getFullYear() },
      { categoryId: 'transport', amount:  8000, month: now2.getMonth(), year: now2.getFullYear() },
      { categoryId: 'entertain', amount:  5000, month: now2.getMonth(), year: now2.getFullYear() },
      { categoryId: 'shopping',  amount: 10000, month: now2.getMonth(), year: now2.getFullYear() },
      { categoryId: 'bills',     amount:  8000, month: now2.getMonth(), year: now2.getFullYear() },
      { categoryId: 'health',    amount:  8000, month: now2.getMonth(), year: now2.getFullYear() },
      { categoryId: 'education', amount: 12000, month: now2.getMonth(), year: now2.getFullYear() },
      { categoryId: 'savings',   amount: 10000, month: now2.getMonth(), year: now2.getFullYear() },
    ];
    this.setBudgets(budgets);
  },


  // ─── THEME ──────────────────────────────────────────────────────
  initTheme() {
    const theme = localStorage.getItem('ft_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  },

  toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ft_theme', next);
  },

  // ─── TOAST ──────────────────────────────────────────────────────
  toast(msg, type = 'success') {
    const existing = document.getElementById('ft-toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.id = 'ft-toast';
    t.className = 'ft-toast ft-toast-' + type;
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
    t.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
  },
};

// Auto-init on every page load
document.addEventListener('DOMContentLoaded', () => {
  FinTran.initTheme();
  // Update theme toggle icon if present
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    const updateIcon = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      toggleBtn.innerHTML = theme === 'dark'
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
    };
    updateIcon();
    toggleBtn.addEventListener('click', () => { FinTran.toggleTheme(); updateIcon(); });
  }
  // Set user name and global avatar if present
  const userNameEl = document.getElementById('userName');
  const user = FinTran.getUser();
  if (userNameEl && user) {
    userNameEl.textContent = user.name || 'User';
  }
  if (user) {
    const avatarEls = [document.getElementById('userAvatar'), document.getElementById('sidebarAvatar')];
    avatarEls.forEach(el => {
      if (el) {
        if (user.profilePic) {
          el.innerHTML = `<img src="${user.profilePic}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
          el.style.background = 'transparent';
        } else {
          el.innerHTML = user.avatar || user.name?.charAt(0) || 'U';
          const profile = JSON.parse(localStorage.getItem('ft_profile') || '{}');
          el.style.background = profile.avatarBg || 'linear-gradient(135deg,#6366f1,#8b5cf6)';
        }
      }
    });
  }
  // Sidebar toggle
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
  // Sync server data
  FinTran.syncDataFromServer().then(() => {
    // If the window exposes a data reload callback hook, call it
    if (typeof window.onDataSynced === 'function') window.onDataSynced();
  });
});

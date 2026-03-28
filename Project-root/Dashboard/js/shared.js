// shared.js - FINAL CLEAN VERSION (for your current dashboard)

const WW = {
  dates: ['Jan 06','Jan 07','Jan 08','Jan 09','Jan 10','Jan 11','Jan 12'],
  blocks: {
    'G-H':  { label:'Girls Hostel',    icon:'fa-venus',           daily:[85.64,85.64,85.64,85.64,85.64,85.64,85.64], total:599.48,  avg:85.64,  peak:85.64,  rate:8.5, appliances:[['AC',252.0],['Geyser',252.0],['Power Socket',63.0],['Sockets',18.9],['Fan',6.3],['Tubelights',5.04],['Bulbs',2.24]] },
    'B-H':  { label:'Boys Hostel',     icon:'fa-mars',            daily:[85.64,85.64,85.64,85.64,85.64,85.64,85.64], total:599.48,  avg:85.64,  peak:85.64,  rate:8.5, appliances:[['AC',252.0],['Geyser',252.0],['Power Socket',63.0],['Sockets',18.9],['Fan',6.3],['Tubelights',5.04],['Bulbs',2.24]] },
    'AB1':  { label:'Academic Blk 1',  icon:'fa-building-columns',daily:[177.3,45.0,177.3,45.0,177.3,0.0,0.0],       total:621.9,   avg:88.84,  peak:177.3,  rate:8.5, appliances:[['PCs',337.5],['ACs',180.0],['AC',54.0],['Fans',18.0],['Tube lights',9.0],['Smart board',9.0],['Sockets',9.0],['Smartboard',5.4]] },
    'AB2':  { label:'Academic Blk 2',  icon:'fa-building',        daily:[396.0,23.4,396.0,23.4,396.0,0.0,0.0],       total:1234.8,  avg:176.4,  peak:396.0,  rate:8.5, appliances:[['PCs',675.0],['ACs',432.0],['AC',90.0],['Smartboards',10.8],['Smartboard',9.0],['Sockets',9.0],['Fans',9.0]] },
    'ADMIN':{ label:'Admin Block',     icon:'fa-landmark',        daily:[322.47,91.62,322.47,91.62,322.47,0.0,0.0],  total:1150.65, avg:164.38, peak:322.47, rate:8.5, appliances:[['ACs',828.0],['AC',180.0],['PCs',45.0],['PC',45.0],['Sockets',21.6],['Smartboards',10.8],['Projector',8.1],['Fan',4.5],['LED TV',3.6],['Projector Screen',2.7],['Mic Stand',1.35]] }
  }
};

function getDashboardRoot() {
  const path = window.location.pathname;
  if (path.includes('/pages/')) return path.substring(0, path.indexOf('/pages/')) + '/';
  return path.substring(0, path.lastIndexOf('/') + 1) || './';
}

function getPublicLogin() {
  return getDashboardRoot() + '../../public/index.html';
}

function authGuard() {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.replace(getPublicLogin());
    return false;
  }
  return true;
}

function isAdmin() {
  return localStorage.getItem('role') === 'admin';
}

// Main Sidebar Init
function initSidebar(activeId) {
  if (!authGuard()) return;

  const u = localStorage.getItem('username') || 'User';
  if (document.getElementById('avatarEl')) document.getElementById('avatarEl').textContent = u[0].toUpperCase();
  if (document.getElementById('sidebarUser')) document.getElementById('sidebarUser').textContent = u;
  if (document.getElementById('sidebarRole')) document.getElementById('sidebarRole').textContent = isAdmin() ? 'Admin' : 'Viewer';

  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === activeId);
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.replace(getPublicLogin());
    });
  }
}

// Navigation
function navigate(page) {
  const root = getDashboardRoot();
  const map = {
    dashboard:      root + 'dashboard.html',
    live:           root + 'pages/live.html',
    consumption:    root + 'pages/consumption.html',
    forecast:       root + 'pages/forecast.html',
    lstm_dashboard: root + 'pages/lstm_dashboard.html',
    ai_assistant:   root + 'pages/ai_assistant.html',
    anomalies:      root + 'pages/anomalies.html',
    billing:        root + 'pages/billing.html',
    upload:         root + 'pages/upload.html',
    export:         root + 'pages/export.html',
    switch_user:    root + 'pages/switch_user.html',
    block_gh:       root + 'pages/block_gh.html',
    block_bh:       root + 'pages/block_bh.html',
    block_ab1:      root + 'pages/block_ab1.html',
    block_ab2:      root + 'pages/block_ab2.html',
    block_adm:      root + 'pages/block_adm.html',
  };

  if (map[page]) {
    window.location.href = map[page];
  } else {
    console.warn('[WattWise] Unknown page:', page);
  }
}

// Chart helpers
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  scales: {
    y: { beginAtZero: true, ticks: { color: '#007a1f', font: { family: "'Share Tech Mono'", size: 10 } }, grid: { color: 'rgba(0,255,65,0.06)' } },
    x: { ticks: { color: '#007a1f', font: { family: "'Share Tech Mono'", size: 10 } }, grid: { display: false } }
  },
  plugins: {
    legend: { labels: { color: '#00cc33', font: { family: "'Share Tech Mono'", size: 11 }, boxWidth: 12 } },
    tooltip: { backgroundColor: '#010d01', borderColor: '#00551a', borderWidth: 1, titleColor: '#00ff41', bodyColor: '#00cc33' }
  }
};

function lineChart(id, labels, datasets) {
  const el = document.getElementById(id);
  if (!el) return null;
  return new Chart(el.getContext('2d'), {
    type: 'line',
    data: { labels, datasets },
    options: JSON.parse(JSON.stringify(CHART_DEFAULTS))
  });
}

function dataset(label, data, color, dashed = false) {
  return {
    label: label,
    data: data,
    borderColor: color,
    backgroundColor: color.replace('rgb', 'rgba').replace(')', ',0.10)'),
    tension: 0.35,
    fill: true,
    borderDash: dashed ? [5, 4] : [],
    pointBackgroundColor: color,
    pointRadius: 4
  };
}

// Budget helpers
const BUDGET_KEY = 'ww_budgets';
function getBudgets() {
  try { return JSON.parse(localStorage.getItem(BUDGET_KEY)) || {}; } 
  catch { return {}; }
}
function saveBudget(key, value) {
  const b = getBudgets();
  b[key] = value;
  localStorage.setItem(BUDGET_KEY, JSON.stringify(b));
}
function getBudgetStatus(spent, budget) {
  if (!budget || budget <= 0) return null;
  const pct = (spent / budget) * 100;
  if (pct >= 100) return { label: 'OVER BUDGET', cls: 'badge-bad', pct };
  if (pct >= 80)  return { label: 'NEAR LIMIT', cls: 'badge-warn', pct };
  return { label: 'WITHIN BUDGET', cls: 'badge-ok', pct };
}
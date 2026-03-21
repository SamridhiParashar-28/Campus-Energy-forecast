// ── Real CSV data (pre-processed) ─────────────────────────
const WW = {
  dates: ['Jan 06','Jan 07','Jan 08','Jan 09','Jan 10','Jan 11','Jan 12'],
  blocks: {
    'G-H':  { label:'Girls Hostel',    icon:'fa-venus',           daily:[85.64,85.64,85.64,85.64,85.64,85.64,85.64], total:599.48,  avg:85.64,  peak:85.64,  rate:8.5, rooms:['GH101','GH102','GH103','GH104','GH105','Common Room','Bathroom Block'], appliances:[['AC',252.0],['Geyser',252.0],['Power Socket',63.0],['Sockets',18.9],['Fan',6.3],['Tubelights',5.04],['Bulbs',2.24]] },
    'B-H':  { label:'Boys Hostel',     icon:'fa-mars',            daily:[85.64,85.64,85.64,85.64,85.64,85.64,85.64], total:599.48,  avg:85.64,  peak:85.64,  rate:8.5, rooms:['BH101','BH102','BH103','BH104','BH105','Common Room','Bathroom Block'], appliances:[['AC',252.0],['Geyser',252.0],['Power Socket',63.0],['Sockets',18.9],['Fan',6.3],['Tubelights',5.04],['Bulbs',2.24]] },
    'AB1':  { label:'Academic Blk 1',  icon:'fa-building-columns',daily:[177.3,45.0,177.3,45.0,177.3,0.0,0.0],       total:621.9,   avg:88.84,  peak:177.3,  rate:8.5, rooms:['Lab 101','Lab 102','Lecture Hall A','Lecture Hall B','Faculty Room','Server Room'], appliances:[['PCs',337.5],['ACs',180.0],['AC',54.0],['Fans',18.0],['Tube lights',9.0],['Smart board',9.0],['Sockets',9.0],['Smartboard',5.4]] },
    'AB2':  { label:'Academic Blk 2',  icon:'fa-building',        daily:[396.0,23.4,396.0,23.4,396.0,0.0,0.0],       total:1234.8,  avg:176.4,  peak:396.0,  rate:8.5, rooms:['BigLab','Lab 201','Lab 202','Lecture Hall C','Lecture Hall D','Project Room'], appliances:[['PCs',675.0],['ACs',432.0],['AC',90.0],['Smartboards',10.8],['Smartboard',9.0],['Sockets',9.0],['Fans',9.0]] },
    'ADMIN':{ label:'Admin Block',     icon:'fa-landmark',        daily:[322.47,91.62,322.47,91.62,322.47,0.0,0.0],  total:1150.65, avg:164.38, peak:322.47, rate:8.5, rooms:['Principal Office','Admin Office','Conference Room','Seminar Hall','Reception','Records Room'], appliances:[['ACs',828.0],['AC',180.0],['PCs',45.0],['PC',45.0],['Sockets',21.6],['Smartboards',10.8],['Projector',8.1],['Fan',4.5],['LED TV',3.6],['Projector Screen',2.7],['Mic Stand',1.35]] }
  }
};

// ── Find the Dashboard root folder from any page depth ─────
function getDashboardRoot() {
  const path = window.location.pathname;
  if (path.includes('/pages/')) {
    return path.substring(0, path.indexOf('/pages/')) + '/';
  }
  return path.substring(0, path.lastIndexOf('/') + 1);
}

// ── Sign out redirect → welcome page ──────────────────────
function getPublicLogin() {
  const root = getDashboardRoot();
  // root is something like /Project-root/Dashboard/
  // go one level up to Project-root/welcome.html
  return root + '../welcome.html';
}

// ── Auth guard ─────────────────────────────────────────────
function authGuard() {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.replace(getPublicLogin());
    return false;
  }
  return true;
}

// ── Sidebar renderer ───────────────────────────────────────
function renderSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <h1>WATT<br>WISE</h1>
      <p>Energy Monitor</p>
    </div>
    <div class="sidebar-user">
      <div class="avatar" id="avatarEl">—</div>
      <div class="sidebar-user-info">
        <span id="sidebarUser">—</span>
        <small>Campus Admin</small>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Main</div>
      <a class="nav-item" data-page="dashboard"><i class="fas fa-gauge-high"></i> Dashboard</a>
      <a class="nav-item" data-page="live"><i class="fas fa-bolt"></i> Live Usage</a>
      <a class="nav-item" data-page="consumption"><i class="fas fa-chart-line"></i> Consumption Trend</a>
      <div class="nav-section-label">Analysis</div>
      <a class="nav-item" data-page="forecast"><i class="fas fa-brain"></i> ML Forecast</a>
      <a class="nav-item" data-page="anomalies"><i class="fas fa-triangle-exclamation"></i> Anomalies</a>
      <a class="nav-item" data-page="billing"><i class="fas fa-file-invoice-dollar"></i> Billing</a>
      <div class="nav-section-label">Data</div>
      <a class="nav-item" data-page="upload"><i class="fas fa-upload"></i> Upload Data</a>
      <a class="nav-item" data-page="export"><i class="fas fa-file-export"></i> Export Report</a>
      <div class="nav-section-label">Blocks</div>
      <a class="nav-item" data-page="block_gh"><i class="fas fa-venus"></i> Girls Hostel</a>
      <a class="nav-item" data-page="block_bh"><i class="fas fa-mars"></i> Boys Hostel</a>
      <a class="nav-item" data-page="block_ab1"><i class="fas fa-building-columns"></i> Academic Blk 1</a>
      <a class="nav-item" data-page="block_ab2"><i class="fas fa-building"></i> Academic Blk 2</a>
      <a class="nav-item" data-page="block_adm"><i class="fas fa-landmark"></i> Admin Block</a>
      <div class="nav-section-label">Account</div>
      <a class="nav-item" data-page="switch_user"><i class="fas fa-user-plus"></i> Switch User</a>
    </nav>
    <div class="sidebar-bottom">
      <a class="nav-item danger" id="logoutBtn"><i class="fas fa-right-from-bracket"></i> Sign Out</a>
    </div>
  `;
}

// ── Sidebar init ───────────────────────────────────────────
function initSidebar(activeId) {
  if (!authGuard()) return;
  renderSidebar();

  const u = localStorage.getItem('username') || 'Admin';
  const avatarEl = document.getElementById('avatarEl');
  const userEl   = document.getElementById('sidebarUser');
  if (avatarEl) avatarEl.textContent = u[0].toUpperCase();
  if (userEl)   userEl.textContent   = u;

  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === activeId);
    el.addEventListener('click', () => navigate(el.dataset.page));
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.replace(getPublicLogin());
    });
  }
}

// ── Navigation ─────────────────────────────────────────────
function navigate(page) {
  const root = getDashboardRoot();  // e.g. /Project-root/Dashboard/
  const map = {
    dashboard:   root + 'dashboard.html',
    live:        root + 'pages/live.html',
    consumption: root + 'pages/consumption.html',
    forecast:    root + 'pages/forecast.html',
    anomalies:   root + 'pages/anomalies.html',
    billing:     root + 'pages/billing.html',
    upload:      root + 'pages/upload.html',
    export:      root + 'pages/export.html',
    switch_user: root + 'pages/switch_user.html',
    block_gh:    root + 'pages/block_gh.html',
    block_bh:    root + 'pages/block_bh.html',
    block_ab1:   root + 'pages/block_ab1.html',
    block_ab2:   root + 'pages/block_ab2.html',
    block_adm:   root + 'pages/block_adm.html',
  };
  if (map[page]) {
    window.location.href = map[page];
  } else {
    console.warn('Unknown page:', page);
  }
}

// ── Chart helpers ──────────────────────────────────────────
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode:'index', intersect:false },
  scales: {
    y: { beginAtZero:true, ticks:{color:'#007a1f',font:{family:"'Share Tech Mono'",size:10}}, grid:{color:'rgba(0,255,65,0.06)'} },
    x: { ticks:{color:'#007a1f',font:{family:"'Share Tech Mono'",size:10}}, grid:{display:false} }
  },
  plugins: {
    legend: { labels:{ color:'#00cc33', font:{family:"'Share Tech Mono'",size:11}, boxWidth:12 } },
    tooltip: { backgroundColor:'#010d01', borderColor:'#00551a', borderWidth:1, titleColor:'#00ff41', bodyColor:'#00cc33', titleFont:{family:"'Share Tech Mono'"}, bodyFont:{family:"'Share Tech Mono'"} }
  }
};

function lineChart(id, labels, datasets) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  return new Chart(ctx.getContext('2d'), { type:'line', data:{labels, datasets}, options:JSON.parse(JSON.stringify(CHART_DEFAULTS)) });
}

function barChart(id, labels, datasets) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  return new Chart(ctx.getContext('2d'), { type:'bar', data:{labels, datasets}, options:JSON.parse(JSON.stringify(CHART_DEFAULTS)) });
}

function dataset(label, data, color, dashed) {
  return { label, data, borderColor:color, backgroundColor:color.replace(')',',0.10)').replace('rgb','rgba'), tension:0.35, fill:true, borderDash:dashed?[5,4]:[], pointBackgroundColor:color, pointRadius:4, spanGaps:false };
}

function barDataset(label, data, color) {
  return { label, data, backgroundColor:color.replace(')',',0.70)').replace('rgb','rgba'), borderColor:color, borderWidth:1 };
}

function calcBill(kwh, rate) { return (kwh * rate).toFixed(2); }

function exportCSV(rows, filename) {
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv,' + encodeURIComponent(csv);
  a.download = filename;
  a.click();
}

// ── Budget helpers ─────────────────────────────────────────
const BUDGET_KEY = 'ww_budgets';

function getBudgets() {
  try {
    return JSON.parse(localStorage.getItem(BUDGET_KEY)) || {};
  } catch { return {}; }
}

function saveBudget(key, value) {
  const b = getBudgets();
  b[key] = value;
  localStorage.setItem(BUDGET_KEY, JSON.stringify(b));
}

function getBudgetStatus(spent, budget) {
  if (!budget || budget <= 0) return null;
  const pct = (spent / budget) * 100;
  if (pct >= 100) return { label: 'OVER BUDGET', cls: 'badge-bad',  pct };
  if (pct >= 80)  return { label: 'NEAR LIMIT',  cls: 'badge-warn', pct };
  return               { label: 'WITHIN BUDGET', cls: 'badge-ok',   pct };
}
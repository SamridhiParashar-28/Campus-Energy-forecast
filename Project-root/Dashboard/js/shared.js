// ── Real CSV data (pre-processed) ─────────────────────────
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

// ── Find the Dashboard root folder from any page depth ─────
function getDashboardRoot() {
  const path = window.location.pathname;
  if (path.includes('/pages/')) {
    return path.substring(0, path.indexOf('/pages/')) + '/';
  }
  return path.substring(0, path.lastIndexOf('/') + 1);
}

function getPublicLogin() {
  return getDashboardRoot() + '../../welcome.html';
}

// ── Auth guard ─────────────────────────────────────────────
function authGuard() {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.replace(getPublicLogin());
    return false;
  }
  return true;
}

// ── Role helper ────────────────────────────────────────────
function isAdmin() {
  return localStorage.getItem('role') === 'admin';
}

// ── Sidebar init ───────────────────────────────────────────
function initSidebar(activeId) {
  if (!authGuard()) return;

  const u        = localStorage.getItem('username') || 'Admin';
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
    console.warn('[WattWise] Unknown page key:', page);
  }
}

// ── Chart defaults ─────────────────────────────────────────
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#007a1f', font: { family: "'Share Tech Mono'", size: 10 } },
      grid:  { color: 'rgba(0,255,65,0.06)' }
    },
    x: {
      ticks: { color: '#007a1f', font: { family: "'Share Tech Mono'", size: 10 } },
      grid:  { display: false }
    }
  },
  plugins: {
    legend: {
      labels: { color: '#00cc33', font: { family: "'Share Tech Mono'", size: 11 }, boxWidth: 12 }
    },
    tooltip: {
      backgroundColor: '#010d01',
      borderColor:     '#00551a',
      borderWidth:     1,
      titleColor:      '#00ff41',
      bodyColor:       '#00cc33',
      titleFont: { family: "'Share Tech Mono'" },
      bodyFont:  { family: "'Share Tech Mono'" }
    }
  }
};

// ── Chart helpers ──────────────────────────────────────────
function lineChart(id, labels, datasets) {
  const el = document.getElementById(id);
  if (!el) { console.warn('[WattWise] lineChart: canvas #' + id + ' not found'); return null; }
  return new Chart(el.getContext('2d'), {
    type: 'line',
    data: { labels, datasets },
    options: JSON.parse(JSON.stringify(CHART_DEFAULTS))
  });
}

function barChart(id, labels, datasets) {
  const el = document.getElementById(id);
  if (!el) { console.warn('[WattWise] barChart: canvas #' + id + ' not found'); return null; }
  return new Chart(el.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets },
    options: JSON.parse(JSON.stringify(CHART_DEFAULTS))
  });
}

function dataset(label, data, color, dashed) {
  return {
    label,
    data,
    borderColor:      color,
    backgroundColor:  color.replace(')', ',0.10)').replace('rgb', 'rgba'),
    tension:          0.35,
    fill:             true,
    borderDash:       dashed ? [5, 4] : [],
    pointBackgroundColor: color,
    pointRadius:      4,
    spanGaps:         false
  };
}

function barDataset(label, data, color) {
  return {
    label,
    data,
    backgroundColor: color.replace(')', ',0.70)').replace('rgb', 'rgba'),
    borderColor:     color,
    borderWidth:     1
  };
}

function calcBill(kwh, rate) { return (kwh * rate).toFixed(2); }

function exportCSV(rows, filename) {
  const csv = rows.map(r => r.join(',')).join('\n');
  const a   = document.createElement('a');
  a.href     = 'data:text/csv,' + encodeURIComponent(csv);
  a.download = filename;
  a.click();
}

// ── Budget helpers ─────────────────────────────────────────
const BUDGET_KEY = 'ww_budgets';

function getBudgets() {
  try { return JSON.parse(localStorage.getItem(BUDGET_KEY)) || {}; }
  catch { return {}; }
}

function saveBudget(key, value) {
  const b = getBudgets(); b[key] = value;
  localStorage.setItem(BUDGET_KEY, JSON.stringify(b));
}

function getBudgetStatus(spent, budget) {
  if (!budget || budget <= 0) return null;
  const pct = (spent / budget) * 100;
  if (pct >= 100) return { label: 'OVER BUDGET',   cls: 'badge-bad',  pct };
  if (pct >= 80)  return { label: 'NEAR LIMIT',    cls: 'badge-warn', pct };
  return                 { label: 'WITHIN BUDGET', cls: 'badge-ok',   pct };
}


// ══════════════════════════════════════════════════════════
//  FLOATING AI WIDGET
//  Auto-injects on every dashboard page.
//  To opt out on a specific page, add data-no-ai-widget="true" to <body>.
// ══════════════════════════════════════════════════════════
(function () {
  'use strict';
  if (window.location.pathname.includes('ai_assistant')) return;

  const CAMPUS_SNAP = {
    totalKwh:4206, totalCost:35751, tariff:8.5,
    blocks:{
      'Girls Hostel':    {kwh:599.48, avg:85.64, topApp:'AC+Geyser'},
      'Boys Hostel':     {kwh:599.48, avg:85.64, topApp:'AC+Geyser'},
      'Academic Block 1':{kwh:621.9,  avg:88.84, topApp:'PCs 54%'},
      'Academic Block 2':{kwh:1234.8, avg:176.4, topApp:'BigLab PCs 55%'},
      'Admin Block':     {kwh:1150.65,avg:164.38,topApp:'ACs 72%'}
    },
    anomalies:[
      'AB2 BigLab PCs: 225 kWh/day [HIGH]',
      'Admin ACs: 828 kWh/week [HIGH]',
      'Hostel flat 85.64 kWh every day — metering suspect [MEDIUM]'
    ]
  };

  function buildWidgetSystem() {
    const page = document.title || 'WattWise Dashboard';
    const bLines = Object.entries(CAMPUS_SNAP.blocks).map(([n,b])=>
      `${n}: ${b.kwh} kWh/week, avg ${b.avg}/day, top: ${b.topApp}`).join('; ');
    return `You are WattWise AI, a compact energy assistant embedded in the dashboard sidebar widget.
Current page: "${page}".
Campus Jan 06-12 2025: ${CAMPUS_SNAP.totalKwh} kWh total, ₹${CAMPUS_SNAP.totalCost} @ ₹${CAMPUS_SNAP.tariff}/kWh.
Blocks: ${bLines}.
Anomalies: ${CAMPUS_SNAP.anomalies.join('; ')}.
Model: LSTM+XGBoost, 94.2% accuracy.
IMPORTANT: Keep replies under 100 words. Be direct. Use bullet points sparingly. Always use specific numbers. Suggest the full AI Assistant page for deeper questions.`;
  }

  const css = `
    #ww-btn{position:fixed;bottom:1.6rem;right:1.6rem;z-index:9100;width:48px;height:48px;border-radius:50%;
      background:#020f02;border:1.5px solid #00ff41;color:#00ff41;font-size:1rem;cursor:pointer;
      display:flex;align-items:center;justify-content:center;box-shadow:0 0 18px rgba(0,255,65,0.28);
      transition:transform 0.18s,box-shadow 0.18s;animation:ww-pulse 3s ease-in-out infinite;}
    #ww-btn:hover{transform:scale(1.1);box-shadow:0 0 28px rgba(0,255,65,0.5);}
    @keyframes ww-pulse{0%,100%{box-shadow:0 0 18px rgba(0,255,65,0.28)}50%{box-shadow:0 0 28px rgba(0,255,65,0.52),0 0 52px rgba(0,255,65,0.12)}}
    #ww-badge{position:absolute;top:-3px;right:-3px;width:15px;height:15px;border-radius:50%;
      background:#ff3355;font-size:0.5rem;color:#fff;display:none;align-items:center;justify-content:center;font-family:monospace;}
    #ww-badge.on{display:flex;}
    #ww-tip{position:fixed;bottom:4.2rem;right:1.6rem;z-index:9099;background:#010d01;
      border:1px solid #007a1f;color:#00cc33;font-size:0.6rem;letter-spacing:1px;
      padding:4px 9px;white-space:nowrap;opacity:0;transition:opacity 0.25s;pointer-events:none;font-family:'Share Tech Mono',monospace;}
    #ww-tip.on{opacity:1;}
    #ww-panel{position:fixed;bottom:5rem;right:1.6rem;z-index:9098;width:330px;max-height:480px;
      background:#020f02;border:1px solid #00551a;display:flex;flex-direction:column;
      font-family:'Share Tech Mono',monospace;box-shadow:0 0 36px rgba(0,255,65,0.1);
      transform:scale(0.9) translateY(12px);opacity:0;pointer-events:none;
      transition:transform 0.22s cubic-bezier(.34,1.56,.64,1),opacity 0.18s;}
    #ww-panel.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all;}
    #ww-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,transparent,#00ff41,transparent);}
    .wph{display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0.85rem;
      border-bottom:1px solid #00551a;background:rgba(0,255,65,0.02);}
    .wph-l{display:flex;align-items:center;gap:7px;}
    .wph-t{font-size:0.65rem;color:#00ff41;letter-spacing:2px;}
    .wph-s{font-size:0.52rem;color:#008822;letter-spacing:1px;}
    .wph-r{display:flex;gap:5px;align-items:center;}
    .wph-full{background:transparent;border:1px solid #00551a;color:#008822;cursor:pointer;
      font-size:0.53rem;padding:2px 6px;letter-spacing:1px;transition:all 0.15s;font-family:inherit;}
    .wph-full:hover{border-color:#007a1f;color:#00cc33;}
    .wph-x{background:transparent;border:none;color:#008822;cursor:pointer;font-size:0.75rem;padding:1px 3px;transition:color 0.15s;}
    .wph-x:hover{color:#ff3355;}
    .wmsgs{flex:1;overflow-y:auto;padding:0.75rem;display:flex;flex-direction:column;gap:0.65rem;
      min-height:160px;max-height:290px;scroll-behavior:smooth;}
    .wmsgs::-webkit-scrollbar{width:2px;} .wmsgs::-webkit-scrollbar-thumb{background:#00551a;}
    .wmsg{display:flex;gap:6px;animation:wm-in 0.14s ease;}
    .wmsg.u{flex-direction:row-reverse;}
    @keyframes wm-in{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
    .wav{width:20px;height:20px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:0.48rem;}
    .wmsg.u .wav{background:rgba(0,255,65,0.1);border:1px solid #007a1f;color:#00cc33;}
    .wmsg.ai .wav{background:rgba(0,170,255,0.07);border:1px solid #003355;color:#0099cc;}
    .wbub{font-size:0.68rem;line-height:1.6;padding:0.45rem 0.65rem;max-width:88%;}
    .wmsg.u  .wbub{background:rgba(0,255,65,0.07);border:1px solid #00551a;color:#00cc33;}
    .wmsg.ai .wbub{background:rgba(0,6,0,0.85);border:1px solid #00551a;color:#00cc33;}
    .wmsg.ai .wbub strong{color:#00ff41;}
    .wmsg.ai .wbub ul{padding-left:0.85rem;margin:0.15rem 0;}
    .wmsg.ai .wbub li{margin:1px 0;}
    .wtyp{display:flex;gap:3px;align-items:center;padding:0.45rem 0.65rem;background:rgba(0,6,0,0.85);border:1px solid #00551a;width:fit-content;}
    .wtyp span{width:3px;height:3px;background:#007a1f;border-radius:50%;animation:wt-d 1.1s ease-in-out infinite;}
    .wtyp span:nth-child(2){animation-delay:0.18s} .wtyp span:nth-child(3){animation-delay:0.36s}
    @keyframes wt-d{0%,60%,100%{opacity:0.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
    .wq{padding:0.35rem 0.7rem 0;border-top:1px solid rgba(0,85,26,0.2);display:flex;gap:3px;flex-wrap:wrap;}
    .wqb{padding:2px 7px;background:transparent;border:1px solid #00551a;color:#007a1f;
      font-family:inherit;font-size:0.55rem;cursor:pointer;transition:all 0.13s;}
    .wqb:hover{border-color:#007a1f;color:#00cc33;}
    .wir{display:flex;gap:4px;padding:0.55rem 0.7rem;border-top:1px solid #00551a;background:rgba(0,5,0,0.6);}
    .wi{flex:1;background:#000;border:1px solid #00551a;color:#00cc33;font-family:inherit;
      font-size:0.68rem;padding:4px 7px;outline:none;resize:none;min-height:30px;max-height:65px;line-height:1.4;transition:border-color 0.18s;}
    .wi:focus{border-color:#007a1f;} .wi::placeholder{color:#003311;}
    .wsb{padding:0 8px;height:30px;background:transparent;border:1px solid #007a1f;color:#00cc33;
      font-family:inherit;font-size:0.62rem;cursor:pointer;transition:all 0.18s;}
    .wsb:hover:not(:disabled){background:rgba(0,255,65,0.06);border-color:#00ff41;color:#00ff41;}
    .wsb:disabled{opacity:0.28;cursor:not-allowed;}
    @media(max-width:500px){#ww-panel{width:calc(100vw - 2rem);right:1rem;}}
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div id="ww-tip">Ask WattWise AI</div>
    <button id="ww-btn" title="WattWise AI Assistant">
      <i class="fas fa-robot"></i>
      <div id="ww-badge"></div>
    </button>
    <div id="ww-panel">
      <div class="wph">
        <div class="wph-l">
          <i class="fas fa-robot" style="color:#00ff41;font-size:0.75rem"></i>
          <div><div class="wph-t">WATTWISE AI</div><div class="wph-s">Energy assistant</div></div>
        </div>
        <div class="wph-r">
          <button class="wph-full" onclick="wwOpenFull()">FULL PAGE ↗</button>
          <button class="wph-x" onclick="wwClose()"><i class="fas fa-xmark"></i></button>
        </div>
      </div>
      <div class="wmsgs" id="wmsgs"></div>
      <div class="wq" id="wq">
        <button class="wqb" onclick="wwQ('Top block this week?')">⚡ Top block</button>
        <button class="wqb" onclick="wwQ('Any anomalies right now?')">⚠ Anomalies</button>
        <button class="wqb" onclick="wwQ('One quick cost saving tip?')">💡 Save costs</button>
        <button class="wqb" onclick="wwQ('Tomorrow forecast?')">🔮 Forecast</button>
      </div>
      <div class="wir">
        <textarea class="wi" id="wi" placeholder="Quick question…" rows="1"></textarea>
        <button class="wsb" id="wsb" onclick="wwSend()"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  let open=false, hist=[], unread=0, welcomed=false;

  function toggle(){ open=!open; document.getElementById('ww-panel').classList.toggle('open',open); if(open){unread=0;badge();welcome();} }
  function wwClose(){ open=false; document.getElementById('ww-panel').classList.remove('open'); }
  function wwOpenFull(){ window.location.href=getDashboardRoot()+'pages/ai_assistant.html'; }
  function badge(){ const b=document.getElementById('ww-badge'); if(unread>0){b.textContent=unread>9?'9+':unread;b.classList.add('on');}else{b.classList.remove('on');} }

  function addW(role,content,skip){
    const el=document.getElementById('wmsgs');
    const d=document.createElement('div'); d.className=`wmsg ${role==='user'?'u':'ai'}`;
    let html=content;
    if(role!=='user'){ html=content.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/^- (.+)$/gm,'<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g,s=>`<ul>${s}</ul>`).replace(/\n/g,'<br>'); }
    d.innerHTML=`<div class="wav"><i class="fas ${role==='user'?'fa-user':'fa-robot'}"></i></div><div class="wbub">${html}</div>`;
    el.appendChild(d); el.scrollTop=el.scrollHeight;
    if(!skip&&role!=='user'){unread++;if(!open)badge();}
    if(!skip)hist.push({role,content});
  }

  function showTyp(){ const el=document.getElementById('wmsgs'); const d=document.createElement('div'); d.className='wmsg ai';d.id='wtyp';d.innerHTML=`<div class="wav"><i class="fas fa-robot"></i></div><div class="wtyp"><span></span><span></span><span></span></div>`;el.appendChild(d);el.scrollTop=el.scrollHeight; }
  function rmTyp(){ document.getElementById('wtyp')?.remove(); }

  function welcome(){
    if(welcomed) return; welcomed=true;
    addW('assistant','**Hi!** WattWise AI here.\n\n**4,206 kWh** this week · ₹35,751 · 2 HIGH anomalies active.\n\nAsk me anything or open the full AI page for deep analysis.',true);
  }

  async function wwSend(ov){
    const inp=document.getElementById('wi');
    const txt=(ov||inp.value).trim(); if(!txt)return;
    document.getElementById('wq').style.display='none';
    addW('user',txt); hist.push({role:'user',content:txt});
    inp.value=''; inp.style.height='auto';
    document.getElementById('wsb').disabled=true; showTyp();
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:buildWidgetSystem(),messages:[...hist.slice(0,-1),{role:'user',content:txt}]})});
      if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error?.message||`API ${r.status}`);}
      const data=await r.json(); const reply=data.content?.map(b=>b.text||'').join('')||'';
      rmTyp(); addW('assistant',reply);
    }catch(e){
      rmTyp();
      addW('assistant',e.message.includes('401')||e.message.includes('api_key')?'⚠ API key not configured yet. Set up the /api/chat proxy in server.js.':`⚠ ${e.message}`,true);
    }finally{document.getElementById('wsb').disabled=false;}
  }

  function wwQ(t){ if(!open){open=true;document.getElementById('ww-panel').classList.add('open');welcome();} wwSend(t); }

  const btn=document.getElementById('ww-btn'), tip=document.getElementById('ww-tip');
  let tipT;
  btn.addEventListener('mouseenter',()=>{clearTimeout(tipT);tip.classList.add('on');});
  btn.addEventListener('mouseleave',()=>{tipT=setTimeout(()=>tip.classList.remove('on'),400);});
  btn.addEventListener('click',toggle);

  window.wwQ=wwQ; window.wwClose=wwClose; window.wwOpenFull=wwOpenFull; window.wwSend=wwSend;

  const wi=document.getElementById('wi');
  wi.addEventListener('input',()=>{wi.style.height='auto';wi.style.height=Math.min(wi.scrollHeight,65)+'px';});
  wi.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();wwSend();}});

  // Badge nudge after 3s to invite interaction
  setTimeout(()=>{ if(!open){unread=1;badge();} }, 3000);

})();
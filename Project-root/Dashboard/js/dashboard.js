document.addEventListener("DOMContentLoaded", () => {

  // ── Auth guard ──────────────────────────────────────────
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (!isLoggedIn) {
    // Use replace() so the user can't press Back to get back here
    window.location.replace("../public/index.html");
    return;
  }

  const username = localStorage.getItem("username") || "User";

  // ── Populate header ─────────────────────────────────────
  const userEl = document.getElementById("current-user");
  if (userEl) userEl.textContent = username;

  const updateEl = document.getElementById("last-update");
  if (updateEl) {
    updateEl.textContent = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  // ── Logout ──────────────────────────────────────────────
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();                               // wipe ALL session data
      window.location.replace("../public/index.html");
    });
  }

  // ── Sidebar active-link highlight ───────────────────────
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", function () {
      document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // ── Dummy data (replace with real fetch() later) ────────
  const dummyData = {
    todayUsage:  "14.8",
    todayChange: "+12% from yesterday",
    monthUsage:  "287.4",
    monthChange: "−3.1% from last month",
    peakHour:    "18:00 – 19:00 (3.2 kW)",
    hasAnomaly:  true
  };

  setEl("today-usage",  dummyData.todayUsage  + " kWh");
  setEl("today-change", dummyData.todayChange);
  setEl("month-usage",  dummyData.monthUsage  + " kWh");
  setEl("month-change", dummyData.monthChange);
  setEl("peak-hour",    dummyData.peakHour);

  const alertCard = document.getElementById("anomaly-alert");
  if (dummyData.hasAnomaly && alertCard) alertCard.style.display = "block";

  // ── Chart ───────────────────────────────────────────────
  const canvas = document.getElementById("consumptionChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels:   ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label:           "kWh / day",
        data:            [18.2, 21.5, 19.8, 24.1, 22.7, 17.3, 15.9],
        borderColor:     "#00ff41",
        backgroundColor: "rgba(0, 255, 65, 0.10)",
        tension:         0.35,
        fill:            true,
        pointBackgroundColor: "#00ff41",
        pointBorderColor:     "#000",
        pointBorderWidth:     2,
        pointRadius:          5,
        pointHoverRadius:     7
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        y: {
          beginAtZero: true,
          ticks:  { color: "#00cc33" },
          grid:   { color: "rgba(0, 255, 65, 0.08)" }
        },
        x: {
          ticks: { color: "#00cc33" },
          grid:  { display: false }
        }
      },
      plugins: {
        legend: { labels: { color: "#00ff41" } },
        tooltip: {
          backgroundColor: "#001100",
          borderColor:     "#00aa33",
          borderWidth:     1,
          titleColor:      "#00ff41",
          bodyColor:       "#00cc33"
        }
      }
    }
  });

  // ── Helper ──────────────────────────────────────────────
  function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // ── Future: replace dummyData with real fetch ────────────
  // async function loadRealData() {
  //   const token = localStorage.getItem("token");
  //   const res   = await fetch("http://localhost:5000/api/usage/summary", {
  //     headers: { "Authorization": "Bearer " + token }
  //   });
  //   const data  = await res.json();
  //   setEl("today-usage", data.todayKwh + " kWh");
  //   ...
  // }
  // loadRealData();
});
// dashboard/js/dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  // Very basic client-side auth check
  // In real app → use JWT / session cookie + backend verification
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const savedUsername = localStorage.getItem("username") || "Guest";

  if (!isLoggedIn) {
    alert("Please sign in first.");
    window.location.href = "../index.html";
    return;
  }

  // Show username
  const userEl = document.getElementById("current-user");
  if (userEl) userEl.textContent = savedUsername;

  // Fake last update
  const updateEl = document.getElementById("last-update");
  if (updateEl) {
    const now = new Date();
    updateEl.textContent = now.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  // ── Later you can add here: ──
  // fetch live usage
  // handle CSV upload
  // refresh forecast / anomalies
  // toggle dark/matrix theme, etc.
});
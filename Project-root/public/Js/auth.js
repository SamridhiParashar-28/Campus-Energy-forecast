document.addEventListener("DOMContentLoaded", () => {

  const form      = document.getElementById("loginForm");
  const toggle    = document.getElementById("togglePassword");
  const passInput = document.getElementById("password");
  const submitBtn = document.getElementById("submitBtn");
  const errorEl   = document.getElementById("error-message");

  // Pre-fill username if passed from register page
const prefill = localStorage.getItem("prefillUsername");
if (prefill) {
  document.getElementById("username").value = prefill;
  localStorage.removeItem("prefillUsername");
}
  

  // ── Password visibility toggle ─────────────────────────
  if (toggle && passInput) {
    toggle.addEventListener("click", () => {
      const show     = passInput.type === "password";
      passInput.type = show ? "text" : "password";
      toggle.classList.toggle("fa-eye",      !show);
      toggle.classList.toggle("fa-eye-slash", show);
    });
  }

  if (!form) return;

  // ── Form submit ────────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const username = document.getElementById("username")?.value?.trim();
    const password = passInput?.value?.trim();

    if (!username || !password) {
      return showError("Please enter your username and password.");
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = "Signing in…";

    try {
      const res  = await fetch("http://localhost:5000/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.clear();
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username",   data.username);
        localStorage.setItem("token",      data.token);

        showSuccess("Login successful! Redirecting…");

        // index.html is at: Watt-Wise/Project-root/public/index.html
        // dashboard.html is: Watt-Wise/Project-root/Dashboard/dashboard.html
        // From public/ → go up one level (..) → into Dashboard/
        setTimeout(() => {
          window.location.replace("../Dashboard/dashboard.html");
        }, 1000);

      } else {
        showError(data.message || "Invalid username or password.");
      }
    } catch {
      showError("Cannot connect to server. Is the backend running on port 5000?");
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = "Sign in";
    }
  });

  // ── Helpers ────────────────────────────────────────────
  function showError(msg) {
    errorEl.style.color   = "var(--accent-danger, #ff3366)";
    errorEl.textContent   = msg;
    errorEl.style.display = "block";
  }

  function showSuccess(msg) {
    errorEl.style.color   = "#00ff41";
    errorEl.textContent   = msg;
    errorEl.style.display = "block";
  }

  function clearMessage() {
    errorEl.style.display = "none";
    errorEl.textContent   = "";
  }
});
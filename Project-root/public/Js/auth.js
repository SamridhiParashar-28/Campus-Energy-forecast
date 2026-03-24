document.addEventListener("DOMContentLoaded", () => {

  const form      = document.getElementById("loginForm");
  const toggle    = document.getElementById("togglePassword");
  const passInput = document.getElementById("password");
  const submitBtn = document.getElementById("submitBtn");
  const errorEl   = document.getElementById("error-message");

  // ── Password visibility toggle ─────────────────────────
  if (toggle && passInput) {
    toggle.addEventListener("click", () => {
      const show = passInput.type === "password";
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
    const password = passInput?.value;

    if (!username || !password)
      return showError("Please enter your username and password.");

    submitBtn.disabled    = true;
    submitBtn.textContent = "Signing in…";

    try {
      const res = await fetch("http://localhost:5000/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.clear();
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username",   data.username);
        localStorage.setItem("role",       data.role);      // ← real role from server
        localStorage.setItem("token",      data.token);     // ← real JWT

        showSuccess("Login successful! Redirecting…");
        setTimeout(() => {
          window.location.replace("../../Dashboard/dashboard.html");
        }, 900);
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

document.addEventListener("DOMContentLoaded", () => {

  const form        = document.getElementById("loginForm");
  const toggle      = document.getElementById("togglePassword");
  const passInput   = document.getElementById("password");
  const submitBtn   = document.getElementById("submitBtn");
  const errorEl     = document.getElementById("error-message");

  // ── Password visibility toggle ─────────────────────────
  if (toggle && passInput) {
    toggle.addEventListener("click", () => {
      const show = passInput.type === "password";
      passInput.type = show ? "text" : "password";
      toggle.classList.toggle("fa-eye",       !show);
      toggle.classList.toggle("fa-eye-slash",  show);
    });
  }

  // ── Form submit ────────────────────────────────────────
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const username = document.getElementById("username")?.value?.trim();
    const password = passInput?.value??"";

    if (!username || !password) {
      return showError("Please enter your username and password.");
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = "Signing in…";

    try {
      const res  = await fetch("http://localhost:8000/auth/login", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",   // required — sends/receives the HttpOnly cookie
        body:        JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Token is now stored in an HttpOnly cookie by the server — not localStorage.
        // We only store non-sensitive display info here.
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username",   data.username);
        localStorage.setItem("role",       data.role);

        showSuccess("Login successful! Redirecting…");
        setTimeout(() => {
          window.location.replace("../Dashboard/dashboard.html");
        }, 1000);
      } else {
        showError(data.detail || data.message || "Invalid username or password.");
      }
    } catch {
      showError("Cannot connect to server. Is the backend running on port 8000?");
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
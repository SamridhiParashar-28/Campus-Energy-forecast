document.addEventListener("DOMContentLoaded", () => {
  const form        = document.getElementById("registerForm");
  const toggle      = document.getElementById("togglePassword");
  const passInput   = document.getElementById("password");
  const confirmPass = document.getElementById("confirmPassword");
  const submitBtn   = document.getElementById("submitBtn");
  const messageEl   = document.getElementById("message");

  // ── Password visibility toggle ─────────────────────────
  if (toggle && passInput) {
    toggle.addEventListener("click", () => {
      const show = passInput.type === "password";
      passInput.type = show ? "text" : "password";
      toggle.classList.toggle("fa-eye",       !show);
      toggle.classList.toggle("fa-eye-slash",  show);
    });
  }

  if (!form) return;

  // ── Form submit ────────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    // NOTE: Only trim username; do NOT trim password — spaces can be intentional
    const username     = document.getElementById("username")?.value?.trim() ?? "";
    const passValue    = passInput?.value ?? "";
    const confirmValue = confirmPass?.value ?? "";

    // ── Client-side validation ──────────────────────────
    if (!username || !passValue || !confirmValue) {
      return showMessage("All fields are required.", "error");
    }
    if (username.length < 3 || username.length > 50) {
      return showMessage("Username must be between 3 and 50 characters.", "error");
    }
    if (passValue.length < 6) {
      return showMessage("Password must be at least 6 characters.", "error");
    }
    if (passValue !== confirmValue) {
      return showMessage("Passwords do not match.", "error");
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = "Creating account…";

    try {
      const res = await fetch("http://localhost:8000/auth/register", {
        method:      "POST",
        headers:     { "Content-Type": "application/json", "Accept": "application/json" },
        credentials: "include",   // required — allows cookie to be set on redirect to login
        body:        JSON.stringify({ username, password: passValue })
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid response from server.");
      }

      if (res.ok && data.success) {
        showMessage("Account created! Redirecting to login…", "success");
        setTimeout(() => {
          window.location.replace("index.html");
        }, 1500);
      } else {
        showMessage(data.detail || data.message || "Registration failed. Please try again.", "error");
      }
    } catch (err) {
      console.error("Registration error:", err);
      showMessage(
        "Cannot connect to the server. Make sure the backend is running on port 8000.",
        "error"
      );
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = "REGISTER";
    }
  });

  // ── Helpers ────────────────────────────────────────────
  function showMessage(text, type = "error") {
    messageEl.textContent   = text;
    messageEl.style.color   = type === "success" ? "#00ff41" : "#ff3366";
    messageEl.style.display = "block";
  }

  function clearMessage() {
    messageEl.style.display = "none";
    messageEl.textContent   = "";
  }
});
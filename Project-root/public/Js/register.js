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
      toggle.classList.toggle("fa-eye",      !show);
      toggle.classList.toggle("fa-eye-slash", show);
    });
  }

  if (!form) return;

  // ── Form submit ────────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const username     = document.getElementById("username")?.value?.trim() ?? "";
    const passValue    = passInput?.value ?? "";
    const confirmValue = confirmPass?.value ?? "";

    // Client-side validation
    if (!username || !passValue || !confirmValue)
      return showMessage("All fields are required.", "error");
    if (username.length < 3 || username.length > 50)
      return showMessage("Username must be 3–50 characters.", "error");
    if (passValue.length < 6)
      return showMessage("Password must be at least 6 characters.", "error");
    if (passValue !== confirmValue)
      return showMessage("Passwords do not match.", "error");

    submitBtn.disabled    = true;
    submitBtn.textContent = "Creating account…";

    try {
      // Step 1: Register
      const regRes = await fetch("http://localhost:5000/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, password: passValue }),
      });

      const regData = await regRes.json();

      if (!regRes.ok || !regData.success) {
        return showMessage(regData.message || "Registration failed.", "error");
      }

      showMessage("Account created! Signing you in…", "success");

      // Step 2: Auto-login
      try {
        const loginRes  = await fetch("http://localhost:5000/login", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ username, password: passValue }),
        });
        const loginData = await loginRes.json();

        if (loginRes.ok && loginData.success) {
          localStorage.clear();
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("username",   loginData.username);
          localStorage.setItem("role",       loginData.role);    // ← real role
          localStorage.setItem("token",      loginData.token);   // ← real JWT

          showMessage("All done! Going to dashboard…", "success");
          setTimeout(() => {
            window.location.replace("../../Dashboard/dashboard.html");
          }, 1000);
        } else {
          showMessage("Account created! Please sign in.", "success");
          setTimeout(() => window.location.replace("../index.html"), 1500);
        }
      } catch {
        showMessage("Account created! Please sign in.", "success");
        setTimeout(() => window.location.replace("../index.html"), 1500);
      }

    } catch (err) {
      console.error("Registration error:", err);
      showMessage(
        "Cannot connect to server. Make sure the backend is running on port 5000.",
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

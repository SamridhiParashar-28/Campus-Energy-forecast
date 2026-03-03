// auth.js - Login page JavaScript (corrected backend port + minor improvements)

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const toggle = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const submitBtn = document.getElementById("submitBtn");

  // Create or get error message element
  let errorEl = document.getElementById("error-message");
  if (!errorEl) {
    errorEl = document.createElement("div");
    errorEl.id = "error-message";
    errorEl.style.color = "#ff3366";
    errorEl.style.fontSize = "0.95rem";
    errorEl.style.marginTop = "12px";
    errorEl.style.textAlign = "center";
    form.appendChild(errorEl);
  }

  // Password visibility toggle
  if (toggle && passwordInput) {
    toggle.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
      toggle.classList.toggle("fa-eye");
      toggle.classList.toggle("fa-eye-slash");
    });
  }

  // Form submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username")?.value?.trim();
      const password = passwordInput?.value?.trim();

      if (!username || !password) {
        errorEl.textContent = "Please enter both username/email and password";
        errorEl.style.display = "block";
        return;
      }

      errorEl.style.display = "none";
      submitBtn.disabled = true;
      submitBtn.textContent = "Signing in...";

      try {
        const response = await fetch("http://localhost:5000/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
          credentials: "omit",           // ← useful if you later use cookies/sessions
        });

        let data;
        try {
          data = await response.json();
        } catch {
          throw new Error("Invalid response from server");
        }

        if (response.ok && data.success) {
          // You can store token/user info here
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("username", username);

          alert("LOGIN SUCCESSFUL");
          window.location.href = "Dashboard/dashboard.html"; // corrected path (case-sensitive)
        } else {
          errorEl.textContent = data.message || "Invalid username or password";
          errorEl.style.display = "block";
        }
      } catch (err) {
        console.error("Login error:", err);
        errorEl.textContent = "Cannot connect to server – is the backend running?";
        errorEl.style.display = "block";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign in";
      }
    });
  }
});
// auth.js - Login page JavaScript (updated for backend connection)

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
      const password = passwordInput?.value;

      if (!username || !password) {
        errorEl.textContent = "PLEASE ENTER BOTH USERNAME AND PASSWORD";
        errorEl.style.display = "block";
        return;
      }

      errorEl.style.display = "none";
      submitBtn.disabled = true;
      submitBtn.textContent = "SIGNING IN...";

      try {
        const response = await fetch("http://localhost:3000/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        let data;
        try {
          data = await response.json();
        } catch {
          throw new Error("Invalid response from server");
        }

        if (response.ok && data.success) {
          // Optional: store in IndexedDB if you want to keep user data client-side
          // await saveAuthData("demo-token", data.user || { username });

          alert("LOGIN SUCCESSFUL");
          window.location.href = "dashboard.html"; // or your dashboard page
        } else {
          errorEl.textContent = data.message || "INVALID USERNAME OR PASSWORD";
          errorEl.style.display = "block";
        }
      } catch (err) {
        console.error("Login error:", err);
        errorEl.textContent = "CANNOT CONNECT TO SERVER – IS BACKEND RUNNING?";
        errorEl.style.display = "block";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "SIGN IN";
      }
    });
  }
});
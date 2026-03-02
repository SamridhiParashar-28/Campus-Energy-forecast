// js/register.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const toggle = document.getElementById("togglePassword");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const submitBtn = document.getElementById("submitBtn");
  const messageEl = document.getElementById("message");

  // Toggle password visibility
  toggle.addEventListener("click", () => {
    const type = password.type === "password" ? "text" : "password";
    password.type = type;
    toggle.classList.toggle("fa-eye");
    toggle.classList.toggle("fa-eye-slash");
  });

  // Form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const passValue = password.value;
    const confirmValue = confirmPassword.value;

    // Clear previous messages
    messageEl.style.display = "none";
    messageEl.className = "error"; // reset style

    // Client-side checks
    if (!username || !passValue || !confirmValue) {
      messageEl.textContent = "ALL FIELDS ARE REQUIRED";
      messageEl.style.display = "block";
      return;
    }

    if (passValue !== confirmValue) {
      messageEl.textContent = "PASSWORDS DO NOT MATCH";
      messageEl.style.display = "block";
      return;
    }

    if (passValue.length < 6) {
      messageEl.textContent = "PASSWORD MUST BE AT LEAST 6 CHARACTERS";
      messageEl.style.display = "block";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "REGISTERING...";

    try {
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: passValue
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        messageEl.textContent = "ACCOUNT CREATED SUCCESSFULLY! REDIRECTING...";
        messageEl.className = "success"; // green text (add style below)
        messageEl.style.display = "block";
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = "index.html";
        }, 2000);
      } else {
        messageEl.textContent = data.message || "REGISTRATION FAILED - USERNAME MAY ALREADY EXIST";
        messageEl.style.display = "block";
      }
    } catch (err) {
      console.error(err);
      messageEl.textContent = "CANNOT CONNECT TO SERVER - IS BACKEND RUNNING?";
      messageEl.style.display = "block";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "REGISTER";
    }
  });
});
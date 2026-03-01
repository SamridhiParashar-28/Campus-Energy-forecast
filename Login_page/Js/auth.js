// ==================== IndexedDB Local Database Setup ====================
const DB_NAME = "AppAuthDB";
const DB_VERSION = 1;
const STORE_NAME = "auth";

let dbInstance = null;

// Open / Create the local database
function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

// Save login data (token + user info) into local database
async function saveAuthData(token, user = {}) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({ 
      id: "current", 
      token, 
      user, 
      timestamp: Date.now() 
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Read data from local database (use this in dashboard.html)
async function getAuthData() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get("current");

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Clear database (for logout)
async function clearAuthData() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete("current");

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ==================== Login Form Logic ====================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const toggle = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const submitBtn = document.getElementById("submitBtn");

  // Password show/hide
  toggle.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    toggle.classList.toggle("fa-eye");
    toggle.classList.toggle("fa-eye-slash");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      alert("Please fill both fields");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in...";

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save to local database (IndexedDB)
        await saveAuthData(data.token || "demo-token", data.user || { username });

        window.location.href = "/dashboard.html";
      } else {
        alert(data.message || "Login failed – check your credentials");
      }
    } catch (err) {
      alert("Cannot connect to server. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign in";
    }
  });
});
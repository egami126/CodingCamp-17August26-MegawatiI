// =============================================================================
// Expense and Budget Visualizer — js/app.js (Fixed Version)
// =============================================================================

const CATEGORIES = ["Food", "Transport", "Fun"];

const CATEGORY_COLORS = {
  Food:      "#8aaefc",
  Transport: "#17f77c",
  Fun:       "#f387c2",
};

let transactions = [];
const LS_KEY = "transactions";
let chart = null;

// --- Local Storage Operations ---

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === null) {
      transactions = [];
      return;
    }
    const parsed = JSON.parse(raw);
    transactions = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    transactions = [];
    showAppError("Could not load saved data.");
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(transactions));
  } catch (err) {
    throw err;
  }
}

function addTransaction(tx) {
  transactions.push(tx);
  try {
    saveToStorage();
  } catch (err) {
    transactions.pop();
    showAppError("Could not save changes.");
    throw err;
  }
}

function deleteTransaction(id) {
  transactions = transactions.filter((tx) => String(tx.id) !== String(id));
  try {
    saveToStorage();
  } catch (err) {
    showAppError("Could not persist deletion.");
    throw err;
  }
}

// --- Error Display & Validation ---

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  let span = field.parentNode ? field.parentNode.querySelector(".field-error") : null;
  if (!span) {
    span = document.createElement("span");
    span.className = "field-error";
    span.setAttribute("role", "alert");
    field.insertAdjacentElement("afterend", span);
  }
  span.textContent = message;
}

function clearFieldErrors() {
  document.querySelectorAll(".field-error").forEach((el) => el.remove());
}

function showAppError(message) {
  clearAppError();
  const banner = document.createElement("div");
  banner.id = "app-error-banner";
  banner.setAttribute("role", "alert");

  const text = document.createElement("span");
  text.className = "app-error-text";
  text.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "app-error-close";
  closeBtn.textContent = "\u00D7";
  closeBtn.addEventListener("click", clearAppError);

  banner.appendChild(text);
  banner.appendChild(closeBtn);
  document.body.insertAdjacentElement("afterbegin", banner);
}

function clearAppError() {
  document.getElementById("app-error-banner")?.remove();
}

function validateName(name) {
  if (typeof name !== "string" || name.trim().length === 0) {
    return { valid: false, error: "Item name is required." };
  }
  if (name.trim().length > 100) {
    return { valid: false, error: "Item name must be 100 characters or fewer." };
  }
  return { valid: true, error: null };
}

function validateAmount(amount) {
  const str = String(amount).trim();
  if (str === "") {
    return { valid: false, error: "Amount is required." };
  }
  if (!/^\d+(\.\d+)?$/.test(str)) {
    return { valid: false, error: "Amount must be a valid positive number." };
  }
  const decimalMatch = str.match(/\.(\d+)$/);
  if (decimalMatch && decimalMatch[1].length > 2) {
    return { valid: false, error: "Amount must have at most 2 decimal places." };
  }
  const value = parseFloat(str);
  if (isNaN(value) || value < 0.01) {
    return { valid: false, error: "Amount must be at least 0.01." };
  }
  if (value > 999999.99) {
    return { valid: false, error: "Amount must be no greater than 999,999.99." };
  }
  return { valid: true, error: null };
}

function validateCategory(cat) {
  if (!cat || cat === "") {
    return { valid: false, error: "Please select a category." };
  }
  if (!CATEGORIES.includes(cat)) {
    return { valid: false, error: "Category must be Food, Transport, or Fun." };
  }
  return { valid: true, error: null };
}

function validateForm(name, amount, cat) {
  const nameRes = validateName(name);
  const amountRes = validateAmount(amount);
  const catRes = validateCategory(cat);

  return {
    valid: nameRes.valid && amountRes.valid && catRes.valid,
    errors: {
      name: nameRes.error,
      amount: amountRes.error,
      category: catRes.error,
    },
  };
}

// --- UI Renderers ---

function renderBalance() {
  const sum = transactions.reduce((acc, tx) => {
    const val = parseFloat(tx.amount);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const rounded = Math.round(sum * 100) / 100;
  const balanceEl = document.getElementById("total-balance");
  if (balanceEl) {
    balanceEl.textContent = "$" + rounded.toFixed(2);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderList() {
  const ul = document.getElementById("transaction-list");
  const emptyState = document.getElementById("list-empty-state");
  if (!ul || !emptyState) return;

  if (transactions.length === 0) {
    ul.style.display = "none";
    emptyState.style.display = "block";
    ul.innerHTML = "";
    return;
  }

  const sorted = transactions.slice().sort((a, b) => b.timestamp - a.timestamp);

  ul.innerHTML = sorted
    .map((tx) => {
      const formattedAmount = "$" + parseFloat(tx.amount).toFixed(2);
      const safeName = escapeHtml(tx.name);
      const safeCategory = escapeHtml(tx.category);

      return `
        <li class="transaction-item" data-id="${tx.id}">
          <div class="tx-details">
            <span class="tx-name">${safeName}</span>
            <span class="tx-amount">${formattedAmount}</span>
            <span class="badge">${safeCategory}</span>
          </div>
          <button type="button" class="btn-delete" data-id="${tx.id}" aria-label="Delete ${safeName}">Delete</button>
        </li>
      `;
    })
    .join("");

  emptyState.style.display = "none";
  ul.style.display = "block";
}

function handleDeleteClick(id) {
  try {
    deleteTransaction(id);
  } catch (err) {
    return;
  }
  updateUI();
}

function initChart() {
  if (typeof Chart === "undefined") return;
  const canvas = document.getElementById("spending-chart");
  if (!canvas) return;

  // Hancurkan chart lama jika ada untuk mencegah error 'Canvas in use'
  if (chart) {
    chart.destroy();
  }

  chart = new Chart(canvas, {
    type: "pie",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

function renderChart() {
  if (chart === null) return;
  const canvas = document.getElementById("spending-chart");
  const emptyState = document.getElementById("chart-empty-state");

  const totals = { Food: 0, Transport: 0, Fun: 0 };
  transactions.forEach((tx) => {
    const val = parseFloat(tx.amount);
    if (!isNaN(val) && totals.hasOwnProperty(tx.category)) {
      totals[tx.category] += val;
    }
  });

  const labels = [];
  const data = [];
  const backgroundColors = [];

  CATEGORIES.forEach((cat) => {
    const total = Math.round(totals[cat] * 100) / 100;
    if (total > 0) {
      labels.push(cat);
      data.push(total);
      backgroundColors.push(CATEGORY_COLORS[cat]);
    }
  });

  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.data.datasets[0].backgroundColor = backgroundColors;
  chart.update();

  const hasData = data.length > 0;
  if (canvas) canvas.style.display = hasData ? "block" : "none";
  if (emptyState) emptyState.style.display = hasData ? "none" : "block";
}

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function handleFormSubmit(event) {
  event.preventDefault();
  clearFieldErrors();

  const nameInput = document.getElementById("item-name");
  const amountInput = document.getElementById("amount");
  const categoryInput = document.getElementById("category");

  const name = nameInput ? nameInput.value : "";
  const amount = amountInput ? amountInput.value : "";
  const category = categoryInput ? categoryInput.value : "";

  const validation = validateForm(name, amount, category);
  if (!validation.valid) {
    if (validation.errors.name) showFieldError("item-name", validation.errors.name);
    if (validation.errors.amount) showFieldError("amount", validation.errors.amount);
    if (validation.errors.category) showFieldError("category", validation.errors.category);
    return;
  }

  const tx = {
    id: generateId(),
    name: name.trim(),
    amount: String(parseFloat(amount).toFixed(2)),
    category: category,
    timestamp: Date.now(),
  };

  try {
    addTransaction(tx);
  } catch (err) {
    return;
  }

  updateUI();

  if (nameInput) nameInput.value = "";
  if (amountInput) amountInput.value = "";
  if (categoryInput) categoryInput.value = "";
}

function updateUI() {
  renderList();
  renderBalance();
  renderChart();
}

// Event Delegation & App Initialization
document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
  initChart();
  updateUI();

  const form = document.getElementById("transaction-form");
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }

  // Delegasi event click untuk tombol delete (Cukup dipasang 1x)
  const listUl = document.getElementById("transaction-list");
  if (listUl) {
    listUl.addEventListener("click", (event) => {
      const btn = event.target.closest(".btn-delete[data-id]");
      if (btn) {
        handleDeleteClick(btn.dataset.id);
      }
    });
  }
});
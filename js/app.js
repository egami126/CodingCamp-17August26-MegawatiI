// =============================================================================
// Expense and Budget Visualizer — js/app.js (Enhanced)
// =============================================================================

const DEFAULT_CATEGORIES = ["Food", "Transport", "Fun"];

let categories = [];
let transactions = [];
let chart = null;
let currentFilter = "ALL";

const LS_TX_KEY = "transactions";
const LS_CAT_KEY = "custom_categories";
const LS_THEME_KEY = "app_theme";

// --- Theme Manager ---

function initTheme() {
  const savedTheme = localStorage.getItem(LS_THEME_KEY) || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButtonText(savedTheme);

  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const activeTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = activeTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem(LS_THEME_KEY, newTheme);
      updateThemeButtonText(newTheme);
      renderChart(); // Redraw chart for legend color visibility
    });
  }
}

function updateThemeButtonText(theme) {
  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.textContent = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
  }
}

// --- Category Manager ---

function loadCategories() {
  try {
    const raw = localStorage.getItem(LS_CAT_KEY);
    categories = raw ? JSON.parse(raw) : [...DEFAULT_CATEGORIES];
  } catch (err) {
    categories = [...DEFAULT_CATEGORIES];
  }
  populateCategoryDropdowns();
}

function saveCategories() {
  localStorage.setItem(LS_CAT_KEY, JSON.stringify(categories));
}

function addCustomCategory() {
  const name = prompt("Enter new category name:");
  if (!name) return;
  const cleanName = name.trim();
  if (!cleanName) return;

  if (categories.some(c => c.toLowerCase() === cleanName.toLowerCase())) {
    alert("Category already exists!");
    return;
  }

  categories.push(cleanName);
  saveCategories();
  populateCategoryDropdowns();
  renderChart();
}

function populateCategoryDropdowns() {
  const formSelect = document.getElementById("category");
  const filterSelect = document.getElementById("sort-category-filter");

  if (formSelect) {
    formSelect.innerHTML = `<option value="">-- Select a category --</option>` +
      categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  }

  if (filterSelect) {
    const prevVal = filterSelect.value || "ALL";
    filterSelect.innerHTML = `<option value="ALL">All Categories</option>` +
      categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    filterSelect.value = prevVal;
  }
}

// Generates dynamic colors for categories
function getCategoryColor(index) {
  const palette = ["#E5989B", "#79B4D9", "#F2A385", "#82C09A", "#E6C594", "#B39CD0"];
  return palette[index % palette.length];
}

// --- Store Operations ---

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_TX_KEY);
    transactions = raw ? JSON.parse(raw) : [];
  } catch (err) {
    transactions = [];
  }
}

function saveToStorage() {
  localStorage.setItem(LS_TX_KEY, JSON.stringify(transactions));
}

function addTransaction(tx) {
  transactions.push(tx);
  saveToStorage();
}

function deleteTransaction(id) {
  transactions = transactions.filter((tx) => String(tx.id) !== String(id));
  saveToStorage();
}

// --- Renderers ---

function renderBalance() {
  const sum = transactions.reduce((acc, tx) => acc + (parseFloat(tx.amount) || 0), 0);
  const balanceEl = document.getElementById("total-balance");
  if (balanceEl) {
    balanceEl.textContent = "$" + sum.toFixed(2);
  }
}

function renderList() {
  const ul = document.getElementById("transaction-list");
  const emptyState = document.getElementById("list-empty-state");
  if (!ul || !emptyState) return;

  // Filter transactions based on category filter
  let filtered = transactions;
  if (currentFilter !== "ALL") {
    filtered = transactions.filter(t => t.category === currentFilter);
  }

  if (filtered.length === 0) {
    ul.style.display = "none";
    emptyState.style.display = "block";
    ul.innerHTML = "";
    return;
  }

  const sorted = filtered.slice().sort((a, b) => b.timestamp - a.timestamp);

  ul.innerHTML = sorted.map((tx) => `
    <li class="transaction-item" data-id="${tx.id}">
      <div class="tx-details">
        <span class="tx-name">${escapeHtml(tx.name)}</span>
        <span class="tx-amount">$${parseFloat(tx.amount).toFixed(2)}</span>
        <span class="badge">${escapeHtml(tx.category)}</span>
      </div>
      <button type="button" class="btn-delete" data-id="${tx.id}">Delete</button>
    </li>
  `).join("");

  emptyState.style.display = "none";
  ul.style.display = "block";
}

function initChart() {
  if (typeof Chart === "undefined") return;
  const canvas = document.getElementById("spending-chart");
  if (!canvas) return;

  if (chart) chart.destroy();

  chart = new Chart(canvas, {
    type: "pie",
    data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

function renderChart() {
  if (!chart) return;
  const canvas = document.getElementById("spending-chart");
  const emptyState = document.getElementById("chart-empty-state");

  const totals = {};
  categories.forEach(c => totals[c] = 0);

  transactions.forEach((tx) => {
    const val = parseFloat(tx.amount) || 0;
    if (totals.hasOwnProperty(tx.category)) {
      totals[tx.category] += val;
    }
  });

  const labels = [];
  const data = [];
  const backgroundColors = [];

  categories.forEach((cat, idx) => {
    if (totals[cat] > 0) {
      labels.push(cat);
      data.push(totals[cat]);
      backgroundColors.push(getCategoryColor(idx));
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

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function updateUI() {
  renderList();
  renderBalance();
  renderChart();
}

// --- Event Listeners & Init ---

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadCategories();
  loadFromStorage();
  initChart();
  updateUI();

  // Form Submit
  const form = document.getElementById("transaction-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("item-name").value.trim();
      const amount = parseFloat(document.getElementById("amount").value);
      const category = document.getElementById("category").value;

      if (!name || isNaN(amount) || amount <= 0 || !category) {
        alert("Please fill out all fields correctly.");
        return;
      }

      addTransaction({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name,
        amount: amount.toFixed(2),
        category,
        timestamp: Date.now()
      });

      form.reset();
      updateUI();
    });
  }

  // Add Custom Category Button
  const addCatBtn = document.getElementById("btn-add-custom-category");
  if (addCatBtn) {
    addCatBtn.addEventListener("click", addCustomCategory);
  }

  // Filter Category Dropdown
  const filterSelect = document.getElementById("sort-category-filter");
  if (filterSelect) {
    filterSelect.addEventListener("change", (e) => {
      currentFilter = e.target.value;
      renderList();
    });
  }

  // Delete Transaction Delegation
  const listUl = document.getElementById("transaction-list");
  if (listUl) {
    listUl.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-delete");
      if (btn) {
        deleteTransaction(btn.dataset.id);
        updateUI();
      }
    });
  }
});
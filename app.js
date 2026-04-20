const STORAGE_KEY = "poundwise-budget-v2";
const LEGACY_STORAGE_KEY = "poundwise-budget-v1";

const BUCKETS = [
  { name: "Needs", color: "#176b4d", short: "Protect today" },
  { name: "Wants", color: "#b87612", short: "Spend intentionally" },
  { name: "Future You", color: "#3157a4", short: "Build wealth" },
];

const DEFAULT_CATEGORIES = [
  { name: "Rent/Mortgage", bucket: "Needs", color: "#3157a4", budget: 950 },
  { name: "Council tax", bucket: "Needs", color: "#176b4d", budget: 170 },
  { name: "Utilities", bucket: "Needs", color: "#0f766e", budget: 220 },
  { name: "Groceries", bucket: "Needs", color: "#b87612", budget: 350 },
  { name: "Transport", bucket: "Needs", color: "#6d5bd0", budget: 160 },
  { name: "Eating out", bucket: "Wants", color: "#d45b38", budget: 120 },
  { name: "Shopping", bucket: "Wants", color: "#b42335", budget: 100 },
  { name: "Entertainment", bucket: "Wants", color: "#8a5a14", budget: 90 },
  { name: "Subscriptions", bucket: "Wants", color: "#5a7086", budget: 50 },
  { name: "Emergency fund", bucket: "Future You", color: "#14866d", budget: 150 },
  { name: "Investments", bucket: "Future You", color: "#2f855a", budget: 300 },
  { name: "Debt overpayments", bucket: "Future You", color: "#4f46e5", budget: 100 },
  { name: "Other", bucket: "Wants", color: "#6b7280", budget: 100 },
];

const DEFAULT_TARGETS = {
  Needs: 50,
  Wants: 30,
  "Future You": 20,
};

const state = loadState();
let selectedMonth = monthKey(new Date());

const els = {
  monthPicker: document.querySelector("#monthPicker"),
  previousMonth: document.querySelector("#previousMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  incomeMetric: document.querySelector("#incomeMetric"),
  spentMetric: document.querySelector("#spentMetric"),
  remainingMetric: document.querySelector("#remainingMetric"),
  futureRateMetric: document.querySelector("#futureRateMetric"),
  futureMetric: document.querySelector("#futureMetric"),
  wealthGoalMetric: document.querySelector("#wealthGoalMetric"),
  dashboardTitle: document.querySelector("#dashboardTitle"),
  targetStatus: document.querySelector("#targetStatus"),
  frameworkRows: document.querySelector("#frameworkRows"),
  expenseForm: document.querySelector("#expenseForm"),
  expenseCategory: document.querySelector("#expenseCategory"),
  expenseBucketPreview: document.querySelector("#expenseBucketPreview"),
  billForm: document.querySelector("#billForm"),
  billCategory: document.querySelector("#billCategory"),
  categoryForm: document.querySelector("#categoryForm"),
  categoriesList: document.querySelector("#categoriesList"),
  monthlyIncome: document.querySelector("#monthlyIncome"),
  currentWealth: document.querySelector("#currentWealth"),
  wealthGoal: document.querySelector("#wealthGoal"),
  targetNeeds: document.querySelector("#targetNeeds"),
  targetWants: document.querySelector("#targetWants"),
  targetFuture: document.querySelector("#targetFuture"),
  saveBudget: document.querySelector("#saveBudget"),
  billsList: document.querySelector("#billsList"),
  categoryPie: document.querySelector("#categoryPie"),
  categoryLegend: document.querySelector("#categoryLegend"),
  categoryPieTotal: document.querySelector("#categoryPieTotal"),
  categoryChartHint: document.querySelector("#categoryChartHint"),
  budgetPie: document.querySelector("#budgetPie"),
  budgetLegend: document.querySelector("#budgetLegend"),
  budgetPieTotal: document.querySelector("#budgetPieTotal"),
  budgetChartHint: document.querySelector("#budgetChartHint"),
  dailyBars: document.querySelector("#dailyBars"),
  averageSpend: document.querySelector("#averageSpend"),
  goalCards: document.querySelector("#goalCards"),
  insights: document.querySelector("#insights"),
  categoryTable: document.querySelector("#categoryTable"),
  transactions: document.querySelector("#transactions"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  exportCsv: document.querySelector("#exportCsv"),
  resetDemo: document.querySelector("#resetDemo"),
  emptyTemplate: document.querySelector("#emptyTemplate"),
};

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

init();

function init() {
  populateCategories();
  els.monthPicker.value = selectedMonth;
  els.expenseForm.elements.date.value = todayIso();
  setDefaultCategoryValues();

  els.monthPicker.addEventListener("change", () => {
    selectedMonth = els.monthPicker.value || monthKey(new Date());
    render();
  });
  els.previousMonth.addEventListener("click", () => shiftMonth(-1));
  els.nextMonth.addEventListener("click", () => shiftMonth(1));
  els.saveBudget.addEventListener("click", saveBudgetSettings);
  els.expenseForm.addEventListener("submit", addExpense);
  els.billForm.addEventListener("submit", addBill);
  els.categoryForm.addEventListener("submit", addCategory);
  els.expenseCategory.addEventListener("change", updateExpenseBucketPreview);
  els.searchInput.addEventListener("input", renderTransactions);
  els.categoryFilter.addEventListener("change", renderTransactions);
  els.exportCsv.addEventListener("click", exportCsv);
  els.resetDemo.addEventListener("click", seedDemoData);

  render();
}

function loadState() {
  const fallback = { expenses: [], bills: [], monthly: {}, categories: cloneDefaultCategories(), billPayments: {} };
  let parsed = {};
  try {
    parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || "{}");
  } catch {
    parsed = {};
  }

  const loaded = { ...fallback, ...parsed };
  loaded.categories = normaliseCategories(loaded.categories);
  loaded.expenses = Array.isArray(loaded.expenses) ? loaded.expenses : [];
  loaded.bills = Array.isArray(loaded.bills) ? loaded.bills : [];
  loaded.monthly = loaded.monthly && typeof loaded.monthly === "object" ? loaded.monthly : {};
  loaded.billPayments = loaded.billPayments && typeof loaded.billPayments === "object" ? loaded.billPayments : {};
  return loaded;
}

function cloneDefaultCategories() {
  return DEFAULT_CATEGORIES.map((category) => ({ ...category }));
}

function normaliseCategories(categories) {
  const source = Array.isArray(categories) && categories.length ? categories : cloneDefaultCategories();
  const seen = new Set();
  const normalised = source
    .map((category, index) => {
      const fallback = DEFAULT_CATEGORIES[index] || DEFAULT_CATEGORIES.at(-1);
      const name = String(category.name || fallback.name).trim();
      if (!name || seen.has(name.toLowerCase())) return null;
      seen.add(name.toLowerCase());
      const bucket = BUCKETS.some((item) => item.name === category.bucket) ? category.bucket : fallback.bucket || "Wants";
      return {
        name,
        bucket,
        color: /^#[0-9a-f]{6}$/i.test(category.color || "") ? category.color : fallback.color,
        budget: normaliseMoney(category.budget ?? fallback.budget),
      };
    })
    .filter(Boolean);

  if (!normalised.some((category) => category.name === "Other")) {
    normalised.push({ name: "Other", bucket: "Wants", color: "#6b7280", budget: 100 });
  }
  return normalised;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function populateCategories() {
  const optionHtml = state.categories.map((category) => `<option>${escapeHtml(category.name)}</option>`).join("");
  els.expenseCategory.innerHTML = optionHtml;
  els.billCategory.innerHTML = optionHtml;
  els.categoryFilter.innerHTML = `<option value="All">All</option>${optionHtml}`;
}

function setDefaultCategoryValues() {
  const grocery = state.categories.find((category) => category.name === "Groceries") || state.categories[0];
  const councilTax = state.categories.find((category) => category.name === "Council tax") || state.categories[0];
  if (grocery) els.expenseForm.elements.category.value = grocery.name;
  if (councilTax) els.billForm.elements.category.value = councilTax.name;
  updateExpenseBucketPreview();
}

function render() {
  ensureMonthlySettings(selectedMonth);
  populateCategories();
  els.monthPicker.value = selectedMonth;
  els.dashboardTitle.textContent = monthTitle(selectedMonth);
  renderBudgetInputs();
  renderMetrics();
  renderFrameworkRows();
  renderCharts();
  renderDailyBars();
  renderGoalCards();
  renderInsights();
  renderCategoryTable();
  renderCategoriesList();
  renderBills();
  renderTransactions();
  updateExpenseBucketPreview();
}

function renderBudgetInputs() {
  const settings = ensureMonthlySettings(selectedMonth);
  els.monthlyIncome.value = moneyInput(settings.income);
  els.currentWealth.value = moneyInput(settings.currentWealth);
  els.wealthGoal.value = moneyInput(settings.wealthGoal);
  els.targetNeeds.value = settings.targets.Needs;
  els.targetWants.value = settings.targets.Wants;
  els.targetFuture.value = settings.targets["Future You"];
}

function renderMetrics() {
  const totals = getMonthAnalytics();
  const wealthTotal = totals.settings.currentWealth + totals.futureActual;
  const wealthProgress = percentOf(wealthTotal, totals.settings.wealthGoal);

  els.incomeMetric.textContent = currency.format(totals.income);
  els.spentMetric.textContent = currency.format(totals.totalTracked);
  els.remainingMetric.textContent = currency.format(totals.remaining);
  els.futureRateMetric.textContent = `${Math.round(totals.futureRate)}%`;
  els.futureMetric.textContent = currency.format(totals.futureActual);
  els.wealthGoalMetric.textContent = `${Math.min(100, Math.round(wealthProgress))}%`;
  els.remainingMetric.style.color = totals.remaining < 0 ? "var(--red)" : "inherit";
  els.futureRateMetric.style.color = totals.futureRate >= totals.settings.targets["Future You"] ? "var(--green)" : "var(--gold)";
}

function renderFrameworkRows() {
  const totals = getMonthAnalytics();
  const targetSum = Object.values(totals.settings.targets).reduce((total, value) => total + Number(value || 0), 0);
  els.targetStatus.textContent = targetSum === 100 ? "Targets total 100%" : `Targets total ${targetSum}%`;
  els.targetStatus.classList.toggle("warning-pill", targetSum !== 100);

  els.frameworkRows.innerHTML = BUCKETS.map((bucket) => {
    const actual = totals.bucketActuals[bucket.name] || 0;
    const targetPercent = totals.settings.targets[bucket.name] || 0;
    const targetAmount = totals.income * (targetPercent / 100);
    const actualPercent = percentOf(actual, totals.income);
    const budget = totals.bucketBudgets[bucket.name] || 0;
    const progress = percentOf(actual, targetAmount || budget || actual || 1);
    const isFuture = bucket.name === "Future You";
    const good = isFuture ? actualPercent >= targetPercent : actualPercent <= targetPercent;
    const status = targetAmount === 0 && actual === 0 ? "neutral" : good ? "good" : "warning";

    return `
      <div class="framework-row ${status}">
        <div class="framework-label">
          <span class="dot" style="background:${bucket.color}"></span>
          <div>
            <strong>${bucket.name}</strong>
            <small>${bucket.short}</small>
          </div>
        </div>
        <div class="framework-numbers">
          <strong>${currency.format(actual)}</strong>
          <span>${Math.round(actualPercent)}% actual · ${targetPercent}% target · ${currency.format(budget)} planned</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${status === "warning" ? "warning" : ""}" style="--w:${Math.min(progress, 140)}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderCharts() {
  const totals = getMonthAnalytics();
  const spendByCategory = totals.categoryActuals;
  const budgetByCategory = categoryBudgets();
  const spendTotal = sum(Object.values(spendByCategory));
  const budgetTotal = sum(Object.values(budgetByCategory));

  drawPie(els.categoryPie, els.categoryLegend, spendByCategory);
  drawPie(els.budgetPie, els.budgetLegend, budgetByCategory);
  els.categoryPieTotal.textContent = compactCurrency(spendTotal);
  els.budgetPieTotal.textContent = compactCurrency(budgetTotal);
  els.categoryChartHint.textContent = spendTotal
    ? `${topCategory(spendByCategory)} is your biggest spend area.`
    : "Add daily spendings, investments, or mandatory bills to see the split.";
  els.budgetChartHint.textContent = budgetTotal
    ? `${compactCurrency(budgetTotal)} planned across ${state.categories.length} categories.`
    : "Set budgets to compare your plan.";
}

function renderDailyBars() {
  const days = daysInMonth(selectedMonth);
  const daily = Array.from({ length: days }, () => 0);

  getMonthExpenses().forEach((expense) => {
    const day = Number(expense.date.slice(8, 10));
    daily[day - 1] += expense.amount;
  });

  getRecurringBills().forEach(({ dueDay, actualAmount }) => {
    daily[Math.min(days, dueDay) - 1] += Number(actualAmount || 0);
  });

  const max = Math.max(...daily, 1);
  const average = sum(daily) / days;
  els.averageSpend.textContent = `Avg ${currency.format(average)}/day`;
  els.dailyBars.style.setProperty("--days", days);
  els.dailyBars.innerHTML = daily.map((amount, index) => {
    const height = Math.max(5, (amount / max) * 150);
    const label = index + 1;
    const showLabel = label === 1 || label === days || label % 5 === 0;
    return `<div class="bar ${amount > average * 1.8 && amount > 0 ? "over" : ""}" style="--h:${height}px" title="Day ${label}: ${currency.format(amount)}">${showLabel ? `<span>${label}</span>` : ""}</div>`;
  }).join("");
}

function renderGoalCards() {
  const totals = getMonthAnalytics();
  const targetFutureRate = totals.settings.targets["Future You"];
  const targetFutureAmount = totals.income * (targetFutureRate / 100);
  const wealthTotal = totals.settings.currentWealth + totals.futureActual;
  const cards = [
    {
      title: "Future You rate",
      value: `${Math.round(totals.futureRate)}%`,
      detail: `${currency.format(totals.futureActual)} saved or invested against a ${targetFutureRate}% target.`,
      progress: percentOf(totals.futureActual, targetFutureAmount || 1),
      status: totals.futureActual >= targetFutureAmount ? "good" : "warning",
    },
    {
      title: "Monthly surplus",
      value: currency.format(totals.remaining),
      detail: totals.remaining >= 0 ? "Still available after everything tracked." : "Over income for the selected month.",
      progress: totals.income ? percentOf(Math.max(totals.remaining, 0), totals.income) : 0,
      status: totals.remaining >= 0 ? "good" : "danger",
    },
    {
      title: "Six-figure wealth path",
      value: currency.format(wealthTotal),
      detail: `${currency.format(Math.max(0, totals.settings.wealthGoal - wealthTotal))} left to reach ${currency.format(totals.settings.wealthGoal)}.`,
      progress: percentOf(wealthTotal, totals.settings.wealthGoal || 1),
      status: wealthTotal >= totals.settings.wealthGoal ? "good" : "neutral",
    },
  ];

  els.goalCards.innerHTML = cards.map((card) => `
    <div class="goal-card ${card.status}">
      <span>${card.title}</span>
      <strong>${card.value}</strong>
      <p>${card.detail}</p>
      <div class="progress-track">
        <div class="progress-fill ${card.status === "danger" ? "danger" : card.status === "warning" ? "warning" : ""}" style="--w:${Math.min(card.progress, 100)}%"></div>
      </div>
    </div>
  `).join("");
}

function renderInsights() {
  const totals = getMonthAnalytics();
  const overBudget = state.categories
    .map(({ name }) => ({ name, spent: totals.categoryActuals[name] || 0, budget: totals.categoryBudgets[name] || 0 }))
    .filter((item) => item.budget > 0 && item.spent > item.budget)
    .sort((a, b) => b.spent - b.budget - (a.spent - a.budget));
  const wantsTarget = totals.settings.targets.Wants || 0;
  const wantsRate = percentOf(totals.bucketActuals.Wants || 0, totals.income);
  const futureTarget = totals.settings.targets["Future You"] || 0;
  const messages = [];

  if (!totals.income) {
    messages.push({ type: "warning", text: "Add expected income so the system can calculate target amounts, rates, and monthly surplus." });
  }

  if (totals.futureRate >= futureTarget && totals.income > 0) {
    messages.push({ type: "good", text: `Future You is on track at ${Math.round(totals.futureRate)}% of income this month.` });
  } else if (totals.income > 0) {
    const gap = Math.max(0, totals.income * (futureTarget / 100) - totals.futureActual);
    messages.push({ type: "warning", text: `Future You needs ${currency.format(gap)} more this month to hit the ${futureTarget}% target.` });
  }

  if (wantsRate > wantsTarget && totals.income > 0) {
    messages.push({ type: "warning", text: `Wants are running at ${Math.round(wantsRate)}% of income versus a ${wantsTarget}% target.` });
  }

  if (overBudget.length) {
    const top = overBudget[0];
    messages.push({ type: "danger", text: `${top.name} is over budget by ${currency.format(top.spent - top.budget)}.` });
  } else if (totals.totalTracked > 0) {
    messages.push({ type: "good", text: "No category is over its monthly budget yet." });
  }

  if (state.bills.length) {
    messages.push({ type: "good", text: `${state.bills.length} recurring bill${state.bills.length === 1 ? "" : "s"} are automatically included every selected month.` });
  }

  if (totals.totalTracked > 0) {
    messages.push({ type: "good", text: `${topCategory(totals.categoryActuals)} is currently the largest category.` });
  }

  els.insights.innerHTML = messages.map((message) => `
    <div class="insight ${message.type === "danger" ? "danger" : message.type === "warning" ? "warning" : ""}">
      <div class="insight-icon">${message.type === "danger" ? "!" : message.type === "warning" ? "?" : "✓"}</div>
      <p>${message.text}</p>
    </div>
  `).join("");
}

function renderCategoryTable() {
  const totals = getMonthAnalytics();
  els.categoryTable.innerHTML = state.categories.map((category) => {
    const spent = totals.categoryActuals[category.name] || 0;
    const budget = totals.categoryBudgets[category.name] || 0;
    const percent = budget > 0 ? (spent / budget) * 100 : 0;
    const status = percent >= 100 ? "danger" : percent >= 80 ? "warning" : "";

    return `
      <div class="category-row">
        <div class="category-name">
          <span class="dot" style="background:${category.color}"></span>
          <span>${escapeHtml(category.name)}</span>
          <small>${category.bucket}</small>
        </div>
        <label>
          <span>Budget</span>
          <input type="number" min="0" step="0.01" data-budget-category="${escapeHtml(category.name)}" value="${moneyInput(budget)}" />
        </label>
        <div>
          <strong>${currency.format(spent)}</strong>
          <span class="muted">of ${currency.format(budget)}</span>
          <div class="progress-track" title="${Math.round(percent)}% used">
            <div class="progress-fill ${status}" style="--w:${percent}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderCategoriesList() {
  els.categoriesList.innerHTML = state.categories.map((category) => `
    <div class="category-manage-row" data-category="${escapeHtml(category.name)}">
      <div class="category-name">
        <span class="dot" style="background:${category.color}"></span>
        <span>${escapeHtml(category.name)}</span>
      </div>
      <select data-category-bucket aria-label="${escapeHtml(category.name)} framework">
        ${BUCKETS.map((bucket) => `<option ${bucket.name === category.bucket ? "selected" : ""}>${bucket.name}</option>`).join("")}
      </select>
      <input type="color" value="${category.color}" data-category-color aria-label="${escapeHtml(category.name)} colour" />
      <button class="delete-button" data-delete-category title="Delete category" aria-label="Delete category">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21h10l1-14H6zm3-17h4l1 1h4v2H5V5h4z"/></svg>
      </button>
    </div>
  `).join("");

  els.categoriesList.querySelectorAll("[data-delete-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.closest(".category-manage-row").dataset.category;
      deleteCategory(name);
    });
  });
  els.categoriesList.querySelectorAll("[data-category-bucket]").forEach((select) => {
    select.addEventListener("change", () => {
      const name = select.closest(".category-manage-row").dataset.category;
      const category = state.categories.find((item) => item.name === name);
      if (category) category.bucket = select.value;
      persist();
      render();
    });
  });
  els.categoriesList.querySelectorAll("[data-category-color]").forEach((input) => {
    input.addEventListener("change", () => {
      const name = input.closest(".category-manage-row").dataset.category;
      const category = state.categories.find((item) => item.name === name);
      if (category) category.color = input.value;
      persist();
      render();
    });
  });
}

function renderBills() {
  const bills = getRecurringBills();

  if (!bills.length) {
    els.billsList.innerHTML = emptyHtml("Add council tax, water, rent, insurance, subscriptions, or any fixed monthly commitment.");
    return;
  }

  els.billsList.innerHTML = bills.map((bill) => `
    <div class="bill-row" data-bill-id="${bill.id}">
      <div class="bill-title">
        <strong>${escapeHtml(bill.name)}</strong>
        <span>${escapeHtml(bill.category)} · due day ${bill.dueDay}</span>
      </div>
      <input type="number" min="0" step="0.01" value="${moneyInput(bill.actualAmount)}" aria-label="${escapeHtml(bill.name)} amount" data-bill-amount />
      <span class="tag">Every month</span>
      <button class="delete-button" data-delete-bill title="Delete bill" aria-label="Delete bill">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21h10l1-14H6zm3-17h4l1 1h4v2H5V5h4z"/></svg>
      </button>
    </div>
  `).join("");

  els.billsList.querySelectorAll(".bill-row").forEach((row) => {
    const billId = row.dataset.billId;
    row.querySelector("[data-bill-amount]").addEventListener("change", (event) => {
      const bill = state.bills.find((item) => item.id === billId);
      if (bill) bill.amount = normaliseMoney(event.target.value);
      persist();
      render();
    });
    row.querySelector("[data-delete-bill]").addEventListener("click", () => {
      state.bills = state.bills.filter((bill) => bill.id !== billId);
      persist();
      render();
    });
  });
}

function renderTransactions() {
  const search = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const expenses = getMonthExpenses()
    .filter((expense) => category === "All" || expense.category === category)
    .filter((expense) => {
      const haystack = `${expense.description} ${expense.category} ${expense.method} ${expense.note}`.toLowerCase();
      return haystack.includes(search);
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!expenses.length) {
    els.transactions.innerHTML = emptyHtml("No entries match this month and filter.");
    return;
  }

  els.transactions.innerHTML = expenses.map((expense) => {
    const categoryInfo = getCategory(expense.category);
    return `
      <div class="transaction-row" data-expense-id="${expense.id}">
        <div class="transaction-title">
          <strong>${escapeHtml(expense.description)}</strong>
          <span>${formatDate(expense.date)} · ${escapeHtml(expense.method)}${expense.note ? ` · ${escapeHtml(expense.note)}` : ""}</span>
        </div>
        <span class="tag">${escapeHtml(expense.category)} · ${categoryInfo.bucket}</span>
        <span class="amount-positive">${currency.format(expense.amount)}</span>
        <button class="delete-button" data-delete-expense title="Delete entry" aria-label="Delete entry">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21h10l1-14H6zm3-17h4l1 1h4v2H5V5h4z"/></svg>
        </button>
      </div>
    `;
  }).join("");

  els.transactions.querySelectorAll("[data-delete-expense]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.closest(".transaction-row").dataset.expenseId;
      state.expenses = state.expenses.filter((expense) => expense.id !== id);
      persist();
      render();
    });
  });
}

function addExpense(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const amount = normaliseMoney(data.get("amount"));

  if (!amount) return;

  state.expenses.push({
    id: crypto.randomUUID(),
    date: String(data.get("date")),
    description: String(data.get("description")).trim(),
    amount,
    category: String(data.get("category")),
    method: String(data.get("method")),
    note: String(data.get("note") || "").trim(),
  });

  selectedMonth = monthKey(String(data.get("date")));
  form.reset();
  form.elements.date.value = todayIso();
  setDefaultCategoryValues();
  els.monthPicker.value = selectedMonth;
  persist();
  render();
}

function addBill(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const amount = normaliseMoney(data.get("amount"));

  if (!amount) return;

  state.bills.push({
    id: crypto.randomUUID(),
    name: String(data.get("name")).trim(),
    category: String(data.get("category")),
    amount,
    dueDay: Math.max(1, Math.min(31, Number(data.get("dueDay")) || 1)),
  });

  form.reset();
  form.elements.dueDay.value = 1;
  setDefaultCategoryValues();
  persist();
  render();
}

function addCategory(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const name = String(data.get("name")).trim();
  const duplicate = state.categories.some((category) => category.name.toLowerCase() === name.toLowerCase());

  if (!name || duplicate) {
    alert(duplicate ? "That category already exists." : "Enter a category name.");
    return;
  }

  const category = {
    name,
    bucket: String(data.get("bucket")),
    budget: normaliseMoney(data.get("budget")),
    color: String(data.get("color") || "#176b4d"),
  };

  state.categories.push(category);
  Object.values(state.monthly).forEach((settings) => {
    settings.categoryBudgets = settings.categoryBudgets || {};
    settings.categoryBudgets[name] = category.budget;
  });

  form.reset();
  form.elements.color.value = "#176b4d";
  persist();
  render();
}

function deleteCategory(name) {
  const inUse = state.expenses.some((expense) => expense.category === name) || state.bills.some((bill) => bill.category === name);
  if (inUse) {
    alert("This category has entries or bills. Move those first before deleting it.");
    return;
  }
  if (state.categories.length <= 1) return;
  state.categories = state.categories.filter((category) => category.name !== name);
  Object.values(state.monthly).forEach((settings) => {
    if (settings.categoryBudgets) delete settings.categoryBudgets[name];
  });
  persist();
  render();
}

function saveBudgetSettings() {
  const settings = ensureMonthlySettings(selectedMonth);
  settings.income = normaliseMoney(els.monthlyIncome.value);
  settings.currentWealth = normaliseMoney(els.currentWealth.value);
  settings.wealthGoal = normaliseMoney(els.wealthGoal.value) || 100000;
  settings.targets = {
    Needs: clamp(Number(els.targetNeeds.value), 0, 100),
    Wants: clamp(Number(els.targetWants.value), 0, 100),
    "Future You": clamp(Number(els.targetFuture.value), 0, 100),
  };

  els.categoryTable.querySelectorAll("[data-budget-category]").forEach((input) => {
    settings.categoryBudgets[input.dataset.budgetCategory] = normaliseMoney(input.value);
  });

  persist();
  render();
}

function ensureMonthlySettings(key) {
  if (!state.monthly[key]) {
    state.monthly[key] = {};
  }

  const settings = state.monthly[key];
  settings.income = normaliseMoney(settings.income || 0);
  settings.currentWealth = normaliseMoney(settings.currentWealth || 0);
  settings.wealthGoal = normaliseMoney(settings.wealthGoal || 100000);
  settings.targets = { ...DEFAULT_TARGETS, ...(settings.targets || {}) };
  settings.categoryBudgets = settings.categoryBudgets || {};
  state.categories.forEach((category) => {
    if (settings.categoryBudgets[category.name] === undefined) {
      settings.categoryBudgets[category.name] = normaliseMoney(category.budget);
    }
  });
  persist();
  return settings;
}

function getMonthAnalytics() {
  const settings = ensureMonthlySettings(selectedMonth);
  const expenses = getMonthExpenses();
  const recurringBills = getRecurringBills();
  const categoryActuals = Object.fromEntries(state.categories.map((category) => [category.name, 0]));
  const bucketActuals = Object.fromEntries(BUCKETS.map((bucket) => [bucket.name, 0]));
  const categoryBudgetsMap = categoryBudgets();
  const bucketBudgets = Object.fromEntries(BUCKETS.map((bucket) => [bucket.name, 0]));

  expenses.forEach((expense) => {
    categoryActuals[expense.category] = (categoryActuals[expense.category] || 0) + expense.amount;
  });
  recurringBills.forEach((bill) => {
    categoryActuals[bill.category] = (categoryActuals[bill.category] || 0) + Number(bill.actualAmount || 0);
  });

  state.categories.forEach((category) => {
    const actual = categoryActuals[category.name] || 0;
    const budget = categoryBudgetsMap[category.name] || 0;
    bucketActuals[category.bucket] = (bucketActuals[category.bucket] || 0) + actual;
    bucketBudgets[category.bucket] = (bucketBudgets[category.bucket] || 0) + budget;
  });

  const dailySpend = sum(expenses.map((expense) => expense.amount));
  const recurringBillTotal = sum(recurringBills.map((bill) => bill.actualAmount));
  const totalTracked = dailySpend + recurringBillTotal;
  const income = Number(settings.income || 0);
  const futureActual = bucketActuals["Future You"] || 0;

  return {
    settings,
    expenses,
    recurringBills,
    categoryActuals,
    categoryBudgets: categoryBudgetsMap,
    bucketActuals,
    bucketBudgets,
    dailySpend,
    recurringBillTotal,
    totalTracked,
    income,
    remaining: income - totalTracked,
    futureActual,
    futureRate: percentOf(futureActual, income),
  };
}

function getMonthExpenses() {
  return state.expenses.filter((expense) => monthKey(expense.date) === selectedMonth);
}

function getRecurringBills() {
  return state.bills.map((bill) => ({
    ...bill,
    actualAmount: normaliseMoney(bill.amount),
  }));
}

function categoryBudgets() {
  return ensureMonthlySettings(selectedMonth).categoryBudgets;
}

function getCategory(name) {
  return state.categories.find((category) => category.name === name) || { name, bucket: "Wants", color: "#6b7280", budget: 0 };
}

function drawPie(node, legendNode, totals) {
  const entries = Object.entries(totals).filter(([, value]) => value > 0);
  const total = sum(entries.map(([, value]) => value));

  if (!total) {
    node.style.background = "#d9e2dd";
    legendNode.innerHTML = `<span class="legend-item">No data yet</span>`;
    return;
  }

  let cursor = 0;
  const stops = entries.map(([name, value]) => {
    const category = getCategory(name);
    const start = cursor;
    const end = cursor + (value / total) * 100;
    cursor = end;
    return `${category.color} ${start}% ${end}%`;
  });

  node.style.background = `conic-gradient(${stops.join(", ")})`;
  legendNode.innerHTML = entries
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => {
      const category = getCategory(name);
      return `<span class="legend-item"><span class="dot" style="background:${category.color}"></span>${escapeHtml(name)} ${Math.round((value / total) * 100)}%</span>`;
    })
    .join("");
}

function exportCsv() {
  const totals = getMonthAnalytics();
  const rows = [
    ["Month", selectedMonth],
    ["Income GBP", totals.income.toFixed(2)],
    ["Total tracked GBP", totals.totalTracked.toFixed(2)],
    ["Future You rate", `${Math.round(totals.futureRate)}%`],
    [],
    ["Date", "Description", "Category", "Framework", "Amount GBP", "Method", "Note"],
    ...totals.expenses.map((expense) => [
      expense.date,
      expense.description,
      expense.category,
      getCategory(expense.category).bucket,
      expense.amount.toFixed(2),
      expense.method,
      expense.note,
    ]),
    [],
    ["Recurring bill", "Category", "Framework", "Included automatically", "Amount GBP", "Due day"],
    ...totals.recurringBills.map((bill) => [
      bill.name,
      bill.category,
      getCategory(bill.category).bucket,
      "Yes",
      Number(bill.actualAmount || 0).toFixed(2),
      bill.dueDay,
    ]),
    [],
    ["Category", "Framework", "Actual GBP", "Budget GBP"],
    ...state.categories.map((category) => [
      category.name,
      category.bucket,
      Number(totals.categoryActuals[category.name] || 0).toFixed(2),
      Number(totals.categoryBudgets[category.name] || 0).toFixed(2),
    ]),
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `poundwise-wealth-${selectedMonth}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function seedDemoData() {
  const key = selectedMonth;
  const day = (value) => `${key}-${String(Math.min(daysInMonth(key), value)).padStart(2, "0")}`;

  state.categories = cloneDefaultCategories();
  state.monthly[key] = {
    income: 4200,
    currentWealth: 18450,
    wealthGoal: 100000,
    targets: { Needs: 50, Wants: 25, "Future You": 25 },
    categoryBudgets: Object.fromEntries(state.categories.map((category) => [category.name, category.budget])),
  };

  state.bills = [
    ["Rent", "Rent/Mortgage", 1050, 1],
    ["Council tax", "Council tax", 168, 5],
    ["Water bill", "Utilities", 38, 9],
    ["Energy bill", "Utilities", 132, 16],
    ["Phone and broadband", "Subscriptions", 44, 20],
  ].map(([name, category, amount, dueDay]) => ({ id: crypto.randomUUID(), name, category, amount, dueDay, demo: true }));

  state.expenses = state.expenses.filter((expense) => !expense.demo || monthKey(expense.date) !== key);
  [
    [2, "Weekly groceries", "Groceries", 74.2, "Debit card"],
    [3, "Train to work", "Transport", 18.4, "Debit card"],
    [4, "ISA transfer", "Investments", 650, "Investment account"],
    [5, "Emergency fund top-up", "Emergency fund", 200, "Bank transfer"],
    [6, "Coffee with client", "Eating out", 8.75, "Debit card"],
    [8, "Tesco top-up", "Groceries", 29.1, "Debit card"],
    [10, "Dinner out", "Eating out", 42.6, "Credit card"],
    [12, "Cinema", "Entertainment", 27.5, "Debit card"],
    [14, "Fuel", "Transport", 52.25, "Debit card"],
    [18, "Debt overpayment", "Debt overpayments", 100, "Bank transfer"],
    [19, "Work shirts", "Shopping", 64.99, "Credit card"],
  ].forEach(([date, description, category, amount, method]) => {
    state.expenses.push({
      id: crypto.randomUUID(),
      date: day(date),
      description,
      category,
      amount,
      method,
      note: "",
      demo: true,
    });
  });

  populateCategories();
  setDefaultCategoryValues();
  persist();
  render();
}

function updateExpenseBucketPreview() {
  const category = getCategory(els.expenseCategory.value);
  els.expenseBucketPreview.textContent = category.bucket;
}

function shiftMonth(delta) {
  const [year, month] = selectedMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  selectedMonth = monthKey(date);
  render();
}

function monthKey(value) {
  if (typeof value === "string") return value.slice(0, 7);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function todayIso() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthTitle(key) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function daysInMonth(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function normaliseMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number * 100) / 100) : 0;
}

function moneyInput(value) {
  return Number(value || 0).toFixed(2);
}

function compactCurrency(value) {
  if (value >= 1000) return `£${Math.round(value / 100) / 10}k`;
  return currency.format(value).replace(".00", "");
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function percentOf(value, total) {
  return total > 0 ? (Number(value || 0) / Number(total)) * 100 : 0;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function topCategory(totals) {
  const [name, value] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0] || ["No category", 0];
  return `${name} at ${currency.format(value)}`;
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function emptyHtml(message) {
  const node = els.emptyTemplate.content.cloneNode(true);
  node.querySelector("p").textContent = message;
  const wrapper = document.createElement("div");
  wrapper.append(node);
  return wrapper.innerHTML;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

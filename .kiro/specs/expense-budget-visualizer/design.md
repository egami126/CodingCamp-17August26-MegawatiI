# Design Document: Expense and Budget Visualizer

## Overview

The Expense and Budget Visualizer is a fully client-side single-page web application. There is no backend server; all data lives in the browser's Local Storage. The app lets users record expense transactions (item name, amount, category), view a running total balance, browse a scrollable transaction history, and understand spending distribution through an interactive pie chart powered by Chart.js.

**Technology stack**
- Structure: HTML5
- Styling: CSS3 — one file at `css/style.css`
- Logic: Vanilla JavaScript (ES2020+) — one file at `js/app.js`
- Charting: Chart.js loaded from CDN
- Persistence: `window.localStorage`
- Target browsers: Chrome, Firefox, Edge, Safari (current stable releases)

**Key design decisions**
1. *Single JS file, module-pattern organisation* — All application code lives in `js/app.js`. Internal concerns are separated by clearly named sections/functions rather than ES modules (no build step required). This keeps the file loadable directly from `file://` or any static host.
2. *Chart.js from CDN* — Avoids any local build tooling. A load-error listener on the `<script>` tag surfaces a graceful degradation message when the CDN is unreachable within 10 seconds.
3. *Immediate Local Storage writes* — Writes happen synchronously inside the same event handler that mutates the in-memory array, before any further interaction is processed, satisfying the persistence requirements.

---

## Architecture

The app follows a simple **event-driven, store-based** pattern:

```
 ┌──────────────────────────────────────────────────────┐
 │                    index.html                        │
 │  ┌────────────┐  ┌──────────────┐  ┌─────────────┐   │
 │  │ Input Form │  │ Balance Panel│  │   Pie Chart │   │
 │  └─────┬──────┘  └──────┬───────┘  └──────┬──────┘   │
 │        │                │                  │         │
 │  ┌─────▼────────────────▼──────────────────▼──────┐  │
 │  │                js/app.js                       │  │
 │  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐   │  │
 │  │  │ Store    │  │Validator │  │ ChartManager│   │  │
 │  │  │(in-mem + │  │          │  │ (Chart.js)  │   │  │
 │  │  │ LS sync) │  └──────────┘  └─────────────┘   │  │
 │  │  └──────────┘                                  │  │
 │  └────────────────────────────────────────────────┘  │
 │                    css/style.css                     │
 └──────────────────────────────────────────────────────┘
```

### Data flow

1. **Load** — App reads from Local Storage, populates the in-memory `transactions` array, then renders the list, balance, and chart.
2. **Add transaction** — Validator runs; on success the Store appends to the array, writes to Local Storage, then fires render updates for all three UI regions.
3. **Delete transaction** — Store removes the entry, writes to Local Storage, then fires render updates for all three UI regions.
4. **Render** — Three independent render functions (`renderList`, `renderBalance`, `renderChart`) are called after every mutation. They are cheap enough to be called on every change without debouncing for the expected data volumes (≤10,000 transactions).

---

## Components and Interfaces

### 1. Store (`transactions` array + Local Storage sync)

Holds the single source of truth: an in-memory array of `Transaction` objects.

```js
// Internal state
let transactions = [];           // Transaction[]
const LS_KEY = "transactions";

function loadFromStorage()       // reads LS, populates transactions[], handles parse errors
function saveToStorage()         // JSON.stringify(transactions) → LS, throws on failure
function addTransaction(tx)      // appends tx, calls saveToStorage(); if saveToStorage() throws, the appended entry is removed (rolled back) so the list is never updated when creation fails
function deleteTransaction(id)   // filters out tx by id, calls saveToStorage(); on LS failure the in-memory deletion is KEPT (not rolled back) and an error is surfaced to the user
```

### 2. Validator

Pure functions; no side effects.

```js
function validateName(name)      // → { valid: boolean, error: string|null }
function validateAmount(amount)  // → { valid: boolean, error: string|null }
function validateCategory(cat)   // → { valid: boolean, error: string|null }
function validateForm(name, amount, cat)
// → { valid: boolean, errors: { name, amount, category } }
```

**Validation rules**
| Field | Rule |
|-------|------|
| Item Name | Non-empty string; ≤100 characters |
| Amount | Numeric; 0.01 – 999,999.99; at most 2 decimal places |
| Category | One of `"Food"`, `"Transport"`, `"Fun"` |

### 3. Renderer — Transaction List

```js
function renderList()
// Reads global `transactions`, sorts descending by timestamp,
// rebuilds the <ul> innerHTML, attaches delete button listeners.
// Immediately applies overflow-y: scroll (or an equivalent CSS class)
// to the list container when the transaction count exceeds the visible
// area — this happens synchronously within the same call, before the
// next render cycle, so all transactions are reachable by scrolling
// as soon as the list is updated.
```

Each list item displays: item name, formatted amount (2 dp + currency symbol), category, and a delete button (`data-id` attribute links to transaction id).

### 4. Renderer — Total Balance

```js
function renderBalance()
// Sums all transaction amounts using reduce with a numeric accumulator.
// Formats to exactly 2 dp. Updates the balance <span> in the DOM.
```

Uses `Number.toFixed(2)` on the final sum. Intermediate arithmetic uses standard JS `Number` (IEEE 754 double); amounts are stored as strings to avoid floating-point drift on serialization.

### 5. ChartManager

```js
function initChart()             // creates Chart.js instance on first call; stores ref
function renderChart()           // calculates per-category totals, calls chart.data/update()
                                 // shows empty-state message when all totals are zero.
                                 // On every add or delete, visibility for ALL categories is
                                 // recalculated simultaneously — not just the affected category —
                                 // so the complete set of visible segments always reflects the
                                 // current state of all categories at once.
```

Chart.js lifecycle:
- `initChart()` is called once after the CDN script loads.
- `renderChart()` mutates the existing chart instance via `chart.data.datasets[0].data = [...]` and `chart.update()` — avoids destroying/recreating the canvas on every change.
- Categories with zero spending are excluded from `labels` and `data` arrays.
- When all categories are zero, the canvas is hidden and an empty-state `<p>` is shown.

### 6. Error Display Utilities

```js
function showFieldError(fieldId, message)   // adds error <span> next to field
function clearFieldErrors()                 // removes all error spans
function showAppError(message)              // shows a dismissible banner at top of page
function clearAppError()                    // removes the banner
```

### 7. CDN Fallback

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

```js
function handleChartLoadError()
// Sets a flag; shows an error banner; hides the chart container.
// Input_Form and Transaction_List remain fully functional.
```

A 10-second `setTimeout` set during page load calls `handleChartLoadError()` if `Chart` is still undefined by then, covering slow CDN responses (the only required failure mode per Requirement 7.6). The `onerror` attribute on the `<script>` tag is **not** used — network errors, invalid responses, and script execution errors are outside the scope of the required handling.

---

## Data Models

### Transaction object

```js
/**
 * @typedef {Object} Transaction
 * @property {string}  id        - UUID v4 (crypto.randomUUID() or Date.now()+Math.random() fallback)
 * @property {string}  name      - Item name (1–100 chars)
 * @property {string}  amount    - Decimal string e.g. "12.50" (preserves precision)
 * @property {string}  category  - "Food" | "Transport" | "Fun"
 * @property {number}  timestamp - Unix ms (Date.now()) at creation time, used for sort order
 */
```

**Design decision — amount as string**: Storing `amount` as a string (e.g. `"12.50"`) prevents floating-point rounding from corrupting the value through a JSON round-trip. When arithmetic is needed (balance sum, chart totals), amounts are parsed with `parseFloat()` at the point of use and rounded with `Math.round(val * 100) / 100` to stay accurate to 2 decimal places.

### Local Storage schema

```
Key:   "transactions"
Value: JSON array of Transaction objects

Example:
[
  {
    "id": "a1b2c3d4-...",
    "name": "Lunch",
    "amount": "12.50",
    "category": "Food",
    "timestamp": 1700000000000
  },
  ...
]
```

### Category enum

```js
const CATEGORIES = ["Food", "Transport", "Fun"];
// Used for dropdown population, validation, and chart label ordering.
```

### Chart data shape (passed to Chart.js)

```js
{
  labels: ["Food", "Fun"],           // only categories with amount > 0
  datasets: [{
    data:            [45.00, 20.00], // summed amounts per visible category
    backgroundColor: ["#FF6384", "#FFCE56", "#36A2EB"].filter(...)
  }]
}
```

Color map (fixed per category regardless of which categories appear):

| Category  | Color   |
|-----------|---------|
| Food      | #FF6384 |
| Transport | #36A2EB |
| Fun       | #FFCE56 |


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Validator accepts only well-formed inputs

*For any* triple of (name, amount, category) values, the Validator SHALL return `valid = true` if and only if the name is a non-empty string of at most 100 characters, the amount is a numeric string representing a value in [0.01, 999,999.99] with at most 2 decimal places, and the category is one of `"Food"`, `"Transport"`, or `"Fun"`. For every combination that fails any of these conditions the Validator SHALL return `valid = false` and no Transaction SHALL be created.

**Validates: Requirements 1.2, 1.3**

---

### Property 2: Adding a valid transaction grows the list by exactly one

*For any* transaction list and any valid (name, amount, category) triple, calling `addTransaction` SHALL increase the length of the in-memory `transactions` array by exactly 1, and the new entry SHALL have the same name, amount, and category as supplied.

**Validates: Requirements 1.4**

---

### Property 3: Transaction list sort order invariant

*For any* non-empty array of transactions, `renderList` SHALL produce a DOM list where each item appears in descending order of `timestamp` (most recently created first).

**Validates: Requirements 2.1**

---

### Property 4: Amount formatting invariant

*For any* transaction amount value (within the valid range), the formatted string produced by the display renderer SHALL contain exactly 2 decimal places and be prefixed with a currency symbol.

**Validates: Requirements 2.1**

---

### Property 5: Every rendered transaction item has a delete button

*For any* non-empty transaction array, every item rendered into the Transaction_List SHALL contain a delete button element whose `data-id` attribute matches that transaction's `id`.

**Validates: Requirements 2.5**

---

### Property 6: Deleting a transaction removes it from the list

*For any* transaction list containing at least one transaction, calling `deleteTransaction(id)` SHALL produce a resulting `transactions` array that does not contain any entry with that `id`, and the array length SHALL decrease by exactly 1.

**Validates: Requirements 3.1**

---

### Property 7: Total balance equals the sum of all transaction amounts

*For any* transaction array (including the empty array), the value displayed as Total_Balance SHALL equal the arithmetic sum of all `amount` values in the array, rounded to exactly 2 decimal places using round-half-up semantics. This invariant SHALL hold after every add and every delete operation.

**Validates: Requirements 4.1, 4.2, 3.2, 4.3**

---

### Property 8: Balance is always formatted to exactly 2 decimal places

*For any* collection of transaction amounts whose sum produces an intermediate result with more than 2 decimal places, the displayed Total_Balance SHALL be rounded to exactly 2 decimal places and SHALL NOT display trailing zeroes beyond the second decimal place in unexpected ways.

**Validates: Requirements 4.5**

---

### Property 9: Pie chart proportions match category spending shares

*For any* non-empty transaction array containing at least one positive-amount transaction, the data values supplied to Chart.js SHALL reflect the sum of amounts per category, and categories with zero total SHALL be absent from both the `labels` and `data` arrays. Categories with positive totals SHALL appear with the correct summed value.

**Validates: Requirements 5.1, 5.4, 5.8**

---

### Property 10: Transaction JSON serialization round-trip

*For any* valid array of Transaction objects (0 – 10,000 entries, each with a name of at most 255 characters and an amount with at most 2 decimal places), calling `JSON.stringify` followed by `JSON.parse` SHALL produce an array of equal length where every transaction has identical `id`, `name`, `amount`, and `category` field values.

**Validates: Requirements 6.5, 6.6**

---

### Property 11: Storage round-trip preserves the full transaction set

*For any* valid transaction array, calling `saveToStorage()` followed by `loadFromStorage()` SHALL restore the `transactions` array to a state that is deeply equal to the original array (same length, same field values for each entry in the same order).

**Validates: Requirements 6.1, 6.2, 6.3**

---

## Error Handling

### Local Storage unavailable or corrupt on load

- `loadFromStorage()` wraps `localStorage.getItem` and `JSON.parse` in a `try/catch`.
- On any error: `transactions` is set to `[]`, `renderBalance()` and `renderList()` display empty state, and `showAppError("Could not load saved data.")` is called.
- The app continues operating normally; new transactions can be added for the session.

### Local Storage write failure (add or delete)

- `saveToStorage()` wraps `localStorage.setItem` in a `try/catch`.
- **On add failure**: the appended entry is rolled back (removed from the array), the UI is re-rendered to reflect the rollback, and `showAppError("Could not save changes.")` is called. The transaction is never presented as successfully added.
- **On delete failure**: the in-memory deletion is **kept** (not rolled back). The UI reflects the updated state (transaction absent), but `showAppError("Could not persist deletion.")` is shown to inform the user the change was not saved to Local Storage.
- This satisfies Requirements 1.4, 2.6, 3.4, and 3.5.

### Invalid balance calculation

- `renderBalance()` iterates `transactions` with `parseFloat(tx.amount)`. If `parseFloat` returns `NaN` for any entry, that entry contributes `0` to the sum (via `isNaN` guard), the sum continues, and `showAppError("Balance could not be fully computed.")` is displayed.
- This satisfies Requirement 4.6.

### Chart.js CDN load failure

- An `onerror` handler on the `<script>` tag and a 10-second `setTimeout` guard both call `handleChartLoadError()`.
- The chart `<section>` is hidden; a visible error banner explains the chart is unavailable.
- Input form and transaction list remain fully functional (Requirement 7.6).

### Form validation errors

- Errors are displayed adjacent to their respective fields (inline, below the input).
- All error spans are cleared via `clearFieldErrors()` at the start of each submit handler, then re-populated for any failing fields.
- No transaction is created when any field fails validation (Requirement 1.3).

---

## Testing Strategy

### Dual testing approach

Both unit tests (example-based) and property-based tests are used. Unit tests cover specific examples, integration points, and error edge cases. Property tests verify universal invariants across randomized input spaces.

### Unit tests (example-based)

Focus areas:
- Empty state: form renders with blank placeholder, list shows empty message, balance shows `0.00`
- DOM structure: three form fields exist with correct attributes
- Error display: error spans appear adjacent to correct fields on invalid submit
- Chart legend: `legend.display` is `true` and color map matches the spec
- Empty chart state: all-zero totals → canvas hidden, empty-state message shown
- Local Storage parse error fallback: corrupted LS value → empty state + error banner
- CDN failure fallback: chart section hidden + error banner

### Property-based tests

Property-based testing library: **[fast-check](https://github.com/dubzzz/fast-check)** (loaded via CDN or inline for the test runner, or via `<script>` tag in a dedicated test HTML file).

Each property test runs a **minimum of 100 iterations**.

Each test is tagged with a comment in the format:
`// Feature: expense-budget-visualizer, Property <N>: <property_text>`

| Test | Property | Arbitraries used |
|------|----------|-----------------|
| Validator accepts/rejects correctly | Property 1 | `fc.string()`, `fc.float()`, `fc.constantFrom(...)` for valid and invalid values |
| Add grows list by 1 with correct fields | Property 2 | Valid (name, amount, category) triples |
| List sorted descending by timestamp | Property 3 | Arrays of transactions with random timestamps |
| Amount formatted to 2dp + currency | Property 4 | `fc.float({ min: 0.01, max: 999999.99 })` |
| Every item has a delete button | Property 5 | Non-empty transaction arrays |
| Delete removes correct entry | Property 6 | Non-empty transaction arrays, random index to delete |
| Balance equals sum of amounts | Property 7 | Transaction arrays with valid amounts (including empty array) |
| Balance always 2dp | Property 8 | Transaction amounts producing multi-dp sums |
| Chart data matches category sums | Property 9 | Transaction arrays with random category distributions |
| JSON serialization round-trip | Property 10 | Transaction arrays (0–10,000 entries) |
| Storage round-trip preserves array | Property 11 | Transaction arrays |

### Test file location

All tests live in a single `tests/` directory alongside the source. A `tests/index.html` file bootstraps fast-check from a CDN `<script>` tag and runs all tests in the browser console, requiring no build step.

### Browser compatibility verification

Manual smoke testing in Chrome, Firefox, Edge, and Safari covering:
- Page load and data restore from Local Storage
- Add / delete transaction flow
- Chart update after mutations
- CDN timeout fallback (throttle CDN in DevTools)
- Local Storage quota / unavailability simulation (DevTools → Application → clear storage)

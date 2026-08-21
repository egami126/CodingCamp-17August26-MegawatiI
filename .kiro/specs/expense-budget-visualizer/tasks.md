# Implementation Plan: Expense and Budget Visualizer

## Overview

Implement a fully client-side expense tracker using HTML5, CSS3, and Vanilla JavaScript (ES2020+). No build step, no backend, no frameworks. Chart.js is loaded from CDN; data is persisted in `window.localStorage`. The implementation follows the store-based, event-driven architecture described in the design document.

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` at the project root with semantic HTML5 markup
  - Include the `<header>` region containing the Total_Balance `<span>`
  - Include the Input_Form `<form>` with three fields: Item Name (`<input type="text" maxlength="100">`), Amount (`<input type="number">`), and Category (`<select>` with blank placeholder + Food / Transport / Fun options)
  - Include the Transaction_List `<ul>` region with an empty-state `<p>` placeholder
  - Include the Pie_Chart `<section>` containing a `<canvas>` and an empty-state `<p>`
  - Add a `<link>` tag referencing `css/style.css`
  - Add a `<script>` tag loading Chart.js from CDN (`https://cdn.jsdelivr.net/npm/chart.js`)
  - Add a `<script src="js/app.js" defer>` tag
  - _Requirements: 7.1, 7.2_

- [x] 2. Implement the Store (in-memory state + Local Storage sync)
  - [x] 2.1 Implement core Store functions in `js/app.js`
  - [x] 2.2 Write property test for storage round-trip (Property 11)
  - [x] 2.3 Write property test for JSON serialization round-trip (Property 10)

- [x] 3. Implement the Validator
  - [x] 3.1 Implement Validator pure functions in `js/app.js`
  - [x] 3.2 Write property test for the Validator (Property 1)

- [x] 4. Implement error display utilities
  - Implement `showFieldError`, `clearFieldErrors`, `showAppError`, and `clearAppError` in `js/app.js`

- [x] 5. Implement transaction list renderer and delete flow
  - [x] 5.1 Implement `renderList()` in `js/app.js`
  - [x] 5.2 Write property test for list sort order (Property 3)
  - [x] 5.3 Write property test: every rendered item has a delete button (Property 5)
  - [x] 5.4 Implement delete handler
  - [x] 5.5 Write property test for delete correctness (Property 6)

- [x] 6. Implement balance renderer
  - [x] 6.1 Implement `renderBalance()` in `js/app.js`
  - [x] 6.2 Write property test for balance sum (Property 7)
  - [x] 6.3 Write property test for balance formatting (Property 8)
  - [x] 6.4 Write property test for amount display formatting (Property 4)

- [x] 7. Checkpoint — core data layer complete

- [x] 8. Implement the form submit handler and add-transaction flow
  - [x] 8.1 Implement form submit handler in `js/app.js`
  - [x] 8.2 Write property test for add-transaction growth (Property 2)

- [x] 9. Implement ChartManager and pie chart renderer
  - [x] 9.1 Implement `initChart()` and `renderChart()` in `js/app.js`
  - [x] 9.2 Write property test for pie chart proportions (Property 9)

- [x] 10. Implement CDN fallback and app initialisation
  - Implement initialisation block in `js/app.js`

- [x] 11. Apply CSS styling in `css/style.css`
  - Style layout, form fields, buttons, transaction list, badges, chart card

- [x] 12. Set up browser-based test runner in `tests/index.html`

- [x] 13. Final checkpoint — all tests pass and wiring is complete

## Notes

- All tasks are client-side only and execute in the browser environment without build dependencies.
- Each task references specific requirements for traceability.
- Checkpoints validate core features incrementally.
- Amount values are handled as numbers formatted to 2 decimal places to ensure calculation accuracy.

## Tasks

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "5.1", "6.1"] },
    { "id": 3, "tasks": ["5.2", "5.3", "5.4", "6.2", "6.3", "6.4", "8.1", "9.1"] },
    { "id": 4, "tasks": ["5.5", "8.2", "9.2", "10"] },
    { "id": 5, "tasks": ["11", "12", "13"] }
  ]
}
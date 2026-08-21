# Requirements Document

## Introduction

The Expense and Budget Visualizer is a client-side web application that allows users to track personal expenses by category, view a running total balance, and visualize spending distribution through an interactive pie chart. The application runs entirely in the browser with no backend server, uses the browser's Local Storage API for data persistence, and is implemented with HTML, CSS, and Vanilla JavaScript only. It can be used as a standalone web page or packaged as a browser extension.

## Glossary

- **App**: The Expense and Budget Visualizer web application
- **Transaction**: A single expense record consisting of an Item Name, Amount, and Category
- **Transaction_List**: The scrollable UI component that displays all saved Transactions
- **Input_Form**: The UI form component that accepts user input for creating a new Transaction
- **Category**: One of three predefined expense types � Food, Transport, or Fun
- **Total_Balance**: The aggregate sum of all Transaction Amounts currently stored, displayed prominently at the top of the App
- **Pie_Chart**: A visual chart component that displays the proportional spending per Category using Chart.js
- **Local_Storage**: The browser's built-in Local Storage API used for client-side data persistence
- **Validator**: The client-side logic responsible for validating Input_Form fields before a Transaction is submitted

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to fill in a form with an item name, amount, and category, so that I can record a new expense transaction.

#### Acceptance Criteria

1. THE Input_Form SHALL display three fields: Item Name (text, maximum 100 characters), Amount (numeric), and Category (dropdown with options: Food, Transport, Fun), with a blank placeholder prompt as the default state for the Category dropdown.
2. WHEN the user submits the Input_Form, THE Validator SHALL check that the Item Name field is not empty, the Amount field contains a numeric value between 0.01 and 999,999.99 with at most 2 decimal places, and a Category option has been selected.
3. IF any Input_Form field is empty or invalid at submission, THEN THE Validator SHALL display an error message adjacent to each respective invalid field identifying whether it is missing or invalid, and SHALL NOT create a Transaction.
4. WHEN the Input_Form passes validation AND the Transaction creation step succeeds, THE App SHALL add the new Transaction with the provided Item Name, Amount, and Category to the Transaction_List; IF the Transaction creation step fails for any reason, THEN THE App SHALL NOT add any entry to the Transaction_List.
5. WHEN a Transaction is successfully added, THE Input_Form SHALL reset the Item Name and Amount fields to empty and reset the Category dropdown to its blank placeholder prompt.

---

### Requirement 2: Transaction List Display

**User Story:** As a user, I want to see a scrollable list of all my recorded transactions, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored Transactions sorted by date in descending order (most recent first), each showing the Item Name, Amount formatted as a decimal number with exactly 2 decimal places and a currency symbol, and Category.
2. WHEN a Transaction is added and the total number of Transactions exceeds the number that fit within the visible area, THE Transaction_List SHALL apply scrollable overflow immediately upon adding that Transaction, before the next render cycle completes, so that all Transactions are reachable by scrolling.
3. WHEN no Transactions exist, THE Transaction_List SHALL display a placeholder message indicating that no transactions have been added yet.
4. WHEN a Transaction is added, THE Transaction_List SHALL update to include the new Transaction within 1 second without requiring a page reload.
5. THE Transaction_List SHALL render each Transaction with a delete control (button or icon) that is visually co-located with that Transaction, and WHEN the delete control is activated, THE Transaction_List SHALL remove that Transaction from the list within 1 second without requiring a page reload.
6. IF a delete operation fails, THEN THE Transaction_List SHALL display an error message indicating the deletion was unsuccessful and retain the Transaction in the list.

---

### Requirement 3: Delete Transaction

**User Story:** As a user, I want to delete a transaction from the list, so that I can remove incorrect or unwanted entries.

#### Acceptance Criteria

1. WHEN the user activates the delete control for a Transaction, THE App SHALL remove that Transaction from the Transaction_List and display the updated Transaction_List with that entry absent.
2. WHEN a Transaction is deleted, THE App SHALL recalculate and display the Total_Balance reflecting the removal of that Transaction's Amount within 300ms.
3. WHEN a Transaction is deleted, THE App SHALL recalculate and display the Pie_Chart Category spending totals reflecting the removal of that Transaction's Amount within 300ms.
4. WHEN a Transaction is deleted, THE App SHALL attempt to persist the updated Transaction_List to Local_Storage, and IF the Local_Storage write fails for any reason including silent failures, THEN THE App SHALL display an error message to the user indicating the deletion could not be saved, and SHALL NOT present the deletion as successful to the user.
5. IF the Local_Storage write fails after a deletion, THEN THE App SHALL display the updated Total_Balance and Pie_Chart reflecting the deleted Transaction in the in-memory state, display an error message indicating the change could not be persisted, and SHALL NOT revert the in-memory Transaction_List to its pre-deletion state.

---

### Requirement 4: Total Balance Display

**User Story:** As a user, I want to see my total spending balance at the top of the page, so that I can quickly understand how much I have spent overall.

#### Acceptance Criteria

1. THE App SHALL display the Total_Balance at the top of the page as the sum of all Transaction Amounts, where the Total_Balance section appears before any Transaction list content in the page layout.
2. WHEN a Transaction is added, THE App SHALL recalculate and display the updated Total_Balance within 100 milliseconds, reflecting the new Transaction Amount included in the sum.
3. WHEN a Transaction is deleted, THE App SHALL recalculate and display the updated Total_Balance within 100 milliseconds, reflecting the removed Transaction Amount excluded from the sum.
4. WHEN no Transactions exist, THE App SHALL display a Total_Balance of 0.00.
5. THE App SHALL format the Total_Balance as a numeric value with exactly two decimal places, using rounding to the nearest cent for any intermediate calculation that produces more than two decimal places.
6. IF the sum of all Transaction Amounts cannot be calculated due to invalid or missing Transaction data, THEN THE App SHALL display the Total_Balance as 0.00 and indicate that the balance could not be computed.

---

### Requirement 5: Spending Distribution Pie Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can visually understand where my money is going.

#### Acceptance Criteria

1. THE Pie_Chart SHALL display one segment per Category (Food, Transport, Fun) proportional to the total Amount spent in that Category relative to all Transactions, with proportions rounded to two decimal places.
2. WHEN a Transaction is added, THE Pie_Chart SHALL update to reflect the new Category totals within 500 milliseconds without requiring a page reload.
3. WHEN a Transaction is deleted, THE Pie_Chart SHALL update to reflect the revised Category totals within 500 milliseconds without requiring a page reload.
4. WHEN any Transaction is added or deleted, THE Pie_Chart SHALL recalculate the visibility of all Category segments simultaneously, omitting every Category whose total spending is zero and including every Category whose total spending is greater than zero, so that the complete set of visible segments always reflects the current state of all Categories at once.
5. THE Pie_Chart SHALL render using Chart.js loaded from a CDN, requiring no local build step or package installation.
6. THE Pie_Chart SHALL display a legend identifying each visible Category by name and its associated color.
7. WHEN all Categories have zero spending, THE Pie_Chart SHALL display an empty-state message indicating no spending data is available, rather than rendering an empty chart.
8. THE Pie_Chart SHALL only include Transactions with positive Amount values greater than zero when calculating Category proportions.

---

### Requirement 6: Data Persistence via Local Storage

**User Story:** As a user, I want my transactions to be saved between sessions, so that my data is not lost when I close or refresh the browser tab.

#### Acceptance Criteria

1. WHEN a Transaction is created, THE App SHALL write the updated Transaction set to Local_Storage immediately after adding the Transaction, before any further user interaction is processed.
2. WHEN the App loads, THE App SHALL read the Transaction set from Local_Storage and populate the Transaction_List, Total_Balance, and Pie_Chart with the stored data within 500 milliseconds of the page load event.
3. WHEN a Transaction is deleted, THE App SHALL write the updated Transaction set to Local_Storage immediately after removing the Transaction, before any further user interaction is processed.
4. IF Local_Storage is unavailable or returns a parse error on load, THEN THE App SHALL initialize with an empty Transaction set (zero transactions, Total_Balance of 0.00), display a user-visible error message indicating data could not be loaded, and continue operating normally.
5. THE App SHALL store Transaction data as a JSON-serialized array in Local_Storage under the fixed key `"transactions"`, where each Transaction object contains at minimum the fields: id, name, amount, and category.
6. FOR ALL valid Transaction sets containing between 0 and 10,000 Transactions, where each Transaction has a name of at most 255 characters and an amount with at most 2 decimal places, serializing the Transaction set to JSON and then deserializing from JSON SHALL produce an equivalent Transaction set with identical id, name, amount, and category values for every Transaction.

---

### Requirement 7: Single-File Structure and Browser Compatibility

**User Story:** As a developer, I want the app to use a single CSS file and a single JavaScript file, so that the codebase stays clean and maintainable.

#### Acceptance Criteria

1. THE App SHALL reference exactly one CSS file located in a `css/` directory for all styling.
2. THE App SHALL reference exactly one JavaScript file located in a `js/` directory for all application logic.
3. THE App SHALL function correctly in the current stable releases of Chrome, Firefox, Edge, and Safari without polyfills or transpilation, where "function correctly" means all acceptance criteria in this document pass in each browser.
4. THE App SHALL load and become interactive within 3 seconds on a standard broadband connection (defined as a download speed of at least 25 Mbps) when Chart.js is loaded from a CDN, where "interactive" means the Input_Form accepts input and the Transaction_List and Pie_Chart are rendered and responsive to user actions.
5. WHEN the user interacts with the Input_Form, Transaction_List, or Pie_Chart, THE App SHALL reflect the interaction result within 100 milliseconds, measured from the triggering user event to the completion of a DOM update visible to the user, on a device with a CPU benchmark score equivalent to or greater than an Intel Core i5 (8th generation) running at its base clock speed.
6. IF the CDN request for Chart.js does not complete within 10 seconds, THEN THE App SHALL display an error message indicating that the chart library failed to load due to a timeout and that the Pie_Chart feature is unavailable, while the Input_Form and Transaction_List remain fully functional; other Chart.js failure modes such as network errors, invalid responses, or script execution errors are outside the scope of this criterion and are not required to trigger this error handling.
